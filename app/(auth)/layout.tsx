import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <nav className="border-b border-white/10 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-gradient">robopost.ai</span>
            </Link>
          </div>
        </div>
      </nav>
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

