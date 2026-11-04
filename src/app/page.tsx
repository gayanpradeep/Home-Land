import { redirect } from "next/navigation";

// The root URL is the public kiosk entry point — most visits to this app are a
// tablet opening its browser, not an admin. Admins go to /admin explicitly
// (bookmarked or typed), which has its own login gate.
export default function Home() {
  redirect("/rating");
}
