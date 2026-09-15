/**
 * Mock YooKassa checkout stays available for allowlisted testers.
 * Regular users must not receive Premium from mock status checks.
 * Existing subscriptions are not revoked here.
 */
export type PaymentActor = {
  role?: string | null;
  email?: string | null;
};

export function parsePaymentTestEmails(raw = process.env.PAYMENT_TEST_EMAILS): string[] {
  return (raw || '')
    .split(/[,;\s]+/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function isPaymentTester(user: PaymentActor | null | undefined): boolean {
  if (!user) return false;
  if (String(user.role || '').toUpperCase() === 'ADMIN') return true;
  const email = String(user.email || '').trim().toLowerCase();
  if (!email) return false;
  return parsePaymentTestEmails().includes(email);
}

export function isMockYooKassaPaymentId(id: string | null | undefined): boolean {
  return typeof id === 'string' && id.startsWith('test_');
}

/** Real (non-test_) ids may apply; mock ids apply only for testers. */
export function canApplyFromYooKassaStatus(
  user: PaymentActor | null | undefined,
  yooKassaPaymentId: string | null | undefined,
): boolean {
  if (!isMockYooKassaPaymentId(yooKassaPaymentId)) return true;
  return isPaymentTester(user);
}
