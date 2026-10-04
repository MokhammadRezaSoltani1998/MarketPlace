import { createHmac, timingSafeEqual } from "node:crypto";
import type { PaymentProvider } from "./payment-provider";
import { z } from "zod";

const notificationSchema = z.object({
  attemptId: z.uuid(),
  status: z.enum(["succeeded", "failed"]),
});

function signature(body: string) {
  const secret = process.env.MOCK_PAYMENT_WEBHOOK_SECRET;
  if (!secret) throw new Error("MOCK_PAYMENT_WEBHOOK_SECRET is required");
  return createHmac("sha256", secret).update(body).digest("hex");
}

export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  async createPayment({ attemptId, origin }: Parameters<PaymentProvider["createPayment"]>[0]) {
    return { checkoutUrl: new URL(`/pay/mock/${attemptId}`, origin).toString() };
  }

  verifyNotification(body: string, headers: Headers) {
    const supplied = headers.get("x-mock-signature");
    if (!supplied || !/^[a-f0-9]{64}$/.test(supplied)) return null;
    const expected = Buffer.from(signature(body), "hex");
    if (!timingSafeEqual(expected, Buffer.from(supplied, "hex"))) return null;
    try {
      const parsed = notificationSchema.safeParse(JSON.parse(body));
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  }

  // Used by the authenticated demo confirmation endpoint, never by the browser.
  makeSuccessNotification(attemptId: string) {
    const body = JSON.stringify({ attemptId, status: "succeeded" });
    return { body, headers: new Headers({ "x-mock-signature": signature(body) }) };
  }
}
