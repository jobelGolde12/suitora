# Feature Plan: Product URL Extraction

## 1. Feature Overview

- **Name:** Product URL Extraction
- **Current Status:** Fully functional (with 24h cache)
- **Primary Goal:** Let users paste a product link (Shopee, Lazada, Amazon, TikTok Shop, etc.) instead of manually downloading and uploading an image, reducing friction in the analysis flow.
- **Key Stakeholders:** End-users, product, partnership/affiliate team.

## 2. Current State Assessment (As-Is)

### Strengths
- Upload page supports “link” mode alongside image upload.
- `lib/ai/product-extraction.ts` with caching (`extractProductFromUrlCached`).
- Extracted products persisted in `products` table (source URL, title, brand, price, image, metadata).
- Analysis API accepts `productUrl` and links the resulting analysis to a `productId`.
- Tests present (`product-extraction.test.ts`).

### Pain Points & Bugs
- Scraping reliability varies by retailer (anti-bot, layout changes, region-specific pages).
- Some product pages yield multiple candidate images; primary image selection can be imperfect.
- Price/currency parsing is not always accurate across locales.
- Cache TTL of 24h may serve stale images if the merchant updates the listing.

### Missing Functionality
- Explicit retailer allow-list / block-list with friendly error messages.
- Manual image selection when multiple candidates are found.
- Affiliate parameter injection for supported partners.
- Background refresh of popular product metadata.

### Dependencies
- Network access from the server / edge.
- Products table and analysis pipeline.
- Rate limiting to prevent abuse as a free scraper.

## 3. Future State Plan (To-Be)

### Proposed Enhancements (Priority)
- **High:** Robust multi-retailer adapters with clear failure messages.
- **High:** User-selectable image when extraction returns multiple candidates.
- **Medium:** Affiliate link enrichment where commercial agreements exist.
- **Medium:** Structured metadata quality score and fallback to user upload.
- **Low:** Browser extension that pre-fills the URL from the current shopping tab.

### Required Fixes & Adjustments
- Improve error taxonomy (unsupported site, blocked, no image found, timeout).
- Log extraction success rates per domain for monitoring.
- Ensure rate limits and bot-detection mitigation (headers, retries, backoff).

### Refactoring & Technical Debt
- Keep provider/adapter pattern for each major retailer or use a reliable third-party extraction service if self-scraping becomes unsustainable.
- Isolate cache key design (`product:url:{encodedUrl}:id`).
- Expand test coverage with realistic HTML fixtures.

### KPIs for Success
- Extraction success rate ≥ 85% on top-10 target retailers.
- Median extraction latency < 3 s (cached < 200 ms).
- Reduction in “I couldn’t upload the product” support volume.

## 4. Actionable Roadmap

### Phase 1 – Reliability (1–2 weeks)
- [ ] Domain success-rate dashboard / logging (Small)
- [ ] Clearer error messages + “switch to upload” CTA (Small)
- [ ] Harden top 3–5 retailers (Medium)

### Phase 2 – UX (1 week)
- [ ] Multi-image candidate picker UI (Medium)
- [ ] Show extracted title/price preview before analysis (Small)

### Phase 3 – Monetization & Scale (later)
- [ ] Affiliate parameter support (Medium)
- [ ] Evaluate third-party extraction service vs. in-house (Large)

### Potential Risks & Mitigation
- **Risk:** Retailer blocks or ToS issues.  
  **Mitigation:** Respect robots.txt where applicable, rate-limit, prefer official APIs or partnerships, and always allow manual upload.
- **Risk:** Legal exposure from scraping.  
  **Mitigation:** Legal review of target markets; keep extraction server-side and limited to public product pages.
