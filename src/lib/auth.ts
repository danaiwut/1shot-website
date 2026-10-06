import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { serverEnv } from "./env";
import { createAdminClient } from "./supabase/admin";
import { createClient } from "./supabase/server";
import { isStaff, type Profile } from "./types";

/** Verified user + profile for this request, or null. */
export const getViewer = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single<Profile>();
  if (!profile) return null;
  // First-owner bootstrap: a confirmed account whose email is in OWNER_EMAILS becomes owner on its next visit.
  if (profile.role !== "owner" && serverEnv.ownerEmails().includes(profile.email.toLowerCase())) {
    try {
      const { error } = await createAdminClient().from("profiles").update({ role: "owner" }).eq("id", userId);
      if (!error) profile.role = "owner";
    } catch {
      // No SUPABASE_SECRET_KEY yet: stay a member until it is set.
    }
  }
  return { userId, profile, supabase };
});

export async function requireViewer() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  return viewer;
}

export async function requireStaff() {
  const viewer = await requireViewer();
  if (!isStaff(viewer.profile.role)) redirect("/dashboard");
  return viewer;
}
