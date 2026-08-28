import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Платёж AdaptEd Russia",
  description: "Служебная страница проведения платежа.",
  path: "/payment",
  noIndex: true,
});

export default function PaymentFlowLayout({ children }: { children: React.ReactNode }) {
  return children;
}
