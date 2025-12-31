import { requireGuest } from "@/lib/auth/auth";
import SignUpForm from "@/components/auth/SignUpForm";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up - robopost.ai",
  description: "Create your robopost.ai account",
};

export default async function SignUpPage() {
  await requireGuest();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-gradient">Sign Up</span>
          </h1>
          <p className="text-gray-400">Create your robopost.ai account</p>
        </div>

        <div className="glass-effect rounded-2xl p-8 shadow-xl">
          <SignUpForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-primary-400 hover:text-primary-300 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

