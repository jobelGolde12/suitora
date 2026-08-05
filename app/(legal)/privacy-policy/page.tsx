import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { LegalMarkdown } from "@/components/legal/markdown";
import { readLegalMarkdown } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Suitora collects, uses, stores, and protects your personal information — including AI fashion analysis, virtual try-on, photo retention, and your privacy rights.",
  openGraph: {
    title: "Privacy Policy — Suitora",
    description:
      "How Suitora collects, uses, stores, and protects your personal information.",
    url: "https://suitora.app/privacy-policy",
    siteName: "Suitora",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function PrivacyPolicyPage() {
  let document;
  try {
    document = await readLegalMarkdown("privacy-policy");
  } catch (error) {
    console.error("Failed to load privacy policy:", error);
    return (
      <LegalPage title="Privacy Policy">
        <p className="mb-5 text-[0.95rem] leading-relaxed font-light text-foreground/90">
          We could not load the Privacy Policy right now. Please try again later.
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
