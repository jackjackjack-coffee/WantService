import { Suspense } from "react";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import Logo from "@/components/Logo";
import { getSessionUser } from "@/lib/auth";

export const metadata = { title: "무료 가입" };

export default async function SignupPage() {
  if (await getSessionUser()) redirect("/dashboard");
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8">
        <div className="mb-2 flex justify-center">
          <Logo />
        </div>
        <p className="mb-6 text-center text-sm text-mut">
          카드 등록 없이 무료로 시작 — 관심기업 3개까지
        </p>
        <Suspense>
          <AuthForm mode="signup" />
        </Suspense>
      </div>
    </div>
  );
}
