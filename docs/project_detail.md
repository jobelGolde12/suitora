Suitora - AI Fashion Compatibility Platform

Version: 1.0
Framework: Next.js 16 (App Router)
Language: TypeScript
Styling: Tailwind CSS
Deployment: Vercel
Goal: Create an AI-powered platform that lets users determine whether a fashion item from an online shopping platform suits them before purchasing.

Project Vision

Suitora is an AI-powered fashion assistant that helps users make smarter purchasing decisions.

Instead of wondering:

"Will this shirt actually look good on me?"

Suitora provides an AI-generated answer.

Users upload their own photo and either paste a product URL (Lazada, Shopee, TikTok Shop, Amazon, etc.) or upload a product image. Suitora then analyzes the clothing and generates a virtual try-on with compatibility scores and personalized fashion recommendations.

Core Features
Phase 1 (MVP)
Landing page
Authentication
Dashboard
Upload user photo
Upload product image
AI virtual try-on
Suitability score
Fashion analysis
Result page
History
Phase 2
Paste product URL
AI extracts product image
Multiple outfit comparison
Favorite items
User wardrobe
Phase 3
AI stylist chatbot
Outfit recommendation
Similar clothing suggestion
Color palette recommendation
Seasonal fashion advice
Future
Mobile app
Chrome Extension
Browser shopping assistant
Affiliate integration
Social sharing
Outfit generation
Tech Stack
Frontend
Next.js App Router
TypeScript
Tailwind CSS
Framer Motion
React Hook Form
Zod
Lucide Icons
Backend
Next.js Route Handlers
Drizzle ORM
Turso SQLite
Storage
Cloudinary
Authentication
Better Auth
AI

Possible APIs

OpenAI
Gemini
Replicate
FAL AI
Segmind
Image Processing
Sharp
Fabric.js (optional)
Deployment
Vercel
Turso
Folder Structure
suitora/

app/
    (landing)/
    (auth)/
    dashboard/
    analysis/
    history/
    settings/
    api/

components/
    landing/
    dashboard/
    upload/
    analysis/
    ui/

lib/
    ai/
    auth/
    db/
    utils/

hooks/

types/

services/

actions/

drizzle/

public/

styles/

User Flow
Landing

↓

Login

↓

Dashboard

↓

Upload Self Photo

↓

Upload Clothing Image

↓

AI Analysis

↓

Virtual Try-On

↓

Compatibility Score

↓

Recommendations

↓

Save Result

↓

History
Pages
Landing

Sections

Hero

Features

How It Works

Testimonials

FAQ

Footer

Authentication

Sign In

Register

Forgot Password

Dashboard

Welcome card

Recent analyses

Quick upload

Statistics

Upload Page

Upload your photo

Upload clothing

Preview

Continue

Analysis Page

Loading animation

AI processing

Progress indicator

Result Page

Large generated image

Overall score

Body compatibility

Color compatibility

Style compatibility

Confidence score

Recommendations

Download image

Save

Share

History

Grid layout

Search

Delete

View

Settings

Profile

Password

Appearance

Subscription

Database Schema
Users
id
name
email
image
createdAt
Analyses
id
userId

userImage

productImage

generatedImage

overallScore

bodyScore

styleScore

colorScore

recommendations

createdAt
Favorites
id
userId
analysisId
AI Workflow
Upload User Image

↓

Detect Person

↓

Remove Background

↓

Analyze

↓

Body Shape

↓

Skin Tone

↓

Face Shape

↓

Pose

↓

Upload Clothing

↓

Extract Clothing

↓

Virtual Try-On

↓

Generate Final Image

↓

Fashion Analysis

↓

Return Result
AI Analysis Categories

Body Shape

Rectangle
Pear
Apple
Hourglass
Triangle

Skin Tone

Warm
Cool
Neutral

Face Shape

Round
Oval
Heart
Square
Diamond

Style

Casual
Minimalist
Streetwear
Vintage
Formal
Korean
Business Casual

Color Analysis

Primary Colors

Recommended Colors

Avoid Colors

Compatibility Score

Overall

0–100

Generated from

Color
Body
Style
Clothing Fit
UI Design

Theme

Modern

Luxury

Minimal

Inspired by

Apple

Linear

Arc Browser

Raycast

OpenAI

Colors

Background

#FAFAFA

Dark

#09090B

Primary

#5B4BFF

Accent

#8B5CF6

Text

Gray scale

Typography

Inter

Large headings

Generous spacing

Rounded cards

Soft shadows

Glass morphism where appropriate

Animations

Framer Motion

Fade

Slide

Scale

Hover

Micro interactions

Loading skeletons

Progress animations

Components

Navbar

Hero

Feature Card

Upload Area

Image Preview

Loading Overlay

Progress Card

Result Card

Score Circle

Recommendation Card

History Card

Footer

Toast

Modal

Dialog

Button

Input

Badge

Avatar

Dropdown

Sidebar

Breadcrumb

Security

Validate uploads

Limit file size

Rate limiting

Server-side validation

Sanitize inputs

Secure authentication

Environment variables

Performance

Image optimization

Server Components

Lazy loading

Dynamic imports

Caching

Streaming

Parallel routes

SEO

Metadata

Open Graph

Twitter Card

Structured Data

robots.txt

sitemap.xml

Accessibility

Keyboard navigation

ARIA labels

Focus states

Color contrast

Screen reader support

Future AI Integrations

OpenAI Vision

Gemini Vision

Virtual Try-On APIs

Image Segmentation

Fashion Recommendation Models
