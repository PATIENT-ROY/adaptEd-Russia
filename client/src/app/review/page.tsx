import { createPageMetadata } from "@/lib/seo";
import { ReviewPageContent } from "./review-content";

export const metadata = createPageMetadata({
  title: "Экспертная проверка гайдов",
  description:
    "Приглашение к экспертной проверке материалов AdaptEd Russia для сотрудников вузов, юристов, специалистов по иностранным студентам, самих студентов и преподавателей РКИ.",
  path: "/review",
  noIndex: true,
});

export default function ReviewPage() {
  return <ReviewPageContent />;
}
