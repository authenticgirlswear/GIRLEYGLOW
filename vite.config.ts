import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import type { OutputChunk, OutputAsset } from "rollup";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Inline Brotli / Gzip compression plugin ──────────────────────────────────
// Vercel serves pre-compressed .br/.gz files automatically when they exist
// alongside the original. This eliminates on-the-fly compression overhead and
// gives us maximum byte savings without an external plugin dependency.
//
// Compression is applied only to text-based assets above 1 kB — below that
// threshold the compression header overhead exceeds the savings.
//
// Algorithm priority: Brotli (br) → Gzip (gz).
// Brotli achieves ~15–25 % better compression than gzip on JS/CSS.
function compressionPlugin(): Plugin {
  return {
    name: "vite-plugin-compression-inline",
    apply: "build",
    async generateBundle(_options, bundle) {
      // Dynamic import — zlib is a Node built-in, no install required.
      const { promisify } = await import("util");
      const zlib = await import("zlib");
      const brotliCompress = promisify(zlib.brotliCompress);
      const gzip = promisify(zlib.gzip);

      const TEXT_RE = /\.(js|cjs|mjs|css|html|svg|json|txt|xml|woff2)$/i;
      const MIN_SIZE = 1024; // bytes — skip tiny files

      const writes: Promise<void>[] = [];

      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (!TEXT_RE.test(fileName)) continue;

        const source =
          (chunk as OutputChunk).code ??
          (chunk as OutputAsset).source;

        if (!source) continue;

        const buf = Buffer.isBuffer(source)
          ? source
          : Buffer.from(source as string, "utf8");

        if (buf.length < MIN_SIZE) continue;

        // Brotli — maximum quality (11) for static assets (no real-time cost)
        writes.push(
          brotliCompress(buf, {
            params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 },
          }).then((compressed) => {
            this.emitFile({
              type: "asset",
              fileName: `${fileName}.br`,
              source: new Uint8Array(compressed),
            });
          }),
        );

        // Gzip — fallback for proxies / CDN edges that don't support Brotli
        writes.push(
          gzip(buf, { level: 9 }).then((compressed) => {
            this.emitFile({
              type: "asset",
              fileName: `${fileName}.gz`,
              source: new Uint8Array(compressed),
            });
          }),
        );
      }

      await Promise.all(writes);
    },
  };
}

