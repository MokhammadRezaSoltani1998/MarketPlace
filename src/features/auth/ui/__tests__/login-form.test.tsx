import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "../login-form";
const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
  }),
}));

const mockSignInWithPassword = jest.fn();
jest.mock("@/shared/api/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  }),
}));

describe("LoginForm Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("успешно заполняет форму и вызывает функцию входа в Supabase", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: { id: "123", email: "user@example.com" } },
      error: null,
    });

    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText(/Ваш имейл/i);
    const passwordInput = screen.getByPlaceholderText(/Ваш пароль/i);
    const submitButton = screen.getByRole("button", { name: /Войти/i });

    await user.type(emailInput, "user@example.com");
    await user.type(passwordInput, "Password123");
    await user.click(submitButton);

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "Password123",
    });

    expect(mockRefresh).toHaveBeenCalled();
  });
});
