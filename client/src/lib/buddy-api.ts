import { API_BASE_URL } from "@/lib/api";

export type BuddyApplicationType = "STUDENT" | "MENTOR";
export type BuddyApplicationStatus =
  | "NEW"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "MATCHED"
  | "REJECTED"
  | "CLOSED";

export type BuddyHelpTopic =
  | "CITY_ORIENTATION"
  | "TRANSPORT"
  | "STUDIES"
  | "DAILY_LIFE"
  | "RUSSIAN_PRACTICE"
  | "SOCIAL_CULTURAL"
  | "OTHER";

export type BuddyContactMethod =
  | "EMAIL"
  | "PHONE"
  | "TELEGRAM"
  | "WHATSAPP"
  | "OTHER";

export type BuddyParticipantStatus =
  | "LOCAL_RESIDENT"
  | "STUDENT"
  | "GRADUATE"
  | "OTHER";

export type BuddyApplicationInput = {
  type: BuddyApplicationType;
  name: string;
  isAdult: true;
  country?: string;
  city: string;
  affiliation?: string;
  participantStatus?: BuddyParticipantStatus;
  languages: string[];
  helpTopics: BuddyHelpTopic[];
  interests?: string;
  availability: string;
  contactMethod: BuddyContactMethod;
  contact: string;
  motivation?: string;
  comment?: string;
  agreedToRules: true;
  agreedToDataPolicy: true;
};

export type BuddyApplicationSummary = {
  id: string;
  type: BuddyApplicationType;
  status: BuddyApplicationStatus;
  city: string;
  languages?: string[];
  createdAt: string;
  updatedAt: string;
};

export type BuddyApplicationDetail = BuddyApplicationSummary &
  Omit<BuddyApplicationInput, "type"> & {
    participantStatus: BuddyParticipantStatus | null;
    country: string | null;
    affiliation: string | null;
    interests: string | null;
    motivation: string | null;
    comment: string | null;
    internalNote: string | null;
    user: { id: string; email: string };
  };

function tokenHeaders(json = false): HeadersInit {
  const token = typeof window === "undefined" ? null : localStorage.getItem("token");
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
}

async function buddyFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/buddy${path}`, {
    ...options,
    headers: { ...tokenHeaders(options.body !== undefined), ...options.headers },
  });
  const body = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    data?: T;
    error?: string;
    meta?: unknown;
  };
  if (!response.ok || body.success === false) {
    const error = new Error(body.error || "SERVER_ERROR");
    if (response.status === 401) error.name = "UNAUTHORIZED";
    else if (response.status === 429) error.name = "BUDDY_RATE_LIMITED";
    else error.name = body.error || "SERVER_ERROR";
    throw error;
  }
  return body.data as T;
}

export function submitBuddyApplication(data: BuddyApplicationInput) {
  return buddyFetch<Pick<BuddyApplicationSummary, "id" | "type" | "status" | "createdAt" | "updatedAt">>(
    "/applications",
    { method: "POST", body: JSON.stringify(data) },
  );
}

export function fetchMyBuddyApplications() {
  return buddyFetch<BuddyApplicationSummary[]>("/applications/mine");
}

export type BuddyAdminList = {
  applications: BuddyApplicationSummary[];
  total: number;
  newCount: number;
};

export async function fetchBuddyAdminApplications(filters: {
  type?: BuddyApplicationType;
  status?: BuddyApplicationStatus;
  city?: string;
}): Promise<BuddyAdminList> {
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.status) params.set("status", filters.status);
  if (filters.city) params.set("city", filters.city);
  const response = await fetch(
    `${API_BASE_URL}/buddy/admin/applications${params.size ? `?${params}` : ""}`,
    { headers: tokenHeaders() },
  );
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) {
    const error = new Error(body.error || "SERVER_ERROR");
    if (response.status === 401) error.name = "UNAUTHORIZED";
    else error.name = body.error || "SERVER_ERROR";
    throw error;
  }
  return {
    applications: body.data || [],
    total: Number(body.meta?.total || 0),
    newCount: Number(body.meta?.newCount || 0),
  };
}

export function fetchBuddyAdminApplication(id: string) {
  return buddyFetch<BuddyApplicationDetail>(
    `/admin/applications/${encodeURIComponent(id)}`,
  );
}

export function updateBuddyAdminApplication(
  id: string,
  data: { status?: BuddyApplicationStatus; internalNote?: string | null },
) {
  return buddyFetch<BuddyApplicationDetail>(
    `/admin/applications/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(data) },
  );
}
