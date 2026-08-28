import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({ title: "Словарь студенческого сленга в России", description: "Понятные объяснения слов и выражений, которые иностранный студент услышит в российском вузе.", path: "/education/student-slang" });

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
