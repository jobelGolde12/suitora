# `docs/trending_items_online.md`

# Suitora — Online Trending Items Integration

> **Purpose:** Define how Suitora retrieves, processes, stores, ranks, and displays **real-world trending fashion items** from online sources. This document extends the existing trend display system defined in **`docs/trend_display.md`** (or the Trend Outfit display documentation) and specifies the backend architecture required to power the **Trending Items** section on the dashboard.

**Audience**

* Frontend Developers
* Backend Developers
* AI Engineers
* Designers
* Contributors

**Related Documentation**

* `docs/trend_display.md`
* `docs/dashboard_feature_flow.md`
* `docs/data_schema.md`
* `docs/body_fit_match/main.md`
* `premium-editorial-ui.md`

---

# Table of Contents

1. Overview
2. Objectives
3. Architecture
4. Data Sources
5. Trend Service
6. Product Normalization
7. Database Schema
8. Trend Ranking
9. Dashboard Integration
10. Product Details
11. Caching Strategy
12. Scheduled Synchronization
13. Search & Filtering
14. Recommendation Integration
15. Future Expansion
16. File Structure
17. Implementation Checklist

---

# 1. Overview

Unlike Trend Outfits, which are generated from user analyses, **Trending Items** originate from online fashion sources.

Suitora periodically collects fashion products, standardizes them into a common format, and displays them inside the application.

The dashboard should never fetch third-party APIs directly.

Instead, it should communicate only with the application's own backend.

```
Fashion API
      │
      ▼
Trend Synchronization Service
      │
      ▼
Normalization Pipeline
      │
      ▼
Database
      │
      ▼
Next.js API
      │
      ▼
Dashboard
```

---

# 2. Objectives

The system must:

* Display trending fashion items.

* Display editorial collections.

* Display seasonal trends.

* Display category-specific trends.

* Display worldwide trends.

* Display products from multiple providers.

* Avoid exposing third-party API keys to the client.

---

# 3. Architecture

The trend system consists of five layers.

```
External Providers

↓

Trend Fetch Service

↓

Normalization Service

↓

Database

↓

Next.js Dashboard
```

Each layer has a single responsibility.

---

# 4. Data Sources

Suitora is provider-agnostic.

It may retrieve products from one or many providers.

Examples include:

* Fashion APIs
* Shopify partner stores
* Brand product feeds
* Affiliate product APIs
* Editorial collections
* Internal curated datasets

Every provider must be converted into the same internal structure.

The frontend must never depend on a provider-specific response.

---

# 5. Trend Fetch Service

A dedicated service periodically downloads trending products.

Responsibilities:

* Authenticate with providers
* Download products
* Download images
* Download metadata
* Remove duplicate items
* Detect unavailable products
* Retry failed requests
* Log synchronization status

This service is not accessible from the frontend.

---

# 6. Product Normalization

Every provider returns different fields.

Suitora converts every response into one standard model.

Example:

```ts
TrendItem

id

title

brand

category

subcategory

gender

imageUrl

productUrl

colors[]

styleTags[]

price

currency

provider

providerId

popularityScore

season

occasion

description

createdAt

updatedAt
```

This normalized model is the only format used by the application.

---

# 7. Database Schema

A new table should store synchronized trend items.

```
trend_items

id

provider

providerId

title

brand

description

category

subcategory

gender

imageUrl

productUrl

price

currency

season

occasion

styleTags

colors

popularityScore

isFeatured

isAvailable

lastSynced

createdAt

updatedAt
```

Additional tables may include:

```
trend_categories

trend_collections

trend_providers

trend_sync_logs
```

---

# 8. Trend Ranking

Dashboard items should be ranked before being returned.

Ranking signals may include:

* Featured by administrator
* Provider popularity
* Recent trend score
* Seasonal relevance
* Category popularity
* Editorial priority

The backend is responsible for ranking.

The frontend simply renders the ordered list.

---

# 9. Dashboard Integration

The Dashboard Overview page should request trending items from the application's own API.

```
GET

/api/trending
```

Optional query parameters:

```
limit=12

category=tops

season=summer

gender=women

featured=true
```

The endpoint returns normalized TrendItem objects.

