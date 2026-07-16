import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:pl-60 transition-[padding] duration-300">
        <main id="main-content" className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
