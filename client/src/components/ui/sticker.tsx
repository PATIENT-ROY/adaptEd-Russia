"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface StickerProps {
  emoji: string;
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  delay?: number;
  className?: string;
  onAnimationEnd?: () => void;
}

const sizeClasses = {
  sm: "text-2xl",
  md: "text-4xl",
  lg: "text-6xl",
  xl: "text-8xl",
};

export function Sticker({
  emoji,
  size = "md",
  animated = true,
  delay = 0,
  className,
  onAnimationEnd,
}: StickerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn(
        "inline-block transition-all duration-500",
        animated && isVisible
          ? "animate-bounce scale-110"
          : animated
          ? "opacity-0 scale-0"
          : "",
        className
      )}
      onAnimationEnd={onAnimationEnd}
    >
      <span className={cn(sizeClasses[size], "select-none")}>{emoji}</span>
    </div>
  );
}

interface CelebrationStickerProps {
  show: boolean;
  onComplete?: () => void;
  emoji?: string;
  message?: string;
}

export function CelebrationSticker({
  show,
  onComplete,
  emoji = "🎉",
  message,
}: CelebrationStickerProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (show) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show && !isAnimating) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          {/* Main emoji with bounce */}
          <div className="text-8xl animate-bounce">
            {emoji}
          </div>
          {/* Confetti effect */}
          {isAnimating && (
            <>
              <div className="absolute top-0 left-1/4 text-4xl animate-ping delay-100">
                ✨
              </div>
              <div className="absolute top-0 right-1/4 text-4xl animate-ping delay-200">
                ⭐
              </div>
              <div className="absolute bottom-0 left-1/3 text-4xl animate-ping delay-300">
                🎊
              </div>
              <div className="absolute bottom-0 right-1/3 text-4xl animate-ping delay-400">
                💫
              </div>
            </>
          )}
        </div>
        {message && (
          <p className="mt-4 text-2xl font-bold text-white drop-shadow-lg animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

interface FloatingStickerProps {
  emoji: string;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  className?: string;
}

const positionClasses = {
  "top-left": "top-4 left-4",
  "top-right": "top-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "bottom-right": "bottom-4 right-4",
};

export function FloatingSticker({
  emoji,
  position = "top-right",
  className,
}: FloatingStickerProps) {
  return (
    <div
      className={cn(
        "absolute pointer-events-none z-10",
        positionClasses[position],
        "animate-float",
        className
      )}
    >
      <span className="text-3xl sm:text-4xl select-none">{emoji}</span>
    </div>
  );
}

