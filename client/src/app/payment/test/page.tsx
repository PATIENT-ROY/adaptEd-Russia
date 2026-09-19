"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const paymentId =
      searchParams.get("payment_id") ||
      searchParams.get("paymentId") ||
      searchParams.get("id");
    router.replace(
      paymentId ? `/payment?payment_id=${paymentId}` : "/payment",
    );
  }, [router, searchParams]);

  return null;
}

/** Old /payment/test bookmarks → /payment */
export default function PaymentTestRedirect() {
  return (
    <Suspense fallback={null}>
      <RedirectContent />
    </Suspense>
  );
}
