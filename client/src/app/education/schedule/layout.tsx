import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({ title: "Учебное расписание иностранного студента", description: "Как разобраться в расписании российского вуза, типах занятий, аудиториях и изменениях учебного графика.", path: "/education/schedule" });

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
