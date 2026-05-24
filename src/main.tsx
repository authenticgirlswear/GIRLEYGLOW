import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { useContentStore, useCategoryStore } from '@/store';
import { initFacebookPixel } from '@/lib/facebookPixel';

initFacebookPixel();

function Root() {
  const loadContent = useContentStore((s) => s.loadContent);
  const loadCategories = useCategoryStore((s) => s.loadCategories);

  useEffect(() => {
    loadContent();
    loadCategories();
  }, []);

  return <App />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);