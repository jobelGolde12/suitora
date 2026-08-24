"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Menu, X } from "lucide-react";
import { useSession } from "@/components/providers/SessionProvider";

const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "FAQ", href: "/#faq" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const { session, isLoading } = useSession();

  // Close the mobile menu whenever the route changes. Tracking the previous
  // pathname during render avoids a setState-in-effect cascade.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled || !isLanding
          ? "bg-background/90 backdrop-blur-md border-b border-border/40"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8 lg:px-12">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent/10 overflow-hidden">
            <Image
              src="/suitora_logo.png"
              alt="Suitora"
              width={32}
              height={32}
              className="object-cover shrink-0"
              priority
              unoptimized
            />
          </div>
          <span className="font-heading text-xl font-medium tracking-tight">
            Suitora
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-10">
          {isLanding && navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted hover:text-foreground transition-colors duration-300 relative group cursor-pointer"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-accent transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          {!isLoading && session ? (
            <Link href="/dashboard">
              <Button variant="editorial" size="sm" className="rounded-full px-5">
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="rounded-full">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="editorial" size="sm" className="rounded-full px-5">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button — positioned at top right */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-md border-t border-border/40 animate-in">
          <div className="px-6 py-8 space-y-6">
            {isLanding && navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-base text-muted hover:text-foreground transition-colors py-2 font-light cursor-pointer"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-3 pt-6 border-t border-border/40">
              {!isLoading && session ? (
                <Link href="/dashboard" className="w-full">
                  <Button variant="editorial" className="w-full rounded-full">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" className="w-full">
                    <Button variant="secondary" className="w-full rounded-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register" className="w-full">
                    <Button variant="editorial" className="w-full rounded-full">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}