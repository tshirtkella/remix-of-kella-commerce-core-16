import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import StoreHeader from "@/components/storefront/StoreHeader";
import StoreFooter from "@/components/storefront/StoreFooter";
import { usePageSection } from "@/hooks/usePageTemplates";
import { Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface LegalPageProps {
  pageKey: "terms" | "privacy" | "shipping" | "refund";
}

const FALLBACK: Record<string, { heading: string; subtitle: string; body: string }> = {
  terms: { heading: "Terms of Service", subtitle: "Loading...", body: "" },
  privacy: { heading: "Privacy Policy", subtitle: "Loading...", body: "" },
  shipping: { heading: "Shipping Policy", subtitle: "Loading...", body: "" },
  refund: { heading: "Refund & Return Policy", subtitle: "Loading...", body: "" },
};

const LegalPage = ({ pageKey }: LegalPageProps) => {
  const content = usePageSection(pageKey, "content");
  const location = useLocation();

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  const fallback = FALLBACK[pageKey];
  const heading = content?.heading || fallback.heading;
  const subtitle = content?.subtitle || fallback.subtitle;
  const lastUpdated = content?.last_updated || "";
  const body = content?.body || "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StoreHeader />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-background border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold font-heading mb-3">{heading}</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-4 italic">{lastUpdated}</p>
          )}
        </div>
      </section>

      {/* Body */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {!body ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <article className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-headings:font-heading prose-headings:font-semibold prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
          </article>
        )}
      </main>

      <StoreFooter />
    </div>
  );
};

export default LegalPage;
