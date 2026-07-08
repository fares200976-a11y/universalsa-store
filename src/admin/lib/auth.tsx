import { supabase } from "@/lib/supabase";

export async function loginAdmin(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { error };

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (userData?.role !== "admin") {
    await supabase.auth.signOut();
    return { error: { message: "Accès réservé aux administrateurs" } };
  }

  return { user: data.user };
}

export async function logoutAdmin() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: userData } = await supabase
    .from("users")
    .select("role, name")
    .eq("id", session.user.id)
    .single();

  if (userData?.role !== "admin") return null;

  return { ...session.user, ...userData };
}
