import { FaqSection } from "@/components/marketing/faq-section";
import { InnerShell } from "@/components/layout/inner-shell";

export default function FaqPage() {
  return (
    <InnerShell>
    <div className="space-y-6">
      <FaqSection />
    </div>
    </InnerShell>
  );
}

