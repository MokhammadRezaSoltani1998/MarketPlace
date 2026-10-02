import CartView from "@/features/cart/ui/cart-view";
import { createClient } from "@/shared/api/supabase/server";
import { redirect } from "next/navigation";

export default async function CheckoutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <CartView userId={user.id} checkout />;
}
