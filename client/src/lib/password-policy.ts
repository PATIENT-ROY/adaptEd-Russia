export const PASSWORD_MAX_UTF8_BYTES = 72;

export function passwordUtf8Bytes(password: string): number {
  return new TextEncoder().encode(password).length;
}

export function passwordMeetsPolicy(password: string): boolean {
  return (
    password.length >= 8 &&
    passwordUtf8Bytes(password) <= PASSWORD_MAX_UTF8_BYTES &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

export function isDuplicateEmailError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("уже существует") ||
    normalized.includes("already exists") ||
    normalized.includes("existe déjà") ||
    normalized.includes("already registered")
  );
}
