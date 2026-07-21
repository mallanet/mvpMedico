import { redirect } from "next/navigation";

/** Conflicts view removed with Google Calendar. */
export default function ConflictsPage() {
  redirect("/calendar");
}
