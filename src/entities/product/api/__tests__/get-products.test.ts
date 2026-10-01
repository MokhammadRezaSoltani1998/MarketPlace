import { getProducts } from "../get-products";

const mockFrom = jest.fn();

jest.mock("@/shared/api/supabase/server", () => ({
  createClient: async () => ({ from: mockFrom }),
}));

function mockProductsQuery() {
  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data: [], error: null }),
  };
  mockFrom.mockReturnValue(query);
  return query;
}

describe("getProducts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("скрывает товары без остатка для главной страницы", async () => {
    const query = mockProductsQuery();

    await getProducts({}, { inStockOnly: true });

    expect(query.eq).toHaveBeenCalledWith("is_active", true);
    expect(query.gt).toHaveBeenCalledWith("stock_quantity", 0);
  });

  it("оставляет товары без остатка в каталоге", async () => {
    const query = mockProductsQuery();

    await getProducts();

    expect(query.eq).toHaveBeenCalledWith("is_active", true);
    expect(query.gt).not.toHaveBeenCalled();
  });
});
