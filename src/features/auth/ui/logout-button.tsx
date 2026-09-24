"use client";
import { createClient } from "@/shared/api/supabase/client";
import { useRouter } from "next/navigation";

const LogoutButton = () => {
  const supabase = createClient();
  const router = useRouter();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };
  return (
    <button
      className="text-sm text-red-600 hover:underline cursor-pointer"
      onClick={handleLogout}
    >
      Выйти
    </button>
  );
};

export default LogoutButton;
