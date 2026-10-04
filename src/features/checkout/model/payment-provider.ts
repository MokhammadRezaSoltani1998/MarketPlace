export type PaymentNotification = {
  attemptId: string;
  status: "succeeded" | "failed";
};

export interface PaymentProvider {
  readonly name: string;
  createPayment(input: {
    attemptId: string;
    orderId: string;
    amount: number;
    origin: string;
  }): Promise<{ checkoutUrl: string }>;
  verifyNotification(body: string, headers: Headers): PaymentNotification | null;
}
