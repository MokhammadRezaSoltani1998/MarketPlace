"use client";

import { createClient } from "@/shared/api/supabase/client";
import { useRouter } from "next/navigation";
import { loginSchema, LoginInput } from "../model/schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import Link from "next/link";

const LoginForm = () => {
  const supabase = createClient();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const onSubmit = async (values: LoginInput) => {
    setServerError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setServerError(error.message);
    } else {
      router.replace("/");
      router.refresh();
    }
  };
  return (
    <div className="max-w-sm w-full mx-auto p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
      <h2 className="text-xl font-bold mb-4 text-slate-800">Вход в систему</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            {...register("email")}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ваш имейл"
          />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Пароль</label>
          <input
            type="password"
            {...register("password")}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ваш пароль"
          />
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>
        {serverError && (
          <p className="text-sm text-red-500 bg-red-50 p-2 rounded-lg border border-red-200">
            {serverError}
          </p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:bg-blue-400"
        >
          {isSubmitting ? "Вход..." : "Войти"}
        </button>
        <p className="text-center text-sm text-slate-500">
          Еще нет аккаунта?{" "}
          <Link
            href={"/register"}
            className="text-blue-600 hover:underline font-medium"
          >
            Зарегистрируйся!
          </Link>
        </p>
      </form>
    </div>
  );
};

export default LoginForm;
