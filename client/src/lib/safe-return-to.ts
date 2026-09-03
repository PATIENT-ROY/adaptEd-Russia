const FALLBACK = "/dashboard";

export function getSafeReturnTo(
  raw: string | null | undefined,
  fallback = FALLBACK,
): string {
  if (!raw) return fallback;

  let value = raw.trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    return fallback;
  }

  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("://") ||
    value.includes("\\") ||
    /[\u0000-\u001F\u007F]/.test(value)
  ) {
    return fallback;
  }

  return value;
}

export function readSafeReturnTo(fallback = FALLBACK): string {
  if (typeof window === "undefined") return fallback;
  return getSafeReturnTo(
    new URLSearchParams(window.location.search).get("returnTo"),
    fallback,
  );
}
