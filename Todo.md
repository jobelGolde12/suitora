# Suitora — Website Feature Improvements & Roadmap

> **Purpose:** Detailed improvement suggestions for existing features and prioritized recommendations for new features to implement next.
> **Last Updated:** December 2025
> **Based On:** README.md, docs/project_detail.md, docs/future_features_implementation.md, docs/data_schema.md, premium-editorial-ui.md

---

## Executive Summary

Suitora has successfully completed Phase 1 MVP with a solid foundation. The platform is well-positioned to transition from MVP to a production-ready AI fashion assistant.

**Current Status:**
- Phase 1 MVP: Complete (UI + mock AI)
- Phase 2: Partially implemented (real AI integration in progress)
- Phase 3: Planned
- Future: Long-term vision defined

**Critical Blockers Before Scaling:**
1. Database schema alignment with canonical docs/data_schema.md
2. Real persistence for analyses and favorites
3. Production-ready AI pipeline with fallback strategies

---

## Part 1: Existing Feature Improvements

### 1.1 Landing Page Enhancements

| Priority | Improvement | Impact | Effort | Details |
|----------|-------------|--------|--------|---------|
| High | Add social proof section | Conversion | Low | User testimonials, before/after galleries |
| High | Interactive demo widget | Engagement | Medium | Try limited analysis without signup |
| Medium | Video walkthrough | Conversion | Medium | 60-90s explainer video |
| Medium | Dynamic pricing preview | Transparency | Low | Show free vs premium benefits |
| Low | Blog/content hub | SEO | High | Fashion tips, style guides |

### 1.2 Authentication Flow Improvements

| Priority | Improvement | Impact | Effort | Details |
|----------|-------------|--------|--------|---------|
| High | Social auth (Google, Apple) | Friction | Medium | Reduce signup friction 40-60% |
| High | Passwordless login (magic link) | UX | Medium | Email-based magic links |
| Medium | Progressive profiling | Completion | Low | Collect minimal info at signup |
| Low | Two-factor authentication | Security | Medium | TOTP or SMS-based 2FA |

### 1.3 Dashboard Experience

| Priority | Improvement | Impact | Effort | Details |
|----------|-------------|--------|--------|---------|
| High | Personalized welcome message | Engagement | Low | Contextual greeting |
| High | Quick stats visualization | Clarity | Medium | Mini charts showing score trends |
| High | Contextual tips based on usage | Retention | Medium | Usage-based suggestions |
| Medium | Goal setting / challenges | Gamification | High | Weekly targets with badges |

### 1.4 Upload & Analysis Flow

| Priority | Improvement | Impact | Effort | Details |
|----------|-------------|--------|--------|---------|
| Critical | Real AI integration | Core functionality | High | Replace mock with OpenAI/Gemini Vision |
| Critical | Product URL extraction | Convenience | High | Auto-extract from e-commerce URLs |
| High | Multi-image upload (outfit sets) | Utility | Medium | Upload full outfit |
| High | Camera capture on mobile | Accessibility | Low | Device camera API |
| Medium | Clothing category detection | Accuracy | Medium | Auto-tag item type |

### 1.5 Results Page Optimization

| Priority | Improvement | Impact | Effort | Details |
|----------|-------------|--------|--------|---------|
| High | Shareable result cards | Virality | Medium | Social-media-ready images |
| High | Why this score explanations | Trust | Medium | AI-generated breakdown |
| High | Alternative styling suggestions | Utility | Medium | Styling tips |
| Medium | Side-by-side comparison toggle | Clarity | Low | Slider comparison |
| Medium | Similar items from affiliates | Monetization | High | Shop similar section |

### 1.6 History & Favorites Management

| Priority | Improvement | Impact | Effort | Details |
|----------|-------------|--------|--------|---------|
| High | Advanced filters | Findability | Medium | Score range, date, category |
| High | Wardrobe organization | Utility | Medium | Folders/tags |
| High | Bulk actions | Efficiency | Low | Batch operations |
| Medium | Export data (CSV, PDF) | Portability | Medium | Download analysis data |
| Medium | Archive instead of delete | Safety | Low | Soft-delete with recovery |

### 1.7 Settings & Profile Page

