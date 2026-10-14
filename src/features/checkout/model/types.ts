import type { Database, Json } from "@/shared/api/supabase/database.types";

export type DeliveryMethod = "COURIER" | "PICKUP";
export type OrderReturnStatus =
  | "RETURN_REQUESTED"
  | "RETURN_APPROVED"
  | "RETURN_REJECTED"
  | "REFUNDED";
export type OrderEventKind = "ORDER_STATUS" | "RETURN_STATUS";

type ExistingOrder = Database["public"]["Tables"]["orders"];
type DeliveryFields = {
  seller_id: string | null;
  delivery_method: DeliveryMethod;
  pickup_point_id: string | null;
  delivered_at: string | null;
};

// RPC signatures from supabase/migrations/20260928000000_atomic_orders.sql.
// This extension also describes migrations not yet reflected in generated types.
export type CheckoutDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Functions" | "Tables"> & {
    Tables: Database["public"]["Tables"] & {
      orders: Omit<ExistingOrder, "Row" | "Insert" | "Update" | "Relationships"> & {
        Row: ExistingOrder["Row"] & DeliveryFields;
        Insert: ExistingOrder["Insert"] & Partial<DeliveryFields>;
        Update: ExistingOrder["Update"] & Partial<DeliveryFields>;
        Relationships: [
          ...ExistingOrder["Relationships"],
          {
            foreignKeyName: "orders_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_attempts: {
        Row: { id: string; order_id: string; provider: string; created_at: string };
        Insert: { id?: string; order_id: string; provider: string; created_at?: string };
        Update: { id?: string; order_id?: string; provider?: string; created_at?: string };
        Relationships: [];
      };
      order_returns: {
        Row: {
          id: string;
          order_id: string;
          status: OrderReturnStatus;
          requested_at: string;
          decided_at: string | null;
          refunded_at: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          status?: OrderReturnStatus;
          requested_at?: string;
          decided_at?: string | null;
          refunded_at?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string;
          status?: OrderReturnStatus;
          requested_at?: string;
          decided_at?: string | null;
          refunded_at?: string | null;
        };
        Relationships: [{
          foreignKeyName: "order_returns_order_id_fkey";
          columns: ["order_id"];
          isOneToOne: true;
          referencedRelation: "orders";
          referencedColumns: ["id"];
        }];
      };
      order_events: {
        Row: {
          id: string;
          order_id: string;
          event_kind: OrderEventKind;
          previous_status: string | null;
          new_status: string;
          actor_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          event_kind: OrderEventKind;
          previous_status?: string | null;
          new_status: string;
          actor_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          event_kind?: OrderEventKind;
          previous_status?: string | null;
          new_status?: string;
          actor_id?: string | null;
          created_at?: string;
        };
        Relationships: [{
          foreignKeyName: "order_events_order_id_fkey";
          columns: ["order_id"];
          isOneToOne: false;
          referencedRelation: "orders";
          referencedColumns: ["id"];
        }];
      };
    };
    Functions: {
      place_order: {
        Args:
          | { p_items: Json; p_shipping_address: Json }
          | {
              p_items: Json;
              p_shipping_address: Json;
              p_delivery_method: DeliveryMethod;
              p_pickup_point_id: string | null;
            };
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
