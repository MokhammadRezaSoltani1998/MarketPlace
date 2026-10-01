# MarketPlace

Маркетплейс на Next.js 16, React 19 и Supabase. Есть регистрация и вход, главная страница с товарами в наличии, каталог опубликованных товаров и страницы товаров. Серверные API позволяют создавать и отменять заказы; интерфейс корзины и оформления пока не реализован.

## Запуск

1. Установите зависимости: `npm ci`.
2. Создайте `.env.local` с `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY` своего проекта Supabase.
3. Примените SQL-файлы из `supabase/migrations` к своей БД в порядке имён.
4. Запустите `npm run dev` и откройте http://localhost:3000.

## Проверки

- `npx tsc --noEmit` — TypeScript.
- `npm run lint` — ESLint.
- `npm test -- --runInBand` — тесты Jest.
- `npm run build` — сборка Next.js.

## Структура

- `src/app` — маршруты и страницы Next.js.
- `src/entities` — товары и другие доменные сущности.
- `src/features` — авторизация и оформление заказа.
- `src/widgets` — составные блоки интерфейса.
- `src/shared` — клиенты Supabase, типы и общая инфраструктура.
- `scripts` — ручные проверки заказов; для них нужен `.env.test` с `ORDER_TEST_COOKIE`.