| Priority | Improvement | Impact | Effort | Details |
|----------|-------------|--------|--------|---------|
| High | Body measurements input | Accuracy | Low | Height, weight, chest, waist, hip |
| High | Style preferences quiz | Personalization | Medium | Onboarding questionnaire |
| Medium | Notification preferences | Control | Low | Email/push settings |
| Medium | Privacy controls | Trust | Medium | Data retention, download/delete |

---

## Part 2: New Features to Add Next (Prioritized)

### Priority Framework: RICE Scoring

RICE Score = (Reach x Impact x Confidence) / Effort

### Tier 1: Immediate Next Steps (Next 4-6 Weeks)

#### 2.1 Real AI Vision Integration (RICE: 9.6) - CRITICAL

**Status:** In Progress

**What:** Replace mock analysis with actual OpenAI Vision / Gemini Vision API calls.

**Implementation Steps:**
1. Create lib/ai/vision.ts with provider abstraction
2. Implement OpenAI Vision and Gemini Vision adapters
3. Add environment-based provider selection + fallback
4. Map model output to canonical fields
5. Handle rate limits, retries, graceful degradation
6. Update analysis page to poll real status
7. Add cost tracking per analysis

**Acceptance Criteria:**
- Analysis returns within 10 seconds (p95)
- Fallback to mock if API fails
- Cost per analysis < $0.05

**Estimated Effort:** 2-3 weeks

#### 2.2 Database Persistence Alignment (RICE: 9.2) - CRITICAL

**Status:** Not Started

**What:** Make analyses and favorites fully database-backed.

**Implementation Steps:**
1. Update drizzle/schema.ts to match canonical schema
2. Generate and apply migration
3. Implement server actions/route handlers for CRUD
4. Wire UI to fetch from DB

**Acceptance Criteria:**
- Creating analysis writes real row with status progression
- Favoriting persists after reload
- No more mock_result_... IDs
- Queries respond in < 200ms (p95)

**Estimated Effort:** 1-2 weeks

#### 2.3 Product URL Extraction (RICE: 8.4) - HIGH

**Status:** Partially Done

**What:** Allow users to paste e-commerce URLs and auto-extract clothing images.

**Implementation Steps:**
1. Add URL input field on Upload page
2. Build server-side scraper service
3. Store extracted data in products table
4. Cache mapping with 24h TTL
5. Add fallback for failed extractions

**Estimated Effort:** 1-2 weeks

#### 2.4 Height & Weight Estimation (RICE: 7.8) - HIGH

**Status:** Planned

**What:** Estimate user's height and weight from uploaded photo.

**Implementation Options:**
- Option A (Preferred): Vision LLM + calibration heuristics
- Option B: Classical geometric estimation (MediaPipe Pose)

**Integration Points:**
- Run during user-photo analysis
- Store in compatibility_metadata
- Feed into Body Fit Score calculation

**Estimated Effort:** 1-2 weeks (Option A)

---

### Tier 2: Short-Term (6-12 Weeks)

#### 2.5 AI Stylist Chatbot (RICE: 7.2) - HIGH

**Features:**
- Chat interface on dashboard or dedicated /stylist page
- Context-aware (past analyses, body metrics, wardrobe)
- Tool-calling capable
- Persist chat history
- Suggested prompts for new users

**Monetization:** Free tier: 10 messages/month; Premium: unlimited

**Estimated Effort:** 3-4 weeks

#### 2.6 Multiple Outfit Comparison (RICE: 6.8) - MEDIUM

**What:** Compare 2-4 clothing items side-by-side.

**Implementation:**
1. Extend Upload flow for multiple items
2. Run parallel analyses
3. Comparison results view with winner highlight

**Estimated Effort:** 2-3 weeks

#### 2.7 Color Palette Recommendations (RICE: 6.4) - MEDIUM

**What:** Derive personal color palette from skin tone analysis.

**Implementation:**
1. Determine seasonal color type (Spring/Summer/Autumn/Winter)
2. Generate palette swatches (best, avoid, neutrals)
3. Display on Results page with visual swatches

**Estimated Effort:** 1-2 weeks

#### 2.8 Wardrobe Management System (RICE: 6.0) - MEDIUM

