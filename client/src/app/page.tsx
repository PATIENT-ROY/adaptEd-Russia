import HomeContent from "./home-content";
import {
  TOTAL_GUIDES_COUNT,
  EDUCATION_GUIDES_COUNT,
  LIFE_GUIDES_COUNT,
  SUPPORTED_LANGUAGES_COUNT,
} from "@/constants/content-stats";

export default function HomePage() {
  return (
    <HomeContent
      TOTAL_GUIDES_COUNT={TOTAL_GUIDES_COUNT}
      EDUCATION_GUIDES_COUNT={EDUCATION_GUIDES_COUNT}
      LIFE_GUIDES_COUNT={LIFE_GUIDES_COUNT}
      SUPPORTED_LANGUAGES_COUNT={SUPPORTED_LANGUAGES_COUNT}
    />
  );
}
