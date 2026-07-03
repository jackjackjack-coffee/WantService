import { Suspense } from "react";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import Logo from "@/components/Logo";
import { getSessionUser } from "@/lib/auth";

export const metadata = { title: "로그인" };

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/dashboard");
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <Suspense>
          <AuthForm mode="login" />
        </Suspense>
      </div>
    </div>
  );
}
