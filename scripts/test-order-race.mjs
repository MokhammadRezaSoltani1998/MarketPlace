import { config } from "dotenv";
import { fileURLToPath } from "node:url";

config({ path: fileURLToPath(new URL("../.env.test", import.meta.url)), quiet: true });

const cookie = process.env.ORDER_TEST_COOKIE;

if (!cookie) {
  console.error("Укажите ORDER_TEST_COOKIE с cookie авторизованной сессии.");
  process.exitCode = 1;
} else {
  const url = new URL(
    "/api/orders",
    process.env.ORDER_TEST_BASE_URL ?? "http://localhost:3000",
  );
  const body = JSON.stringify({
    items: [
      {
        product_id: "7b905a46-7f7e-4aa2-9546-24a3cbf208b9",
        quantity: 1,
      },
    ],
    shipping_address: { city: "Екатеринбург" },
  });

  try {
    const responses = await Promise.all(
      Array.from({ length: 2 }, () =>
        fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: cookie,
          },
          body,
        }),
      ),
    );

    responses.forEach((response, index) => {
      console.log(`Запрос ${index + 1}: HTTP ${response.status}`);
    });

    for (const [index, response] of responses.entries()) {
      const responseBody = await response.text();
      console.log(`Тело ответа ${index + 1}: ${responseBody}`);
    }
  } catch (error) {
    console.error("Не удалось выполнить запросы:", error);
    process.exitCode = 1;
  }
}