**Features:**
- Mark analyses as "in wardrobe"
- Create custom folders (Work, Casual, Date Night)
- Tag items
- Visual wardrobe grid
- Outfit builder: drag-and-drop
- Packing list generator

**Estimated Effort:** 3-4 weeks

---

### Tier 3: Medium-Term (3-6 Months)

#### 2.9 Outfit Recommendation Engine (RICE: 5.6) - MEDIUM

**What:** Given user's wardrobe + event, generate complete outfit suggestions.

**Estimated Effort:** 4-6 weeks

#### 2.10 Similar Clothing Suggestions (RICE: 5.2) - MEDIUM

**Next Steps:**
1. Embedding-based similarity search (CLIP model)
2. Store in vector DB (Pinecone, Weaviate)
3. Partner with affiliate networks

**Estimated Effort:** 3-4 weeks

#### 2.11 Seasonal Fashion Advice (RICE: 4.8) - LOW-MEDIUM

**Features:**
- Homepage banners with seasonal tips
- Email digests
- Location-aware suggestions

**Estimated Effort:** 2-3 weeks

---

### Tier 4: Long-Term Vision (6-12+ Months)

#### 2.12 AI Virtual Try-On Engine (RICE: 8.0) - STRATEGIC

**What:** Real, Fotor-style Latent Diffusion try-on.

**License Gate:** IDM-VTON / CatVTON are non-commercial. Requires commercial license, permissive fine-tune, or SaaS VTON API.

**Estimated Effort:** 6-8 weeks

#### 2.13 Mobile App (React Native) (RICE: 5.5) - MEDIUM

**MVP Features:**
- Photo upload + analysis
- View history/favorites
- Push notifications
- Camera capture with auto-crop

**Estimated Effort:** 8-12 weeks

#### 2.14 Chrome Extension (RICE: 4.5) - LOW-MEDIUM

**What:** Browser shopping assistant injecting "Does this suit me?" button.

**Estimated Effort:** 3-4 weeks

#### 2.15 Social Sharing & Community (RICE: 4.0) - LOW

**Privacy Review Required:** Opt-in sharing only, blur faces by default, moderation system.

**Estimated Effort:** 4-6 weeks

#### 2.16 Affiliate Integration (RICE: 6.5) - MEDIUM-HIGH

**Revenue Model:** 3-8% commission on fashion items, $5-10 per converted recommendation.

**Estimated Effort:** 2-3 weeks

---

## Part 3: Implementation Roadmap

### Quarter 1 (Weeks 1-12): Foundation & Core AI

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1-2 | DB Schema Alignment | Migrated schema, server actions |
| 3-5 | Real AI Vision | OpenAI/Gemini integration |
| 6-7 | Product URL Extraction | Scraper service, caching |
| 8-9 | Height/Weight Estimation | Vision-based estimation |
| 10-12 | Polish & Testing | Bug fixes, optimization |

**Success Metrics:** 95% real AI usage, <10s analysis time, zero data loss

### Quarter 2 (Weeks 13-24): Engagement & Personalization

| Week | Focus | Deliverables |
|------|-------|--------------|
| 13-16 | AI Stylist Chatbot | Chat interface, history |
| 17-19 | Multi-Item Comparison | Comparison UI |
| 20-22 | Color Palette System | Seasonal typing |
| 23-24 | Wardrobe Management | Folders, tags, outfit builder |

**Success Metrics:** 30% chatbot engagement, 40% wardrobe adoption

### Quarter 3 (Weeks 25-36): Monetization & Scale

| Week | Focus | Deliverables |
|------|-------|--------------|
| 25-28 | Outfit Recommendations | Occasion-based suggestions |
| 29-31 | Similar Items + Affiliates | Embedding search, commissions |
| 32-34 | Seasonal Content | CMS, email digests |
| 35-36 | VTON Pilot | License, GPU setup |

**Success Metrics:** $1000+ monthly affiliate revenue

### Quarter 4 (Weeks 37-52): Platform Expansion

| Week | Focus | Deliverables |
|------|-------|--------------|
| 37-42 | Mobile App MVP | React Native app |
| 43-46 | Chrome Extension | Browser injection |
| 47-50 | Social Features | Profiles, sharing |
| 51-52 | Analytics | A/B testing, funnel analysis |

---

