import type { Database, Json } from "@/shared/api/supabase/database.types";

// RPC signatures from supabase/migrations/20260928000000_atomic_orders.sql.
// The generated database types can replace this extension after the migration is applied.
export type CheckoutDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Functions" | "Tables"> & {
    Tables: Database["public"]["Tables"] & {
      payment_attempts: {
        Row: { id: string; order_id: string; provider: string; created_at: string };
        Insert: { id?: string; order_id: string; provider: string; created_at?: string };
        Update: { id?: string; order_id?: string; provider?: string; created_at?: string };
        Relationships: [];
      };
    };
    Functions: {
      place_order: {
        Args: { p_items: Json; p_shipping_address: Json };
        Returns: string;
      };
      cancel_pending_order: {
        Args: { p_order_id: string };
        Returns: undefined;
      };
      create_payment_attempt: {
        Args: { p_order_id: string; p_provider: string };
        Returns: string;
      };
      mark_order_paid: {
        Args: { p_attempt_id: string; p_provider: string };
        Returns: string;
      };
    };
  };
};
