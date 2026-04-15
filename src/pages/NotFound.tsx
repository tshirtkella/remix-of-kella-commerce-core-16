import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { usePageSection } from "@/hooks/usePageTemplates";

const NotFound = () => {
  const location = useLocation();
  const content = usePageSection("not_found", "content");

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">{content?.heading || "Page Not Found"}</h1>
        <p className="mb-4 text-xl text-muted-foreground">{content?.subtitle || "Sorry, we couldn't find what you're looking for."}</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          {content?.button_text || "Back to Home"}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
