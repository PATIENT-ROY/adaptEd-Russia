import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "AI-помощник",
  description: "Чат с AI-помощником AdaptEd Russia.",
  path: "/ai-helper/assistant",
  noIndex: true,
});

export default function AssistantLayout({ children }: { children: React.ReactNode }) {
  return children;
}
