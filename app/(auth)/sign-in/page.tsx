import { requireGuest } from "@/lib/auth/auth";
import SignInForm from "@/components/auth/SignInForm";
import Link from "next/link";
import { Suspense } from "react";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; redirect?: string }>;
}) {
  await requireGuest();
  
  const params = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-gradient">Sign In</span>
          </h1>
          <p className="text-gray-400">Welcome back to robopost.ai</p>
        </div>

        <div className="glass-effect rounded-2xl p-8 shadow-xl">
          {params.message && (
            <div className="mb-6 p-4 bg-primary-500/10 border border-primary-500/50 rounded-lg text-primary-300 text-sm">
              {params.message}
            </div>
          )}
          <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
            <SignInForm />
          </Suspense>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Don't have an account?{" "}
              <Link href="/sign-up" className="text-primary-400 hover:text-primary-300 font-semibold">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

