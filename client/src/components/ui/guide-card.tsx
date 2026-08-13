import React from "react";
import { Button } from "./button";
import { ArrowRight, BookOpen, Home, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Guide, GuideCategory } from "@/types";
import { formatDate } from "@/lib/date-utils";
import { useRouter } from "next/navigation";
import { GuideDetailModal } from "./guide-detail-modal";
import { GuideCardBase } from "./guide-card-base";
import { useTranslation } from "@/hooks/useTranslation";

interface GuideCardProps {
  guide: Guide;
  onClick?: () => void;
  className?: string;
  isRead?: boolean;
  onRead?: (guideId: string) => void;
}

const categoryIcons = {
  [GuideCategory.EDUCATION]: BookOpen,
  [GuideCategory.LIFE]: Home,
  [GuideCategory.DOCUMENTS]: Clock,
  [GuideCategory.CULTURE]: Home,
  [GuideCategory.LEGAL]: Clock,
  [GuideCategory.OTHER]: BookOpen,
};

const PREVIEW_MAX_LEN = 90;

/** Short card teaser: strip markdown noise, keep ~2 lines of prose. */
function getGuidePreview(content: string, maxLen = PREVIEW_MAX_LEN): string {
  if (!content.trim()) return "";

  const emojiOrSymbol =
    /(?:[\u2600-\u27BF]|[\u{1F300}-\u{1FAFF}]|[\uFE0F]|[\u200D])/gu;

  const cleanLine = (line: string) =>
    line
      .replace(/^#{1,6}\s+/, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/^[\t ]*[-*•▪︎]\s+/, "")
      .replace(/^[\t ]*\d+[.)]\s+/, "")
      .replace(emojiOrSymbol, "")
      .replace(/\s+/g, " ")
      .trim();

  // Prefer real body lines over leftover section titles ("...:", short labels).
  const proseParts = content
    .replace(/\r\n/g, "\n")
    .replace(/```[\s\S]*?```/g, "\n")
    .split("\n")
    .map(cleanLine)
    .filter((line) => {
      if (line.length < 28) return false;
      if (/[:：]$/.test(line) && line.length < 60) return false;
      // Drop leftover section titles like "Первые действия (в течение 24 часов!)"
      const withoutParens = line.replace(/\([^)]*\)/g, "").trim();
      if (!/[.!?…]/.test(withoutParens) && withoutParens.length < 72) {
        return false;
      }
      return true;
    });

  let text = (proseParts.length > 0 ? proseParts : content.split("\n").map(cleanLine))
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return "";

  const sentence = text.match(/^(.+?[.!?…])(?:\s|$)/);
  if (
    sentence &&
    sentence[1].length >= 36 &&
    sentence[1].length <= maxLen
  ) {
    return sentence[1];
  }

  if (text.length <= maxLen) return text;

  const cut = text.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export function GuideCard({ guide, onClick, className, isRead, onRead }: GuideCardProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [showModal, setShowModal] = React.useState(false);
  const Icon = categoryIcons[guide.category];

  const handleReadMore = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (
      guide.title.toLowerCase().includes("сленг") ||
      guide.tags.some((tag) => tag.toLowerCase().includes("сленг"))
    ) {
      onRead?.(guide.id);
      router.push("/student-slang");
    } else {
      setShowModal(true);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    onRead?.(guide.id);
  };

  const previewText =
    getGuidePreview(guide.content) || t("guideCard.previewFallback");

  const categoryLabel = guide.category === GuideCategory.EDUCATION
    ? "Образование"
    : guide.category === GuideCategory.LIFE
    ? "Быт"
    : guide.category === GuideCategory.DOCUMENTS
    ? "Документы"
    : guide.category === GuideCategory.CULTURE
    ? "Культура"
    : guide.category === GuideCategory.LEGAL
    ? "Право"
    : "Другое";

  return (
    <>
      <GuideCardBase
        className={cn(className, isRead && "ring-1 ring-green-200 bg-green-50/30")}
        onClick={onClick}
        icon={
          <div className="relative">
            <div
              className={cn(
                "rounded-xl flex-shrink-0 h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center shadow-sm",
                guide.category === GuideCategory.EDUCATION && "bg-blue-600",
                guide.category === GuideCategory.LIFE && "bg-green-600",
                guide.category === GuideCategory.DOCUMENTS && "bg-red-600",
                guide.category === GuideCategory.CULTURE && "bg-purple-600",
                guide.category === GuideCategory.LEGAL && "bg-orange-600",
                (!guide.category || guide.category === GuideCategory.OTHER) && "bg-gray-600"
              )}
            >
              <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            {isRead && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-white">
                <CheckCircle2 className="h-3.5 w-3.5 text-white" />
              </div>
            )}
          </div>
        }
        title={guide.title}
        subtitle={categoryLabel}
        description={previewText}
        footerActions={
          <>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span>©</span>
              <span>{formatDate(guide.updatedAt)}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReadMore}
              className="h-auto p-0 text-blue-600 hover:text-blue-700 text-sm font-medium group transition-all duration-300"
            >
              {t("guideCard.open")}
              <ArrowRight className="ml-1 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </>
        }
      />

      <GuideDetailModal
        guide={guide}
        isOpen={showModal}
        onClose={handleModalClose}
      />
    </>
  );
}
