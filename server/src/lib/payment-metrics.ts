export function refundRatePercent(refundSum: number, paidGross: number): number {
  if (!Number.isFinite(refundSum) || !Number.isFinite(paidGross) || paidGross <= 0) {
    return 0;
  }
  return Math.round((Math.max(0, refundSum) / paidGross) * 1000) / 10;
}
