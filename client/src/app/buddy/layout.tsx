import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "AdaptEd Buddy — программа местных наставников",
  description:
    "Безопасная бесплатная программа знакомства иностранных студентов с местными наставниками в России.",
  path: "/buddy",
});

export default function BuddyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
