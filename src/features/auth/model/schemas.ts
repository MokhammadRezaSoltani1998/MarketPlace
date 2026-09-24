import z from "zod";
export const loginSchema = z.object({
  email: z
    .string()
    .min(4, "Электронная почта обязательна для заполнения")
    .pipe(z.email("Некорректный формат почты")),
  password: z.string().min(4, "Пароль обязателен для входа в аккант"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Имя должно содержать минимум 2 символа")
      .max(50, "Имя не должно превышать 50 символов"),

    email: z
      .string()
      .min(4, "Электронная почта обязательна")
      .pipe(z.email("Некорекктный формат почты")),

    password: z
      .string()
      .min(6, "Пароль должен быть не менее 6 символов")
      .regex(/[A-Z]/, "Пароль должен содержать хотя бы одну заглавную букву")
      .regex(/[0-9]/, "Пароль должен содержать хотя бы одну цифру"),

    confirmPassword: z.string().min(1, "Подтверждение пароля обязательно"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
