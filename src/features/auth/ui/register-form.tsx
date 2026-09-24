"use client";

import { createClient } from "@/shared/api/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterInput, registerSchema } from "../model/schemas";
import Link from "next/link";
const RegisterForm = () => {
  const supabase = createClient();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });
  const onSubmit = async (values: RegisterInput) => {
    setServerError(null);
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.name,
        },
      },
    });
    if (error) {
      setServerError(error.message);
    } else if (data.session) {
      router.replace("/");
      router.refresh();
    } else {
      setIsSuccess(true);
    }
  };
  return (
    <div className="max-w-sm w-full mx-auto p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
      {isSuccess ? (
        <div className="text-center py-4">
          <span className="text-3xl">✉️</span>
          <h2 className="text-lg font-semibold text-slate-800 mt-2">
            Регистрация успешна!
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Мы отправили письмо для подтверждения на вашу почту.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Имя</label>
            <input
              type="text"
              {...register("name")}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите ваше имя"
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              {...register("email")}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ваш имейл, example@mail.com"
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
              placeholder="Укажите надежный пароль"
            />
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">
              Подтвердите пароль
            </label>
            <input
              type="password"
              {...register("confirmPassword")}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Укажите надежный пароль"
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-500">
                {errors.confirmPassword.message}
              </p>
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
            {isSubmitting ? "Регистрация..." : "Зарегистрироваться"}
          </button>
          <p className="text-center text-sm text-slate-500">
            Уже есть аккаунт?{" "}
            <Link
              href={"/login"}
              className="text-blue-600 hover:underline font-medium"
            >
              Переходи по ссылке входа в аккаунт!
            </Link>
          </p>
        </form>
      )}
    </div>
  );
};

export default RegisterForm;
