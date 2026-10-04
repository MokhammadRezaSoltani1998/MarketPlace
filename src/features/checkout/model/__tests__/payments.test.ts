import { MockPaymentProvider } from "../mock-payment-provider";
import { processPaymentNotification } from "../payments";
const mockRpc = jest.fn();
jest.mock("@supabase/supabase-js", () => ({ createClient: () => ({ rpc: mockRpc }) }));

const provider = new MockPaymentProvider();
const attemptId = "c1364f45-25c5-4445-9221-8abcdb520b00";

beforeEach(() => {
  process.env.MOCK_PAYMENT_WEBHOOK_SECRET = "test-secret";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  mockRpc.mockReset();
});

afterAll(() => {
  delete process.env.MOCK_PAYMENT_WEBHOOK_SECRET;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
});

it("rejects a changed or unsigned notification before touching the order", async () => {
  const notification = provider.makeSuccessNotification(attemptId);
  expect(await processPaymentNotification(provider, notification.body.replace("succeeded", "failed"), notification.headers))
    .toBe("invalid");
  expect(await processPaymentNotification(provider, notification.body, new Headers())).toBe("invalid");
  expect(mockRpc).not.toHaveBeenCalled();
});

it("passes a verified success to the shared order transition", async () => {
  mockRpc.mockResolvedValue({ data: attemptId, error: null });
  const notification = provider.makeSuccessNotification(attemptId);
  expect(await processPaymentNotification(provider, notification.body, notification.headers)).toBe("paid");
  expect(mockRpc).toHaveBeenCalledWith("mark_order_paid", {
    p_attempt_id: attemptId,
    p_provider: "mock",
  });
});

it("accepts a late notification without marking the order paid", async () => {
  mockRpc.mockResolvedValue({ data: null, error: { message: "ORDER_NOT_PAYABLE" } });
  const notification = provider.makeSuccessNotification(attemptId);
  expect(await processPaymentNotification(provider, notification.body, notification.headers)).toBe("expired");
});
