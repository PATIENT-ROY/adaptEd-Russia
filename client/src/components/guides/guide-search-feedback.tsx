import Link from "next/link";
import { Guide } from "@/types";
import { guideArticlePath } from "@/lib/guide-routes";

export function GuideCategoryEmpty({ onClear }: { onClear: () => void }) {
  return <div className="py-8 text-center space-y-3" role="status">
    <p className="text-slate-600">В выбранной категории ничего не найдено</p>
    <button type="button" onClick={onClear} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-500">Искать во всех категориях</button>
  </div>;
}

export function OtherGuideResults({ guides, current, hasCurrent }: {
  guides: Guide[]; current: "education" | "life"; hasCurrent: boolean;
}) {
  if (!guides.length) return null;
  const name = current === "education" ? "Учёба" : "Быт";
  const other = current === "education" ? "Быт" : "Учёба";
  return <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-6" aria-label={`Результаты из раздела ${other}`}>
    <h3 className="text-base font-semibold text-slate-900">{hasCurrent
      ? `Также найдено в разделе „${other}“`
      : `В разделе „${name}“ ничего не найдено. Подходящие инструкции есть в разделе „${other}“`}</h3>
    <ul className="mt-3 space-y-1">{guides.map(guide => <li key={guide.id}>
      <Link href={guideArticlePath(guide)} className="block rounded-md py-3 text-blue-700 underline underline-offset-4 hover:text-blue-900 focus-visible:ring-2 focus-visible:ring-blue-500">{guide.title}</Link>
    </li>)}</ul>
  </section>;
}
