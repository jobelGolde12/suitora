import type { ReactNode } from "react";

interface LegalPageProps {
  title: string;
  effectiveDate?: string | null;
  lastUpdated?: string | null;
  children: ReactNode;
}

/**
 * Presentational wrapper for legal documents. Owns the page title (h1) and a
 * date banner so document bodies never duplicate the heading hierarchy.
 */
export function LegalPage({
  title,
  effectiveDate,
  lastUpdated,
  children,
}: LegalPageProps) {
  const hasDates = Boolean(effectiveDate || lastUpdated);

  return (
    <section className="mx-auto w-full max-w-4xl px-6 pt-32 pb-24 sm:px-8 lg:px-12">
      <header className="mb-12">
        <span className="editorial-label">Legal</span>
        <h1 className="mt-3 font-heading text-4xl font-light tracking-tight text-balance">
          {title}
        </h1>
        {hasDates && (
          <p
            className="mt-6 inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full border border-border bg-surface/60 px-4 py-2 text-xs text-muted font-light"
            aria-label={`${title} effective and last updated dates`}
          >
            {effectiveDate && <span>Effective Date: {effectiveDate}</span>}
            {effectiveDate && lastUpdated && (
              <span aria-hidden="true">&middot;</span>
            )}
            {lastUpdated && <span>Last Updated: {lastUpdated}</span>}
          </p>
        )}
      </header>
      <div>{children}</div>
    </section>
  );
}
