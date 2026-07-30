import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      // Shopify CDN — product images from Shopify stores
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
      // Some stores use custom CDN subdomains
      {
        protocol: "https",
        hostname: "**.myshopify.com",
      },
      // ASOS product images
      {
        protocol: "https",
        hostname: "images.asos-media.com",
      },
      // Skimlinks redirect tracking
      {
        protocol: "https",
        hostname: "go.skimresources.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' https://images.unsplash.com https://res.cloudinary.com https://*.myshopify.com https://images.asos-media.com https://via.placeholder.com https://go.skimresources.com data: blob:",
              "connect-src 'self' https://api.openai.com https://*.upstash.io",
              "font-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
