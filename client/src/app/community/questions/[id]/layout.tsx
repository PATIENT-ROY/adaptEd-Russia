import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return createPageMetadata({
    title: "Вопрос сообщества иностранных студентов",
    description: "Обсуждение вопроса об учёбе, документах или жизни иностранного студента в России.",
    path: `/community/questions/${encodeURIComponent(id)}`,
    noIndex: true,
  });
}

export default function CommunityQuestionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
