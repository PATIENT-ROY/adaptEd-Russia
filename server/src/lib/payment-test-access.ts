/**
 * Mock YooKassa checkout stays available for allowlisted testers.
 * Regular users must not receive Premium from mock status checks.
 * Existing subscriptions are not revoked here.
 */
export type PaymentActor = {
  id?: string | null;
  userId?: string | null;
  role?: string | null;
  email?: string | null;
  /** Email allowlisting is accepted only when a real verification flow sets this true. */
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

export function parsePaymentTestUserIds(raw = process.env.PAYMENT_TEST_USER_IDS): string[] {
  return (raw || '')
    .split(/[,;\s]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

export function isPaymentTester(user: PaymentActor | null | undefined): boolean {
  if (!user) return false;
  if (String(user.role || '').toUpperCase() === 'ADMIN') return true;

  const userId = String(user.userId || user.id || '').trim();
  if (userId && parsePaymentTestUserIds().includes(userId)) return true;

  // The application currently has no email-verification lifecycle. Keep the email
  // allowlist disabled for ordinary accounts until a verified flag is supplied.
  if (user.emailVerified !== true) return false;
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
