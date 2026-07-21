import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-surface/60 items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent/10" />
        <div className="relative z-10 max-w-md text-center space-y-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/30 bg-accent/10 overflow-hidden">
              <img
                src="/suitora_logo.png"
                alt="Suitora"
                width={40}
                height={40}
                className="object-cover"
              />
            </div>
            <span className="font-heading text-2xl font-medium tracking-tight">
              Suitora
            </span>
          </Link>

          <div className="space-y-4">
            <h2 className="font-heading text-3xl font-light text-foreground">
              Know if it suits you
              <br />
              <span className="italic text-accent">before you buy</span>
            </h2>
            <p className="text-muted font-light leading-relaxed">
              AI-powered fashion compatibility analysis. Upload your photo,
              add a clothing item, and get personalized insights instantly.
            </p>
          </div>

          <div className="flex items-center justify-center gap-8 pt-4">
            <div className="text-center">
              <div className="font-heading text-2xl font-medium text-foreground">1,200+</div>
              <div className="text-xs text-muted font-light mt-1">Active Users</div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <div className="font-heading text-2xl font-medium text-foreground">50K+</div>
              <div className="text-xs text-muted font-light mt-1">Analyses Done</div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <div className="font-heading text-2xl font-medium text-foreground">98%</div>
              <div className="text-xs text-muted font-light mt-1">Accuracy</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden p-6">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/30 bg-accent/10 overflow-hidden">
              <img
                src="/suitora_logo.png"
                alt="Suitora"
                width={32}
                height={32}
                className="object-cover"
              />
            </div>
            <span className="font-heading text-lg font-medium tracking-tight">
              Suitora
            </span>
          </Link>
        </div>

        {/* Form Area */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 lg:py-0">
          <div className="w-full max-w-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
