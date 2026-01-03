import { requireAuth } from "@/lib/auth/auth";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const supabase = await createClient();

  // Check database user profile for role field
  const { data: dbProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Debug logging for Vercel (works in both local and production)
  console.log('=== ADMIN DEBUG ===');
  console.log('User ID:', user.id);
  console.log('User metadata:', JSON.stringify(user.user_metadata, null, 2));
  console.log('App metadata:', JSON.stringify(user.app_metadata, null, 2));
  console.log('Raw user metadata:', JSON.stringify(user.raw_user_meta_data, null, 2));
  console.log('Raw app metadata:', JSON.stringify(user.raw_app_meta_data, null, 2));
  console.log('Database profile:', JSON.stringify(dbProfile, null, 2));
  console.log('Database profile role:', dbProfile?.role);
  console.log('=== END ADMIN DEBUG ===');

  // Check if user is admin (check both processed and raw metadata)
  const isAdmin = user.user_metadata?.role === "admin" ||
                  user.app_metadata?.role === "admin" ||
                  user.raw_user_meta_data?.role === "admin" ||
                  user.raw_app_meta_data?.role === "admin";
  const userRole = isAdmin ? "Admin" : "User";

  console.log('Final admin check result:', { isAdmin, userRole });

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="border-b border-white/10 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link href="/dashboard" className="flex items-center">
                <span className="text-xl font-bold text-gradient">robopost.ai</span>
              </Link>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:text-white border-b-2 border-transparent hover:border-primary-500 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/runs"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:text-white border-b-2 border-transparent hover:border-primary-500 transition-colors"
                >
                  Runs
                </Link>
                <Link
                  href="/sources"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:text-white border-b-2 border-transparent hover:border-primary-500 transition-colors"
                >
                  Sources
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin/users"
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:text-white border-b-2 border-transparent hover:border-primary-500 transition-colors"
                  >
                    Admin
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                isAdmin
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
              }`}>
                {userRole}
              </span>
              <Link
                href="/dashboard/profile"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Profile
              </Link>
              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

