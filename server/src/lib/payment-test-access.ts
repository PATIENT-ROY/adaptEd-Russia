/**
 * Mock YooKassa checkout stays available for allowlisted testers.
 * Regular users must not receive Premium from mock status checks.
 * Existing subscriptions are not revoked here.
 */
export type PaymentActor = {
  role?: string | null;
  email?: string | null;
  /** When explicitly false, deny test checkout (unverified / invite-pending accounts). */
  emailVerified?: boolean | null;
};

export function parsePaymentTestEmails(raw = process.env.PAYMENT_TEST_EMAILS): string[] {
  return (raw || '')
    .split(/[,;\s]+/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function normalizePaymentEmail(email: string | null | undefined): string {
  return String(email || '').trim().toLowerCase();
}

export function isPaymentTester(user: PaymentActor | null | undefined): boolean {
  if (!user) return false;
  if (String(user.role || '').toUpperCase() === 'ADMIN') return true;
  // Allowlist must not apply to accounts that explicitly failed email verification.
  if (user.emailVerified === false) return false;
  const email = normalizePaymentEmail(user.email);
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
  if (!yooKassaPaymentId) return false;
  if (!isMockYooKassaPaymentId(yooKassaPaymentId)) return true;
  return isPaymentTester(user);
}
