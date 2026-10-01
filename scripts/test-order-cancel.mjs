import { config } from "dotenv";
import { fileURLToPath } from "node:url";

const ORDER_ID = process.argv[2];

config({
  path: fileURLToPath(new URL("../.env.test", import.meta.url)),
  quiet: true,
});

const cookie = process.env.ORDER_TEST_COOKIE;

if (!ORDER_ID) {
  console.error("Укажите UUID заказа в константе ORDER_ID.");
  process.exitCode = 1;
} else if (!cookie) {
  console.error("Укажите ORDER_TEST_COOKIE в .env.test.");
  process.exitCode = 1;
} else {
  const url = new URL(
    `/api/orders/${encodeURIComponent(ORDER_ID)}/cancel`,
    process.env.ORDER_TEST_BASE_URL ?? "http://localhost:3000",
  );

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { Cookie: cookie },
    });

    console.log(`HTTP ${response.status}`);
    console.log(`Тело ответа: ${await response.text()}`);
  } catch (error) {
    console.error("Не удалось отправить запрос:", error);
    process.exitCode = 1;
  }
}
