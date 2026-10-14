import Image from "next/image";
import { cn } from "@/lib/utils";

type HeroBackgroundImageProps = {
  src: string;
  imageClassName?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
};

export function HeroBackgroundImage({
  src,
  imageClassName,
  priority = true,
  sizes = "100vw",
  quality = 75,
}: HeroBackgroundImageProps) {
  return (
    <div className="absolute inset-0 bg-slate-200" aria-hidden>
      <Image
        src={src}
        alt=""
        fill
        priority={priority}
        sizes={sizes}
        quality={quality}
        className={cn("object-cover", imageClassName)}
      />
    </div>
  );
}
