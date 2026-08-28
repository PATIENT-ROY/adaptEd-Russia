import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Вопросы иностранных студентов",
  description:
    "Вопросы и ответы сообщества иностранных студентов об учёбе, документах и жизни в России.",
  path: "/community/questions",
  noIndex: true,
});

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
