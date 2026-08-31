import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

type HomeFeatureCardProps = {
  href: string;
  title: string;
  description: string;
  stat: string;
  icon: LucideIcon;
  iconClassName: string;
  learnMore: string;
};

export function HomeFeatureCard({
  href,
  title,
  description,
  stat,
  icon: Icon,
  iconClassName,
  learnMore,
}: HomeFeatureCardProps) {
  return (
    <Link
      href={href}
      className="home-feature-card group flex h-full rounded-[24px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/35 focus-visible:ring-offset-2"
    >
      <article className="flex h-full w-full flex-col rounded-[24px] bg-white p-6 shadow-[0_10px_32px_rgba(15,23,42,0.07)] ring-1 ring-transparent transition-[box-shadow,transform,ring-color] duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_16px_40px_rgba(15,23,42,0.1)] group-hover:ring-1 group-hover:ring-blue-300 sm:p-7">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md sm:h-12 sm:w-12 ${iconClassName}`}
        >
          <Icon className="h-5 w-5 text-white sm:h-6 sm:w-6" aria-hidden />
        </div>
        <h3 className="mt-5 text-xl font-bold leading-snug text-slate-900">
          {title}
        </h3>
        <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-slate-500">
          {description}
        </p>
        <div className="mt-auto pt-6">
          <div className="border-t border-slate-200 pt-4">
            <p className="text-[15px] text-slate-500">{stat}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-[15px] font-semibold text-blue-600 transition-colors group-hover:text-blue-700">
              {learnMore}
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
