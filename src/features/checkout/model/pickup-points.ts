export const PICKUP_CITIES = ["Москва", "Санкт-Петербург", "Екатеринбург"] as const;

export type PickupCity = (typeof PICKUP_CITIES)[number];
export type PickupProvider = "Яндекс Маркет" | "Ozon" | "Wildberries";

export type PickupPoint = {
  id: string;
  city: PickupCity;
  provider: PickupProvider;
  address: string;
  mapUrl: string;
};

// Demo locations only. The storefront has no delivery integration with these networks.
export const PICKUP_POINTS = [
  {
    id: "moscow-yandex-zapovednaya-18-4",
    city: "Москва",
    provider: "Яндекс Маркет",
    address: "Заповедная ул., 18, корп. 4",
    mapUrl: "https://yandex.ru/maps/213/moscow/house/zapovednaya_ulitsa_18k4/Z04YcARoS0wBQFtvfXR3eXRibQ%3D%3D/",
  },
  {
    id: "moscow-ozon-permskaya-7-2",
    city: "Москва",
    provider: "Ozon",
    address: "Пермская ул., 7, стр. 2",
    mapUrl: "https://yandex.ru/maps/213/moscow/house/permskaya_ulitsa_7s2/Z04YcQRhTUEEQFtvfXRzcHlmbA%3D%3D/inside/",
  },
  {
    id: "moscow-wildberries-skhodnenskaya-6-1",
    city: "Москва",
    provider: "Wildberries",
    address: "Сходненская ул., 6, корп. 1",
    mapUrl: "https://yandex.ru/maps/213/moscow/house/skhodnenskaya_ulitsa_6k1/Z04YcgRpS0cGQFtvfXRyeHRhYQ%3D%3D/inside/",
  },
  {
    id: "spb-yandex-moskovskiy-220",
    city: "Санкт-Петербург",
    provider: "Яндекс Маркет",
    address: "Московский просп., 220",
    mapUrl: "https://yandex.ru/maps/2/saint-petersburg/house/moskovskiy_prospekt_220/Z0kYdQViTEQBQFtjfXR1d3RgZA%3D%3D/inside/",
  },
  {
    id: "spb-ozon-lyzhny-6",
    city: "Санкт-Петербург",
    provider: "Ozon",
    address: "Лыжный пер., 6",
    mapUrl: "https://yandex.ru/maps/org/ozon/126834188194/",
  },
  {
    id: "spb-wildberries-mebelnaya-49-92",
    city: "Санкт-Петербург",
    provider: "Wildberries",
    address: "Мебельная ул., 49/92",
    mapUrl: "https://yandex.ru/maps/org/wildberries/212968621048/",
  },
  {
    id: "ekb-yandex-vostochnaya-34",
    city: "Екатеринбург",
    provider: "Яндекс Маркет",
    address: "Восточная ул., 34",
    mapUrl: "https://yandex.ru/maps/54/yekaterinburg/house/vostochnaya_ulitsa_34/YkkYcAVmSUUCQFtsfXR1eXxlZA%3D%3D/",
  },
  {
    id: "ekb-ozon-krasnolesya-16-3",
    city: "Екатеринбург",
    provider: "Ozon",
    address: "ул. Краснолесья, 16, корп. 3",
    mapUrl: "https://yandex.ru/maps/54/yekaterinburg/house/ulitsa_krasnolesya_16k3/YkkYcwNmQE0HQFtsfXt5cHtmbQ%3D%3D/",
  },
  {
    id: "ekb-wildberries-mekhrentseva-46",
    city: "Екатеринбург",
    provider: "Wildberries",
    address: "ул. Анатолия Мехренцева, 46",
    mapUrl: "https://yandex.ru/maps/org/wildberries/134187586337/",
  },
] as const satisfies readonly PickupPoint[];