The dashboard renders them using the existing card components described in the trend display documentation.

No third-party APIs should be called from React components.

---

# 10. Product Details

Selecting a trending item opens a detail page.

```
Trending Item

↓

Item Information

↓

Compatibility Analysis

↓

Similar Items

↓

Complete the Look
```

The product detail page should integrate with the existing Suitora analysis flow.

Examples:

* Analyze this item
* Upload yourself wearing similar clothing
* Virtual Try-On
* Save to Favorites

---

# 11. Caching Strategy

To minimize provider requests:

* Synchronize data on a schedule.
* Cache normalized items.
* Serve cached data to the frontend.

Expired items should be replaced during synchronization.

Dashboard requests should never depend on real-time provider responses.

---

# 12. Scheduled Synchronization

Synchronization should run automatically.

Typical intervals:

* Every hour
* Every six hours
* Daily

Synchronization tasks:

1. Fetch products
2. Normalize products
3. Update database
4. Remove discontinued products
5. Refresh rankings
6. Generate dashboard cache

---

# 13. Search & Filtering

The Trending Items section should support filtering by:

Category

Season

Occasion

Gender

Brand

Color

Style

Featured

Popularity

Newest

The backend should perform filtering.

---

# 14. Recommendation Integration

Trending items connect directly with existing Suitora features.

Examples:

After body analysis:

```
Recommended Trending Items
```

After outfit analysis:

```
Trending alternatives
```

Virtual Try-On:

```
Try this trending item
```

Complete the Look:

```
Trending accessories
```

This allows the existing recommendation engine to reuse the TrendItem model.

---

# 15. Future Expansion

Future versions may include:

* Personalized trends
* AI-generated rankings
* Country-specific trends
* Trending by age group
* Trending by body type
* Influencer collections
* Brand partnerships
* Live fashion events
* User behavior ranking
* Machine-learning recommendations

These features should extend the existing TrendItem model instead of replacing it.

---

# 16. File Structure

Suggested additions:

```
app/
    api/
        trending/
            route.ts

components/
    trending/
        TrendingCarousel.tsx
        TrendingGrid.tsx
        TrendingCard.tsx
        TrendingCollection.tsx
        TrendingFilters.tsx

lib/
    trend/
        fetch.ts
        normalize.ts
        ranking.ts
        cache.ts
        providers/

types/
    trend.ts

config/
    trend-providers.ts

jobs/
    trend-sync.ts
```

---

# 17. Implementation Checklist

## Backend

* Create TrendItem schema
* Create trend_items table
* Implement provider adapters
* Implement normalization pipeline
* Implement ranking service
* Implement synchronization jobs
* Implement cache layer
* Create `/api/trending`
* Create `/api/trending/[id]`

## Frontend

* Create TrendingCard
* Create TrendingCarousel
* Create TrendingGrid
* Create TrendingCollection
* Create filter bar
* Connect dashboard to `/api/trending`
* Add loading skeletons
* Add empty states
* Add product detail page

## Integration

* Connect body analysis recommendations
* Connect virtual try-on
* Connect outfit recommendations
* Connect favorites
* Connect history
* Connect "Complete the Look"

---

# Relationship to Existing Documentation

This document extends the existing trend display documentation rather than replacing it.

Responsibilities are divided as follows:

| Document                        | Responsibility                                                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `docs/trend_display.md`         | Defines how trend items and trend outfits are visually displayed throughout the application.                                               |
| `docs/trending_items_online.md` | Defines how online trending fashion items are retrieved, normalized, synchronized, stored, ranked, and exposed to the Next.js application. |

Together, these documents establish the complete workflow:

```
Online Fashion Providers
        │
        ▼
Trend Synchronization Service
        │
        ▼
Normalization Pipeline
        │
        ▼
Database
        │
        ▼
Next.js API Routes
        │
        ▼
Dashboard Trending Items
        │
        ▼
Trend Display Components
        │
        ▼
Body Analysis • Virtual Try-On • Trend Outfits • Recommendations
```

This separation keeps the architecture modular: one document specifies **how trend data enters the system**, while the existing display documentation specifies **how that data is presented throughout Suitora**.
