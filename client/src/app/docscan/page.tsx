"use client";

import dynamic from "next/dynamic";
import { useTranslation } from "@/hooks/useTranslation";

const DocScanContent = dynamic(
  () => import("./docscan-content").then((mod) => mod.DocScanContent),
  {
    loading: () => <LoadingPlaceholder />,
    ssr: false,
  },
);

function LoadingPlaceholder() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6A5AE0] mx-auto mb-4" />
        <p className="text-gray-600">{t("docscan.loading")}</p>
      </div>
    </div>
  );
}

export default function DocScanPage() {
  return <DocScanContent />;
}
