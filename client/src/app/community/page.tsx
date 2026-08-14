import { redirect } from "next/navigation";

/** Canonical community UI lives at /community/questions */
export default function CommunityIndexPage() {
  redirect("/community/questions");
}
