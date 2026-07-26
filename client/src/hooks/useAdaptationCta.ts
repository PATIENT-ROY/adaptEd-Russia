"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";

export function useAdaptationCta() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAuthenticated = Boolean(user);

  return {
    href: isAuthenticated ? "/dashboard" : "/register",
    label: t(isAuthenticated ? "home.continueAdaptation" : "home.start"),
    isAuthenticated,
  };
}