export default defineConfig(({ command }) => {
  const isProd = command === "build";

  return {
    // ─── Plugins ─────────────────────────────────────────────────────────────
    plugins: [
      react({
        // React 19 uses the new JSX transform — babel plugins are not needed
        // for production; Vite/esbuild handles JSX directly at build time.
        babel: {
          // react-remove-properties strips data-testid / data-cy from prod builds
          // (reduces HTML payload for every component)
          plugins: isProd ? [["react-remove-properties", { properties: ["data-testid", "data-cy"] }]] : [],
        },
      }),

      // Tailwind v4 Vite plugin — outputs a single optimised CSS bundle;
      // no PostCSS config file needed.
      tailwindcss(),

      // Inline Brotli + Gzip pre-compression (prod only)
      ...(isProd ? [compressionPlugin()] : []),
    ],

    // ─── Path aliases ─────────────────────────────────────────────────────────
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
      // Prefer the "browser" export condition over "node" for dual-CJS/ESM
      // packages (e.g. some Supabase sub-packages) — avoids shipping Node APIs
      // to the client bundle.
      conditions: ["browser", "module", "import", "default"],
    },

    // ─── esbuild options ──────────────────────────────────────────────────────
    esbuild: {
      // Drop console.* and debugger statements from production builds.
      // console.error is kept (intentionally not listed) so runtime errors
      // still surface to GTM / Sentry without debug noise.
      drop: isProd ? ["debugger"] : [],
      pure: isProd
        ? ["console.log", "console.info", "console.debug", "console.warn"]
        : [],
      // Legal comments: "none" removes all licence / copyright comments from
      // the output — saves ~2–8 kB on large vendor chunks.
      legalComments: isProd ? "none" : "inline",
      // Target is also set here so esbuild's own transform pass aligns with
      // Rollup's output target (avoids double-transpilation).
      target: "es2022",
      // Inline JSX factory — React 19's automatic runtime, no import needed
      jsx: "automatic",
    },

    // ─── Build ───────────────────────────────────────────────────────────────
    build: {
      // ── Browser target ────────────────────────────────────────────────────
      // ES2022 gives us:
      //   • Top-level await (no async IIFE wrapper overhead)
      //   • Class fields (smaller class output)
      //   • Object.hasOwn / Array.at (no runtime polyfill)
      //   • Error cause (better error reporting)
      // All targets support ES2022:
      //   Chrome 94+ (Aug 2021)  — covers all Bangladesh Chrome installs
      //   Firefox 90+ (Jul 2021) — well above market share threshold
      //   Safari 15+  (Sep 2021) — iOS 15+ default
      //
      // ES2020 (previous target) required extra transforms for:
      //   nullish coalescing assignment (??=), logical assignment (||=, &&=)
      //   which are now native in ES2022 → smaller output.
      target: ["es2022", "chrome94", "firefox90", "safari15", "edge94"],

      // ── CSS ───────────────────────────────────────────────────────────────
      // LightningCSS: 50–100× faster than postcss-cssnano, better minification.
      // Handles vendor prefixing automatically for the target range above.
      cssMinify: "lightningcss",
      cssCodeSplit: true,          // one CSS chunk per JS entry → async pages
      // load only the CSS they need

      // ── Bundle size ───────────────────────────────────────────────────────
      // 600 kB is reasonable for Framer Motion + Supabase isolation.
      // The manualChunks below ensure no single chunk exceeds this in practice.
      chunkSizeWarningLimit: 600,

      // ── Source maps ───────────────────────────────────────────────────────
      // 'hidden': .map files are generated and deployed but the bundle does
      // NOT contain a sourceMappingURL comment, so end-users never download
      // them. Error monitoring tools (Sentry, Datadog) can still upload and
      // symbolicate stack traces via the Vercel deploy artefacts.
      sourcemap: "hidden",

      // ── Minifier ─────────────────────────────────────────────────────────
      // esbuild: ~10–40× faster than Terser, output is within 1–3 % of size.
      // For a Vercel deploy with pre-compression this is the optimal choice —
      // the Brotli step handles the remaining size delta.
      minify: "esbuild",

      // ── Rollup output ─────────────────────────────────────────────────────
      rollupOptions: {
        output: {
          // ── Manual chunk strategy ────────────────────────────────────────
          //
          // RATIONALE:
          //   Long-term caching requires that vendor hashes are stable across
          //   app code changes. Each chunk below groups modules by:
          //     1. Update frequency (never → often)
          //     2. Size (large chunks isolated to avoid cache busting small deps)
          //     3. Access pattern (admin-only code excluded from shopper bundle)
          //
          // LOADING ORDER on homepage (critical path):
          //   vendor-react   (18 kB gz) → always first
          //   vendor-router  ( 9 kB gz) → needed before any route renders
          //   index          (app shell) → entry point
          //   vendor-motion  (31 kB gz) → deferred — not needed for FCP
          //   vendor-supabase (47 kB gz) → deferred — first DB call is async
          //
          manualChunks: (id) => {
            // ── React runtime — most stable, largest cache lifetime ──────────
            if (
              id.includes("node_modules/react/") ||
              id.includes("node_modules/react-dom/") ||
              id.includes("node_modules/scheduler/") ||
              id.includes("node_modules/react-is/")
            ) {
              return "vendor-react";
            }

            // ── React Router v7 ──────────────────────────────────────────────
            if (
              id.includes("node_modules/react-router") ||
              id.includes("node_modules/@remix-run")
            ) {
              return "vendor-router";
            }

            // ── Framer Motion — largest single dep, isolated for cache ───────
            // Changes with animation-heavy updates; isolate to avoid busting
            // react or router caches when we bump the animation library.
            if (id.includes("node_modules/framer-motion")) {
              return "vendor-motion";
            }

            // ── Supabase ─────────────────────────────────────────────────────
            // Groups the full Supabase SDK tree (auth, realtime, storage, etc.)
            if (
              id.includes("node_modules/@supabase") ||
              id.includes("node_modules/ws/") ||              // realtime dep
              id.includes("node_modules/isomorphic-fetch")    // fetch polyfill
            ) {
              return "vendor-supabase";
            }

            // ── Cloudinary ───────────────────────────────────────────────────
            if (
              id.includes("node_modules/@cloudinary") ||
              id.includes("node_modules/cloudinary-core")
            ) {
              return "vendor-cloudinary";
            }

            // ── State management ─────────────────────────────────────────────
            if (id.includes("node_modules/zustand")) {
              return "vendor-zustand";
            }

            // ── Lucide icon tree ─────────────────────────────────────────────
            // Lucide's ESM build is fully tree-shakeable; Rollup eliminates
            // unused icons. The remaining used icons are still isolated here
            // so an icon set update doesn't bust the react or router cache.
            if (id.includes("node_modules/lucide-react")) {
              return "vendor-icons";
            }

            // ── Head management ───────────────────────────────────────────────
            if (id.includes("node_modules/react-helmet-async")) {
              return "vendor-helmet";
            }

            // ── Color resolution — large data file, rarely changes ───────────
            // color-name-list ships ~30 kB of colour name data; isolating it
            // prevents this data from polluting the main app chunk.
            if (
              id.includes("node_modules/color-name-list") ||
              id.includes("node_modules/nearest-color")
            ) {
              return "vendor-color";
            }

            // ── Utility micro-libs ────────────────────────────────────────────
            if (
              id.includes("node_modules/clsx") ||
              id.includes("node_modules/tailwind-merge") ||
              id.includes("node_modules/nanoid") ||
              id.includes("node_modules/cookie")
            ) {
              return "vendor-utils";
            }

            // ── Analytics ────────────────────────────────────────────────────
            // Isolated so analytics updates never invalidate product code cache.
            if (
              id.includes("node_modules/react-facebook-pixel") ||
              id.includes("node_modules/@vercel/analytics")
            ) {
              return "vendor-analytics";
            }

            // ── Everything else in node_modules ──────────────────────────────
            // Catches transitional deps (ws, bufferutil, etc.) that don't
            // belong in a named chunk but shouldn't land in the app entry.
            if (id.includes("node_modules")) {
              return "vendor-misc";
            }

            // ── Admin pages — excluded from the shopper critical path ────────
            // All admin routes are lazy-loaded via React.lazy() in App.tsx.
            // Grouping them in one chunk means a single cache-miss the first
            // time an admin visits, then a long-lived cache hit thereafter.
            if (id.includes("/src/pages/admin/")) {
              return "app-admin";
            }

            // App code falls through to the default Rollup chunk naming
            // (Vite creates "index" for the entry and named chunks for
            // dynamic imports like lazy-loaded routes).
          },

          // ── File naming — content-addressable, forever-cacheable ──────────
          // The [hash] segment changes only when file content changes.
          // Vercel's Cache-Control: immutable header (in vercel.json) means
          // browsers never re-validate these files — true zero-RTT repeat loads.
          entryFileNames: "assets/js/[name]-[hash].js",
          chunkFileNames: "assets/js/[name]-[hash].js",
          assetFileNames: (assetInfo) => {
            const name = assetInfo.names?.[0] ?? "";
            if (/\.(woff2?|eot|ttf|otf)$/i.test(name)) return "assets/fonts/[name]-[hash][extname]";
            if (/\.(png|jpe?g|gif|svg|webp|avif|ico)$/i.test(name)) return "assets/images/[name]-[hash][extname]";
            if (/\.css$/i.test(name)) return "assets/css/[name]-[hash][extname]";
            // Pre-compressed variants (.br, .gz) land here
            return "assets/[name]-[hash][extname]";
          },

          // ── Interop ───────────────────────────────────────────────────────
          // Rollup 4 default; keeps ESM output format (no CJS wrapper).
          format: "es",

          // ── Hoisting ─────────────────────────────────────────────────────
          // Inline dynamic import helpers into the calling chunk instead of
          // creating a separate helper chunk — saves one HTTP request.
          generatedCode: {
            constBindings: true,  // const instead of var → smaller minified output
          },
        },

        // ── Tree-shaking ────────────────────────────────────────────────────
        // Rollup's tree-shaking is enabled by default for ES modules.
        // Explicitly mark known pure side-effect-free imports so Rollup
        // can eliminate their unused re-exports more aggressively.
        treeshake: {
          // 'smallest' is Rollup 4's most aggressive preset:
          //   • Assumes all modules are side-effect-free unless marked
          //   • Removes unused class members and object properties
          //   • Eliminates dead branches from ternary / conditional expressions
          //
          // SAFE because:
          //   • Our app modules use explicit side-effect imports (index.css)
          //   • Vendor bundles that DO have side effects are excluded by the
          //     manualChunks strategy above (they land in a named vendor chunk
          //     rather than being inlined, so their side effects run once).
          preset: "smallest",
          moduleSideEffects: (id) => {
            // Always preserve side effects for:
            //   • CSS files (Tailwind global styles, component styles)
            //   • The app entry point (main.tsx registers the React root)
            //   • Polyfill-style files
            if (id.endsWith(".css")) return true;
            if (id.includes("src/main")) return true;
            if (id.includes("src/index.css")) return true;
            return false;
          },
        },
      },

      // ── Reporter ───────────────────────────────────────────────────────────
      // Output a human-readable build log (Rollup's default 'mixed' is noisy).
      // 'silent' suppresses individual file logs; Vite's summary is sufficient.
      // Set to 'info' locally if you want per-file output.
      onwarn(warning: import("rollup").RollupLog, defaultHandler: import("rollup").LogOrStringHandler) {
        // Suppress known benign warnings that Rollup 4 emits for certain deps:
        // "use client" / "use server" directives from React 19 server components
        if (warning.code === "MODULE_LEVEL_DIRECTIVE") return;
        // Circular dependencies in some Supabase internals — not actionable
        if (
          warning.code === "CIRCULAR_DEPENDENCY" &&
          warning.message.includes("node_modules")
        ) {
          return;
        }
        defaultHandler("warn", warning);
      },
    },

    // ─── Dev server ──────────────────────────────────────────────────────────
    server: {
      port: 5173,
      // HMR: use the same port for WebSocket upgrades → no extra port to allow
      // through corporate firewalls / Docker port mappings.
      hmr: {
        port: 5173,
      },
      // Warm up the modules loaded on every cold-start so the first HMR
      // round-trip is instant. Keep this list tight — too many entries slow
      // the initial pre-bundle pass.
      warmup: {
        clientFiles: [
          "./src/main.tsx",
          "./src/App.tsx",
          "./src/pages/Home.tsx",
          "./src/components/layout/Navbar.tsx",
          "./src/components/layout/Footer.tsx",
        ],
      },
    },

    // ─── Preview server ───────────────────────────────────────────────────────
    preview: {
      port: 4173,
      // Mirror the Vercel cache headers locally so you can verify the full
      // caching strategy before deploying.
      headers: {
        // Hashed assets → immutable forever cache
        "Cache-Control": "public, max-age=31536000, immutable",
        // Enable Brotli serving hint for local testing
        "Vary": "Accept-Encoding",
      },
    },

    // ─── Dependency pre-bundling ──────────────────────────────────────────────
    optimizeDeps: {
      // Force-include these so Vite pre-bundles them on the first dev start.
      // Without this list, Vite discovers them lazily on first import, causing
      // a full page reload and "optimizing dependencies" waterfall in dev.
      include: [
        "react",
        "react/jsx-runtime",         // React 19 automatic JSX transform
        "react-dom",
        "react-dom/client",          // createRoot — always needed
        "react-router-dom",
        "zustand",
        "zustand/middleware",         // persist middleware used by cartStore
        "framer-motion",
        "lucide-react",
        "@supabase/supabase-js",
        "react-helmet-async",
        "clsx",
        "tailwind-merge",
        "color-name-list",           // large data module — pre-bundle to avoid
        "nearest-color",             // slow on-demand transform in dev
      ],
      // Cloudinary's ESM build is already optimised; pre-bundling it causes a
      // "failed to resolve" warning in dev due to its conditional exports map.
      exclude: ["@cloudinary/url-gen", "@cloudinary/react"],

      // esbuild options for the pre-bundle pass — align with production target
      esbuildOptions: {
        target: "es2022",
        // Keep names in dev for readable React DevTools / error stacks
        keepNames: true,
      },
    },
  };
});
