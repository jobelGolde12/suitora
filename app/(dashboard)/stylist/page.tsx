import { PageContainer, PageHeader } from "@/components/dashboard";
import { StylistChat } from "@/components/stylist/StylistChat";

export default function StylistPage() {
  return (
    <PageContainer narrow>
      <PageHeader
        label="Stylist"
        title="AI Stylist"
        description="Personal styling advice tuned to your body, skin tone, and fashion history."
      />
      <StylistChat />
    </PageContainer>
  );
}
