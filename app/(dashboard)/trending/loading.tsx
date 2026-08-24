import { PageContainer, PageHeader } from "@/components/dashboard";
import { TrendingGridSkeleton } from "@/components/trending";

export default function TrendingLoading() {
  return (
    <PageContainer>
      <PageHeader
        label="Discover"
        title="Trending Items"
        description="Curated fashion picks synchronized from online sources — explore, analyze, and complete the look."
      />
      <div className="mb-8 h-10" />
      <TrendingGridSkeleton count={8} />
    </PageContainer>
  );
}
