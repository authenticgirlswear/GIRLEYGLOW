import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Read domain from siteConfig.ts
const siteConfigPath = path.join(__dirname, '../src/config/siteConfig.ts');
let domain = 'https://girleyglow-seven.vercel.app'; // fallback
if (fs.existsSync(siteConfigPath)) {
  const content = fs.readFileSync(siteConfigPath, 'utf8');
  const match = content.match(/domain:\s*['"]([^'"]+)['"]/);
  if (match && match[1]) {
    domain = match[1].replace(/\/$/, ''); // strip trailing slash
  }
}

// 2. Define static routes
const routes = [
  { path: '', changefreq: 'daily', priority: '1.0' },
  { path: 'shop', changefreq: 'daily', priority: '0.9' },
  { path: 'search', changefreq: 'daily', priority: '0.7' }
];

// 3. Extract categories from mockData.ts
const mockDataPath = path.join(__dirname, '../src/data/mockData.ts');
const categorySlugs = [];
if (fs.existsSync(mockDataPath)) {
  const content = fs.readFileSync(mockDataPath, 'utf8');
  const catSectionMatch = content.match(/export const categories: Category\[\] = \[([\s\S]+?)\];/);
  if (catSectionMatch) {
    const catSection = catSectionMatch[1];
    const slugMatches = catSection.matchAll(/slug:\s*['"]([^'"]+)['"]/g);
    const uniqueSlugs = new Set();
    for (const m of slugMatches) {
      uniqueSlugs.add(m[1]);
    }
    categorySlugs.push(...uniqueSlugs);
  }
}

// Fallbacks if regex parse failed
if (categorySlugs.length === 0) {
  categorySlugs.push('dresses', 'tops', 'skirts', 'evening-wear', 'outerwear', 'knitwear', 'pants');
}

// Add categories to routes
categorySlugs.forEach(slug => {
  routes.push({
    path: `category/${slug}`,
    changefreq: 'weekly',
    priority: '0.8'
  });
});

// Also try to extract product slugs to include product details in the sitemap for better SEO!
const productSlugs = [];
if (fs.existsSync(mockDataPath)) {
  const content = fs.readFileSync(mockDataPath, 'utf8');
  const prodSectionMatch = content.match(/export const products: Product\[\] = \[([\s\S]+?)\];/);
  if (prodSectionMatch) {
    const prodSection = prodSectionMatch[1];
    const slugMatches = prodSection.matchAll(/slug:\s*['"]([^'"]+)['"]/g);
    for (const m of slugMatches) {
      productSlugs.push(m[1]);
    }
  }
}

productSlugs.forEach(slug => {
  routes.push({
    path: `product/${slug}`,
    changefreq: 'weekly',
    priority: '0.6'
  });
});

// 4. Generate XML content
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(r => `  <url>
    <loc>${domain}/${r.path}</loc>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

// 5. Write to public/sitemap.xml
const outputPath = path.join(__dirname, '../public/sitemap.xml');
fs.writeFileSync(outputPath, xml.trim() + '\n', 'utf8');
console.log(`Successfully generated sitemap with ${routes.length} URLs at public/sitemap.xml`);
