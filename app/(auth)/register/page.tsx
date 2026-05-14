import { redirect } from "next/navigation";

/**
 * Registration is handled via OAuth (Google/GitHub).
 * Redirect to the login page where users can sign in.
 */
export default function RegisterPage() {
  redirect("/login");
}
