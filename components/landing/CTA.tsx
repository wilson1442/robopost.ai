"use client";

import { useState } from "react";

export default function CTA() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Phase 1: UI only, no backend
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setEmail("");
    }, 3000);
  };

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
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
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 px-6 py-4 bg-white/5 border-2 border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/50 transition-all"
            />
            <button
              type="submit"
              className="px-8 py-4 bg-gradient-accent text-white font-bold rounded-lg hover-lift hover-glow shadow-lg shadow-primary-500/50 whitespace-nowrap"
            >
              {submitted ? "✓ Submitted!" : "Get Early Access"}
            </button>
          </div>
          {submitted && (
            <p className="mt-4 text-green-400 animate-fade-in">
              Thanks! We&apos;ll be in touch soon.
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

