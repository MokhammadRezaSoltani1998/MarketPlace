import { createClient as createServiceClient } from "@supabase/supabase-js";
import { MockPaymentProvider } from "./mock-payment-provider";
import type { PaymentProvider } from "./payment-provider";
import type { CheckoutDatabase } from "./types";

const mockProvider = new MockPaymentProvider();

export function getPaymentProvider(name = process.env.PAYMENT_PROVIDER ?? "mock"): PaymentProvider {
  if (name === mockProvider.name) return mockProvider;
  throw new Error(`Unknown payment provider: ${name}`);
}

export function getMockPaymentProvider() {
  return mockProvider;
}

export async function processPaymentNotification(
  provider: PaymentProvider,
  body: string,
  headers: Headers,
): Promise<"paid" | "failed" | "expired" | "invalid"> {
  const event = provider.verifyNotification(body, headers);
  if (!event) return "invalid";
  if (event.status === "failed") return "failed";

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
  const supabase = createServiceClient<CheckoutDatabase>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { error } = await supabase.rpc("mark_order_paid", {
    p_attempt_id: event.attemptId,
    p_provider: provider.name,
  });
  if (error?.message.includes("ORDER_NOT_PAYABLE")) return "expired";
  if (error) throw error;
  return "paid";
}
