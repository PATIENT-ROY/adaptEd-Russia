CREATE TABLE "payment_refunds" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "yooKassaRefundId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "providerCreatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_refunds_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_refunds_yooKassaRefundId_key"
ON "payment_refunds"("yooKassaRefundId");
CREATE INDEX "payment_refunds_paymentId_idx" ON "payment_refunds"("paymentId");
CREATE INDEX "payment_refunds_status_idx" ON "payment_refunds"("status");

ALTER TABLE "payment_refunds"
ADD CONSTRAINT "payment_refunds_paymentId_fkey"
FOREIGN KEY ("paymentId") REFERENCES "payments"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
