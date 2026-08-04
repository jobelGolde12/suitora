import { describe, it, expect, vi, afterEach } from "vitest";
import { extractProductFromUrl } from "./product-extraction";

const sampleHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Cotton Wrap Dress | Serene & Co</title>
  <meta property="og:title" content="Serene Wrap Dress">
  <meta property="og:image" content="https://cdn.example.com/dress.jpg">
  <meta property="og:site_name" content="Serene">
  <meta property="product:price:amount" content="89.00">
  <meta property="product:price:currency" content="USD">
  <script type="application/ld+json">
  {
    "@type": "Product",
    "name": "Serene Wrap Dress",
    "brand": { "name": "Serene" },
    "image": "https://cdn.example.com/dress-ld.jpg",
    "offers": { "price": "89.00", "priceCurrency": "USD" },
    "color": ["Sage", "Sand"],
    "size": ["S", "M", "L"]
  }
  </script>
</head>
<body></body>
</html>`;

function stubFetch(body: string, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      text: async () => body,
    })
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("extractProductFromUrl", () => {
  it("rejects non-HTTP URLs", async () => {
    await expect(extractProductFromUrl("not-a-url")).rejects.toThrow(
      "Invalid URL"
    );
  });

  it("extracts product data from JSON-LD and OG tags", async () => {
    stubFetch(sampleHtml);

    const product = await extractProductFromUrl("https://serene.example/dress");

    expect(product.title).toBe("Serene Wrap Dress");
    expect(product.brand).toBe("Serene");
    expect(product.priceCents).toBe(8900);
    expect(product.currency).toBe("USD");
    expect(product.imageUrl).toBe("https://cdn.example.com/dress.jpg");
    expect(product.metadata.source).toBe("json-ld");
    expect(product.metadata.colors).toEqual(["Sage", "Sand"]);
    expect(product.metadata.sizes).toEqual(["S", "M", "L"]);
  });

  it("falls back to placeholder when no image is found", async () => {
    stubFetch("<html><head><title>Plain Page</title></head></html>");

    const product = await extractProductFromUrl("https://plain.example/item");
    expect(product.imageUrl).toBe("/placeholder.svg");
  });

  it("throws a readable error on HTTP failure", async () => {
    stubFetch("<html></html>", 404);
    await expect(
      extractProductFromUrl("https://serene.example/missing")
    ).rejects.toThrow("HTTP 404");
  });
});
