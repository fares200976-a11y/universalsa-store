import { supabase } from "@/lib/supabase";

export async function getOrders(status?: string) {
  let query = supabase
    .from("orders")
    .select("*, products(name, brand, model, price)")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  return { data: data || [], error };
}

export async function updateOrderStatus(id: number, status: string) {
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id);
  return { error };
}

export async function getProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  return { data: data || [], error };
}

export async function getStats() {
  const { count: totalOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true });

  const { count: pendingOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: totalProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("active", true);

  return {
    totalOrders: totalOrders || 0,
    pendingOrders: pendingOrders || 0,
    totalProducts: totalProducts || 0,
  };
}
