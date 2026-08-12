import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { LegalMarkdown } from "@/components/legal/markdown";
import { readLegalMarkdown } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms governing your use of Suitora — including AI fashion analysis, virtual try-on, user content, acceptable use, and liability.",
  openGraph: {
    title: "Terms of Service — Suitora",
    description:
      "The terms governing your use of the Suitora AI fashion compatibility platform.",
    url: "https://suitora.app/terms-of-service",
    siteName: "Suitora",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function TermsOfServicePage() {
  let document;
  try {
    document = await readLegalMarkdown("terms-of-service");
  } catch (error) {
    console.error("Failed to load terms of service:", error);
    return (
      <LegalPage title="Terms of Service">
        <p className="mb-5 text-[0.95rem] leading-relaxed font-light text-foreground/90">
          We could not load the Terms of Service right now. Please try again later.
        </p>
      </LegalPage>
    );
  }

  return (
    <LegalPage
      title={document.title}
      effectiveDate={document.effectiveDate}
      lastUpdated={document.lastUpdated}
    >
      <LegalMarkdown markdown={document.content} />
    </LegalPage>
  );
}
