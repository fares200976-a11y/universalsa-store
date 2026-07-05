declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const CURRENCY = "DZD";
const CONTENT_TYPE = "product";

type ContentId = string | number;

function track(event: string, params: Record<string, unknown>) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  try {
    window.fbq("track", event, params);
  } catch {
    /* never let analytics break the app */
  }
}

export function trackViewContent(id: ContentId, value: number) {
  track("ViewContent", {
    content_ids: [String(id)],
    content_type: CONTENT_TYPE,
    value,
    currency: CURRENCY,
  });
}

export function trackAddToCart(id: ContentId, value: number) {
  track("AddToCart", {
    content_ids: [String(id)],
    content_type: CONTENT_TYPE,
    value,
    currency: CURRENCY,
  });
}

export function trackInitiateCheckout(id: ContentId, value: number) {
  track("InitiateCheckout", {
    content_ids: [String(id)],
    content_type: CONTENT_TYPE,
    value,
    currency: CURRENCY,
  });
}

export function trackPurchase(id: ContentId, value: number) {
  track("Purchase", {
    content_ids: [String(id)],
    content_type: CONTENT_TYPE,
    value,
    currency: CURRENCY,
  });
}
