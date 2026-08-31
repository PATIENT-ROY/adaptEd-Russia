import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "AI-инструменты",
  description: "Готовые AI-инструменты AdaptEd Russia.",
  path: "/ai-helper/tools",
  noIndex: true,
});

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
