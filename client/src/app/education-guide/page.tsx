"use client";

import dynamic from "next/dynamic";
import { Layout } from "@/components/layout/layout";

const EducationGuideContent = dynamic(
  () => import("./education-guide-content").then((m) => m.EducationGuideContent),
  {
    ssr: false,
    loading: () => (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent" />
        </div>
      </Layout>
    ),
  }
);

export default function EducationGuidePage() {
  return <EducationGuideContent />;
}
