"use client";

import { useState } from "react";
import type { EarlyAccessRequest, EarlyAccessResponse } from "@/types/early-access";

export default function CTA() {
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const requestBody: EarlyAccessRequest = {
        email: email.trim(),
      };

      if (companyName.trim().length > 0) {
        requestBody.companyName = companyName.trim();
      }

      const response = await fetch("/api/early-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data: EarlyAccessResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to submit early access request");
      }

      setSubmitted(true);
      setEmail("");
      setCompanyName("");
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="early-access" className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/30 via-accent-900/30 to-primary-900/30" />
      
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
          <span className="text-gradient">Ready to Automate?</span>
        </h2>
        <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
          Join the early access list and be among the first to experience
          AI-powered content automation.
        </p>
        
        {/* Sign-up form */}
        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="flex flex-col gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={loading || submitted}
              className="px-6 py-4 bg-white/5 border-2 border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company name (optional)"
              disabled={loading || submitted}
              className="px-6 py-4 bg-white/5 border-2 border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={loading || submitted}
              className="px-8 py-4 bg-gradient-accent text-white font-bold rounded-lg hover-lift hover-glow shadow-lg shadow-primary-500/50 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading
                ? "Submitting..."
                : submitted
                ? "✓ Submitted!"
                : "Get Early Access"}
            </button>
          </div>
          {submitted && (
            <p className="mt-4 text-green-400 animate-fade-in">
              Thanks! We&apos;ll be in touch soon.
            </p>
          )}
          {error && (
            <p className="mt-4 text-red-400 animate-fade-in">
              {error}
            </p>
          )}
        </form>
        
        <p className="mt-8 text-sm text-gray-500">
          No spam. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}

