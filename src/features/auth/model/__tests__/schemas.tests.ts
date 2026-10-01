import { loginSchema, registerSchema } from "../schemas";

describe("loginSchema", () => {
  it("успешно проходит валидацию с корректным email и паролем", () => {
    const validData = {
      email: "user@example.com",
      password: "password123",
    };

    const result = loginSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  it("возвращает ошибку, если передан некорректный email", () => {
    const invalidData = {
      email: "invalid-email-format",
      password: "password123",
    };

    const result = loginSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe("email");
    }
  });

  it("возвращает ошибку, если пароль слишком короткий", () => {
    const invalidData = {
      email: "user@example.com",
      password: "123",
    };

    const result = loginSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe("password");
    }
  });
});

describe("registerSchema", () => {
  it("Успешно проходит регистрацию с правильным name/email/валидным password/совпадающим confirmPassword", () => {
    const validData = {
      name: "someUser",
      email: "user@example.com",
      password: "Password123",
      confirmPassword: "Password123",
    };
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("Не проходит регистрацию, если password/confirmPassword не совпадают", () => {
    const invalidData = {
      name: "someUser",
      email: "user@example.come",
      password: "Password123",
      confirmPassword: "Password1234",
    };
    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe("confirmPassword");
    }
  });

  it("Не проходит регистрацию, при передаче невалидных полей email/password", () => {
    const invalidData = {
      name: "someUser",
      email: "",
      password: "1",
      confirmPassword: "1",
    };
    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe("email");
    }
  });
});
