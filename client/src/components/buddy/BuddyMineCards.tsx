import type { BuddyKey } from "@/lib/buddy-i18n";
import type { BuddyApplicationSummary } from "@/lib/buddy-api";

function statusBadgeClass(status: BuddyApplicationSummary["status"]) {
  if (status === "MATCHED") return "bg-emerald-100 text-emerald-800";
  if (status === "REJECTED") return "bg-red-100 text-red-800";
  if (status === "NEW") return "bg-amber-100 text-amber-800";
  return "bg-indigo-50 text-indigo-700";
}

export function BuddyMineCards({
  applications,
  locale,
  bt,
}: {
  applications: BuddyApplicationSummary[];
  locale: string;
  bt: (key: BuddyKey) => string;
}) {
  const ordered = [...applications].sort(
    (left, right) => Number(right.status === "MATCHED") - Number(left.status === "MATCHED"),
  );
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {ordered.map((application) => {
        const matched = application.status === "MATCHED";
        return (
          <article
            key={application.id}
            data-testid={`buddy-mine-card-${application.status}`}
            className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ${matched ? "ring-emerald-200 bg-emerald-50/70" : "ring-slate-100"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <strong className="text-sm text-slate-900">
                {bt(application.type === "STUDENT" ? "application.student" : "application.mentor")}
              </strong>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(application.status)}`}>
                {bt(`application.${application.status}` as BuddyKey)}
              </span>
            </div>
            {matched && (
              <p className="mt-3 text-sm font-semibold text-emerald-800">{bt("application.matchedNotice")}</p>
            )}
            {matched && (
              <p className="mt-1 text-xs leading-5 text-emerald-900/80">{bt("application.matchedHint")}</p>
            )}
            <p className="mt-2 text-xs text-slate-500">
              {bt("application.date").replace("{date}", new Intl.DateTimeFormat(locale).format(new Date(application.createdAt)))}
            </p>
          </article>
        );
      })}
    </div>
  );
}
