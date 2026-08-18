"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type HeroBackgroundImageProps = {
  src: string;
  imageClassName?: string;
  priority?: boolean;
};

export function HeroBackgroundImage({
  src,
  imageClassName,
  priority = true,
}: HeroBackgroundImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="absolute inset-0" aria-hidden>
      <div
        className={cn(
          "absolute inset-0 bg-slate-200 transition-opacity duration-300",
          !isLoaded && "animate-pulse",
          isLoaded && "opacity-0",
        )}
      />
      <Image
        src={src}
        alt=""
        fill
        priority={priority}
        sizes="100vw"
        onLoad={() => setIsLoaded(true)}
        className={cn(
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          imageClassName,
        )}
      />
    </div>
  );
}
