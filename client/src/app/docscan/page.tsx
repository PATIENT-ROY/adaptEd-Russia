"use client";

import dynamic from "next/dynamic";

// Динамический импорт компонента DocScan - загружается только при необходимости
// Это уменьшает начальный размер бандла, так как tesseract.js загружается только при необходимости
const DocScanContent = dynamic(() => import("./docscan-content").then((mod) => mod.DocScanContent), {
  loading: () => <LoadingPlaceholder />,
  ssr: false,
});

function LoadingPlaceholder() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6A5AE0] mx-auto mb-4"></div>
        <p className="text-gray-600">Загрузка...</p>
      </div>
    </div>
  );
}

export default function DocScanPage() {
  return <DocScanContent />;
}
