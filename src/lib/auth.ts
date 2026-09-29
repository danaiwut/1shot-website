import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
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
