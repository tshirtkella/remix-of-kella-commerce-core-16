import { useEffect } from "react";
import { useBranding } from "@/hooks/useBranding";

interface ProductMetaInput {
  name?: string;
  description?: string | null;
  image?: string;
  url?: string;
  price?: number | string;
  currency?: string;
}

/**
 * Sets per-product Open Graph + Twitter meta tags so links shared on
 * Facebook / WhatsApp / Messenger / X render a rich preview card.
 * Cleans up on unmount.
 */
export const useProductMeta = (product: ProductMetaInput | null | undefined) => {
  const { store_name } = useBranding();

  useEffect(() => {
    if (!product?.name) return;

    const prevTitle = document.title;
    const title = `${product.name} — ${store_name}`;
    document.title = title;

    const desc =
      (product.description && product.description.trim().slice(0, 160)) ||
      `Shop ${product.name} on ${store_name}.`;
    const image = product.image || "";
    const url = product.url || (typeof window !== "undefined" ? window.location.href : "");

    const tags: Array<{ attr: "name" | "property"; key: string; value: string }> = [
      { attr: "name", key: "description", value: desc },
      { attr: "property", key: "og:type", value: "product" },
      { attr: "property", key: "og:title", value: title },
      { attr: "property", key: "og:description", value: desc },
      { attr: "property", key: "og:url", value: url },
      { attr: "property", key: "og:site_name", value: store_name },
      { attr: "name", key: "twitter:card", value: "summary_large_image" },
      { attr: "name", key: "twitter:title", value: title },
      { attr: "name", key: "twitter:description", value: desc },
    ];
    if (image) {
      tags.push({ attr: "property", key: "og:image", value: image });
      tags.push({ attr: "name", key: "twitter:image", value: image });
    }
    if (product.price != null) {
      tags.push({ attr: "property", key: "product:price:amount", value: String(product.price) });
      tags.push({
        attr: "property",
        key: "product:price:currency",
        value: product.currency || "BDT",
      });
    }

    const created: HTMLMetaElement[] = [];
    const previous: Array<{ el: HTMLMetaElement; prev: string | null }> = [];

    tags.forEach(({ attr, key, value }) => {
      let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (el) {
        previous.push({ el, prev: el.getAttribute("content") });
        el.setAttribute("content", value);
      } else {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        el.setAttribute("content", value);
        document.head.appendChild(el);
        created.push(el);
      }
    });

    // Canonical link
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    let canonicalCreated = false;
    let canonicalPrev: string | null = null;
    if (url) {
      if (canonical) {
        canonicalPrev = canonical.getAttribute("href");
        canonical.setAttribute("href", url);
      } else {
        canonical = document.createElement("link");
        canonical.setAttribute("rel", "canonical");
        canonical.setAttribute("href", url);
        document.head.appendChild(canonical);
        canonicalCreated = true;
      }
    }

    return () => {
      document.title = prevTitle;
      created.forEach((el) => el.remove());
      previous.forEach(({ el, prev }) => {
        if (prev === null) el.removeAttribute("content");
        else el.setAttribute("content", prev);
      });
      if (canonical) {
        if (canonicalCreated) canonical.remove();
        else if (canonicalPrev !== null) canonical.setAttribute("href", canonicalPrev);
      }
    };
  }, [
    product?.name,
    product?.description,
    product?.image,
    product?.url,
    product?.price,
    product?.currency,
    store_name,
  ]);
};