## Part 4: Success Metrics & KPIs

### Product Health Metrics

| Metric | Q1 Target | Q2 Target | Q4 Target |
|--------|-----------|-----------|-----------|
| Weekly Active Users | 500 | 2,000 | 10,000 |
| Analyses per User/Week | 2.5 | 4.0 | 6.0 |
| Conversion (Visitor to Signup) | 15% | 20% | 25% |
| Retention (Day 30) | 20% | 35% | 50% |
| NPS Score | 30 | 45 | 60 |

### Technical Metrics

| Metric | Target |
|--------|--------|
| Page Load Time (p95) | < 2.0s |
| API Response Time (p95) | < 200ms |
| Analysis Duration (p95) | < 10s |
| Error Rate | < 0.5% |
| Uptime | 99.9% |

### Business Metrics

| Metric | Q1 Target | Q2 Target | Q4 Target |
|--------|-----------|-----------|-----------|
| Monthly Revenue | $0 | $2,000 | $15,000 |
| Premium Subscribers | 0 | 50 | 500 |
| Affiliate Commission | $0 | $500 | $5,000 |
| CAC | < $20 | < $20 | < $15 |
| LTV | TBD | > $60 | > $100 |

---

## Part 5: Risk Mitigation

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| AI API costs exceed budget | Medium | High | Caching, rate limits, fallback models |
| VTON licensing blocks launch | High | Critical | Early talks; SaaS API backup |
| Database performance degrades | Low | Medium | Indexes, query optimization |
| Image storage costs spike | Medium | Medium | Cloudinary optimization, retention policies |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Low user retention | Medium | High | Onboarding improvements, re-engagement |
| Affiliate programs reject | Low | Medium | Diversify networks |
| Competitor launches similar | Medium | Medium | Focus on differentiators |
| Privacy regulations change | Low | High | Privacy-by-design, audits |

---

## Part 6: Resource Requirements

### Team Composition (Ideal)

| Role | Count | Responsibilities |
|------|-------|------------------|
| Full-Stack Engineer | 2 | Features, API, DB migrations |
| Frontend Engineer | 1 | UI/UX, animations, responsive |
| ML/AI Engineer | 1 | Vision models, chatbot, recommendations |
| Designer | 0.5 | UI polish, design system |
| Product Manager | 0.5 | Roadmap, feedback, metrics |

### Budget Estimates (Monthly)

| Category | Q1 | Q2 | Q3 | Q4 |
|----------|----|----|----|----|
| Infrastructure | $200 | $400 | $800 | $1,500 |
| AI APIs | $500 | $1,500 | $3,000 | $5,000 |
| VTON GPU Workers | $0 | $0 | $1,000 | $2,000 |
| Third-Party Services | $100 | $200 | $400 | $800 |
| **Total** | **$800** | **$2,100** | **$5,200** | **$9,300** |

---

## Conclusion & Next Steps

### Immediate Actions (This Week)

1. **Align Database Schema** (Priority: Critical)
   - Review docs/data_schema.md vs drizzle/schema.ts
   - Create migration plan

2. **Real AI Integration Sprint** (Priority: Critical)
   - Assign engineer to lib/ai/vision.ts
   - Set up OpenAI/Gemini accounts + billing

3. **User Feedback Collection** (Priority: High)
   - Survey beta users on pain points
   - Identify top 3 requested features

### Decision Points

1. **VTON Strategy:** Self-host vs SaaS API vs delay?
2. **Monetization Timing:** Freemium now or after Phase 2?
3. **Mobile Priority:** Native app or PWA first?
4. **Affiliate Aggressiveness:** Balance trust vs revenue?

---

**Document Ownership:**
- Maintained by: Product + Engineering leads
- Review cadence: Monthly
- Source of truth: This document + docs/future_features_implementation.md

**Related Documents:**
- README.md - Project overview
- docs/project_detail.md - Technical specifications
- docs/future_features_implementation.md - Implementation details
- docs/data_schema.md - Canonical data model
- premium-editorial-ui.md - Design system guidelines
- docs/virtual_tryon_engine_plan.md - VTON technical plan
- docs/weight_height_prediction_plan.md - Body estimation approach

---

*Last updated: December 2025*
*Version: 1.0*