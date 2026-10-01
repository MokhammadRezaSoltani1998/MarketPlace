import type { Database, Json } from "@/shared/api/supabase/database.types";

// RPC signatures from supabase/migrations/20260928000000_atomic_orders.sql.
// The generated database types can replace this extension after the migration is applied.
export type CheckoutDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Functions"> & {
    Functions: {
      place_order: {
        Args: { p_items: Json; p_shipping_address: Json };
        Returns: string;
      };
      cancel_pending_order: {
        Args: { p_order_id: string };
        Returns: undefined;
      };
    };
  };
};
