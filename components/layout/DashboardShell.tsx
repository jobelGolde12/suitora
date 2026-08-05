"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileTopBar } from "@/components/layout/MobileTopBar";
import { MobileNav } from "@/components/layout/MobileNav";
import { PageTransition } from "@/components/dashboard/PageTransition";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileTopBar />
      <div className="md:pl-60 transition-[padding] duration-300">
        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          className="min-h-screen focus:outline-none"
        >
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
