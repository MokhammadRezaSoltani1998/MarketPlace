import { getPaymentProvider, processPaymentNotification } from "@/features/checkout/model/payments";

export async function POST(request: Request, context: { params: Promise<{ provider: string }> }) {
  const { provider: name } = await context.params;
  let provider;
  try {
    provider = getPaymentProvider(name);
  } catch {
    return Response.json({ error: "Unknown provider" }, { status: 404 });
  }
  const outcome = await processPaymentNotification(
    provider, await request.text(), request.headers,
  );
  if (outcome === "invalid") return Response.json({ error: "Invalid notification" }, { status: 400 });
  return Response.json({ outcome });
}
