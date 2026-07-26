"use client";

import { motion, useReducedMotion } from "framer-motion";
import { floatLoop, planeLoop } from "@/components/home/home-motion";

export function StudentAdaptationIllustration() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <svg
      viewBox="0 0 560 580"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-[320px] w-full sm:h-[420px] md:h-[520px] lg:h-[580px] max-w-[560px] mx-auto"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="skyGlow" x1="80" y1="40" x2="480" y2="420" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EEF2FF" />
          <stop offset="1" stopColor="#F5F3FF" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="buildingFill" x1="360" y1="180" x2="520" y2="420" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E0E7FF" />
          <stop offset="1" stopColor="#C7D2FE" />
        </linearGradient>
        <linearGradient id="jacketFill" x1="150" y1="300" x2="290" y2="470" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4F46E5" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
        <linearGradient id="planeFill" x1="70" y1="70" x2="180" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#EEF2FF" />
        </linearGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#6366F1" floodOpacity="0.12" />
        </filter>
      </defs>

      <rect width="560" height="580" fill="url(#skyGlow)" rx="24" />

      <motion.path
        d="M48 92C120 78 190 96 248 118"
        stroke="#93C5FD"
        strokeWidth="2"
        strokeDasharray="6 10"
        strokeLinecap="round"
        opacity="0.7"
        animate={
          shouldReduceMotion
            ? undefined
            : { strokeDashoffset: [0, -32] }
        }
        transition={
          shouldReduceMotion
            ? undefined
            : { duration: 2.8, repeat: Infinity, ease: "linear" }
        }
      />

      <motion.g
        filter="url(#softShadow)"
        style={{ transformOrigin: "274px 118px", rotate: -8 }}
        animate={shouldReduceMotion ? undefined : planeLoop}
      >
        <g transform="translate(228 108)">
          <path
            d="M0 18L88 10L96 18L88 26L0 18Z"
            fill="url(#planeFill)"
            stroke="#6366F1"
            strokeWidth="1.5"
          />
          <path d="M34 18L52 0L58 18L52 36L34 18Z" fill="#818CF8" />
          <path d="M72 18L84 14V22L72 18Z" fill="#A5B4FC" />
          <circle cx="18" cy="18" r="3" fill="#6366F1" opacity="0.35" />
        </g>
      </motion.g>

      <motion.g
        filter="url(#softShadow)"
        animate={shouldReduceMotion ? undefined : { scale: [1, 1.015, 1] }}
        transition={
          shouldReduceMotion
            ? undefined
            : { duration: 5, repeat: Infinity, ease: "easeInOut" }
        }
        style={{ transformOrigin: "420px 340px" }}
      >
        <path d="M318 420H522V250H318V420Z" fill="url(#buildingFill)" />
        <path d="M300 250H540L420 188L300 250Z" fill="#A5B4FC" />
        <rect x="318" y="250" width="204" height="8" fill="#818CF8" opacity="0.55" />
        <rect x="348" y="286" width="34" height="34" rx="4" fill="#FFFFFF" opacity="0.85" />
        <rect x="402" y="286" width="34" height="34" rx="4" fill="#FFFFFF" opacity="0.85" />
        <rect x="456" y="286" width="34" height="34" rx="4" fill="#FFFFFF" opacity="0.85" />
        <rect x="348" y="338" width="34" height="34" rx="4" fill="#FFFFFF" opacity="0.7" />
        <rect x="402" y="338" width="34" height="34" rx="4" fill="#FFFFFF" opacity="0.7" />
        <rect x="456" y="338" width="34" height="34" rx="4" fill="#FFFFFF" opacity="0.7" />
        <rect x="372" y="388" width="22" height="32" rx="2" fill="#6366F1" opacity="0.25" />
        <rect x="408" y="388" width="22" height="32" rx="2" fill="#6366F1" opacity="0.25" />
        <rect x="444" y="388" width="22" height="32" rx="2" fill="#6366F1" opacity="0.25" />
        <path d="M334 420H506" stroke="#818CF8" strokeWidth="3" strokeLinecap="round" />
        <path d="M352 420V250M420 420V250M488 420V250" stroke="#818CF8" strokeWidth="2" opacity="0.45" />
      </motion.g>

      <ellipse cx="280" cy="536" rx="220" ry="18" fill="#8B5CF6" fillOpacity="0.1" />

      <motion.g
        transform="translate(118 430)"
        animate={shouldReduceMotion ? undefined : { y: [0, -4, 0], rotate: [0, -1.5, 0] }}
        transition={
          shouldReduceMotion
            ? undefined
            : { duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }
        }
      >
        <rect x="0" y="0" width="74" height="52" rx="10" fill="#FFFFFF" stroke="#6366F1" strokeWidth="2" />
        <rect x="10" y="10" width="54" height="8" rx="4" fill="#C7D2FE" />
        <rect x="10" y="24" width="38" height="6" rx="3" fill="#E0E7FF" />
        <path d="M27 -8C27 -14 33 -18 37 -18C41 -18 47 -14 47 -8" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="18" cy="52" r="6" fill="#4F46E5" />
        <circle cx="56" cy="52" r="6" fill="#4F46E5" />
      </motion.g>

      <motion.g
        filter="url(#softShadow)"
        animate={shouldReduceMotion ? undefined : floatLoop}
        style={{ transformOrigin: "248px 400px" }}
      >
        <path d="M214 470L198 536H228L236 470H214Z" fill="#312E81" />
        <path d="M262 470L254 536H284L270 470H262Z" fill="#312E81" />
        <path d="M188 536H238C238 528 232 522 224 522H202C194 522 188 528 188 536Z" fill="#1E1B4B" />
        <path d="M244 536H294C294 528 288 522 280 522H258C250 522 244 528 244 536Z" fill="#1E1B4B" />
        <path
          d="M188 332C188 300 214 276 248 276C282 276 308 300 308 332V470H188V332Z"
          fill="url(#jacketFill)"
        />
        <path d="M224 332H272V362C272 372 262 380 248 380C234 380 224 372 224 362V332Z" fill="#818CF8" opacity="0.55" />
        <rect x="292" y="302" width="54" height="88" rx="14" fill="#4338CA" />
        <rect x="304" y="318" width="30" height="10" rx="5" fill="#6366F1" />
        <rect x="304" y="338" width="30" height="10" rx="5" fill="#6366F1" opacity="0.75" />
        <path d="M292 318C276 318 268 332 268 348" stroke="#312E81" strokeWidth="4" strokeLinecap="round" />
        <path d="M346 318C362 318 370 332 370 348" stroke="#312E81" strokeWidth="4" strokeLinecap="round" />
        <circle cx="248" cy="236" r="40" fill="#9A6B43" />
        <path
          d="M208 228C210 196 226 176 248 176C270 176 286 196 288 228C284 214 268 204 248 204C228 204 212 214 208 228Z"
          fill="#1E1B4B"
        />
        <ellipse cx="248" cy="248" rx="34" ry="30" fill="#B8835A" />
        <rect x="168" y="360" width="34" height="44" rx="6" fill="#FFFFFF" stroke="#6366F1" strokeWidth="1.5" />
        <path d="M176 374H194M176 384H188M176 394H192" stroke="#C7D2FE" strokeWidth="2" strokeLinecap="round" />
      </motion.g>

      <motion.circle
        cx="88"
        cy="170"
        r="28"
        fill="#DBEAFE"
        opacity="0.65"
        animate={shouldReduceMotion ? undefined : { scale: [1, 1.12, 1], opacity: [0.45, 0.75, 0.45] }}
        transition={shouldReduceMotion ? undefined : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle
        cx="500"
        cy="150"
        r="18"
        fill="#EDE9FE"
        opacity="0.8"
        animate={shouldReduceMotion ? undefined : { scale: [1, 1.15, 1], opacity: [0.55, 0.9, 0.55] }}
        transition={
          shouldReduceMotion
            ? undefined
            : { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }
        }
      />
      <motion.circle
        cx="468"
        cy="468"
        r="12"
        fill="#C7D2FE"
        opacity="0.55"
        animate={shouldReduceMotion ? undefined : { scale: [1, 1.2, 1] }}
        transition={
          shouldReduceMotion
            ? undefined
            : { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.4 }
        }
      />
    </svg>
  );
}
