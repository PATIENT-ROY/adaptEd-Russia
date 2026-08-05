import type { Metadata } from "next";
import { ReviewPageContent } from "./review-content";

export const metadata: Metadata = {
  title: "Экспертная проверка гайдов",
  description:
    "Приглашение к экспертной проверке материалов AdaptEd Russia для сотрудников вузов, юристов, специалистов по иностранным студентам, самих студентов и преподавателей РКИ.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ReviewPage() {
  return <ReviewPageContent />;
}
