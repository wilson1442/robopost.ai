import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Enhanced logging to help debug
  console.log("[Middleware] Checking environment variables...");
  console.log("[Middleware] supabaseUrl exists:", !!supabaseUrl);
  console.log("[Middleware] supabaseAnonKey exists:", !!supabaseAnonKey);
  console.log("[Middleware] supabaseUrl length:", supabaseUrl?.length || 0);
  console.log("[Middleware] supabaseAnonKey length:", supabaseAnonKey?.length || 0);

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "[Middleware] Missing Supabase environment variables.",
      {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
        urlLength: supabaseUrl?.length || 0,
        keyLength: supabaseAnonKey?.length || 0,
        // Log first few chars of URL to verify it's being read (not exposing full URL)
        urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined',
      }
    );
    // Fail open - allow request to proceed without auth checks
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  let user = null;

  try {
    console.log("[Middleware] Creating Supabase client...");
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          } catch (error) {
            console.error("[Middleware] Error setting cookies:", error);
          }
        },
      },
    });

    console.log("[Middleware] Calling supabase.auth.getUser()...");
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    console.log("[Middleware] Auth result:", {
      hasUser: !!authUser,
      hasError: !!authError,
      errorMessage: authError?.message,
      userId: authUser?.id
    });

    if (authError) {
      console.error("[Middleware] Error getting user:", authError.message);
      // Continue without user - fail open
    } else {
      user = authUser;
      console.log("[Middleware] User found:", user?.id);
    }
  } catch (error) {
    console.error("[Middleware] Error creating Supabase client or getting user:", error);
    // Fail open - allow request to proceed without auth checks
    return NextResponse.next({ request });
  }

  try {
    // Protect dashboard routes
    const protectedPaths = ["/admin", "/sources", "/dashboard", "/runs"];
    const isProtectedPath = protectedPaths.some((path) =>
      request.nextUrl.pathname.startsWith(path)
    );
    const isApiRoute = request.nextUrl.pathname.startsWith("/api");
    const isProfilePage = request.nextUrl.pathname === "/profile" || request.nextUrl.pathname.startsWith("/dashboard/profile");

    if (isProtectedPath && !user) {
      try {
        const url = request.nextUrl.clone();
        url.pathname = "/sign-in";
        url.searchParams.set("redirect", request.nextUrl.pathname);
        return NextResponse.redirect(url);
      } catch (error) {
        console.error("[Middleware] Error creating redirect URL:", error);
        // If redirect fails, allow request to proceed
        return NextResponse.next({ request });
      }
    }

    // Check for industry preference requirement (skip API routes and profile page)
    if (user && isProtectedPath && !isApiRoute && !isProfilePage) {
      try {
        // Check if user has industry preference
        // We'll do a lightweight check here - full check happens in layout
        // This is just to redirect to profile if needed
        const supabaseForCheck = createServerClient(supabaseUrl, supabaseAnonKey, {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              // Don't set cookies in middleware check
            },
          },
        });

        const { data: profile } = await supabaseForCheck
          .from("user_profiles")
          .select("industry_preference_id")
          .eq("id", user.id)
          .single();

        if (!profile?.industry_preference_id) {
          const url = request.nextUrl.clone();
          url.pathname = "/profile";
          url.searchParams.set("require_industry", "true");
          return NextResponse.redirect(url);
        }
      } catch (error) {
        // If check fails, allow request to proceed (fail open)
        console.error("[Middleware] Error checking industry preference:", error);
      }
    }

    // Redirect authenticated users away from auth pages to dashboard
    if (
      (request.nextUrl.pathname === "/sign-in" ||
        request.nextUrl.pathname === "/sign-up") &&
      user
    ) {
      try {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } catch (error) {
        console.error("[Middleware] Error redirecting authenticated user:", error);
        // If redirect fails, allow request to proceed
        return NextResponse.next({ request });
      }
    }

    // Redirect authenticated users from root to dashboard
    if (request.nextUrl.pathname === "/" && user) {
      try {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } catch (error) {
        console.error("[Middleware] Error redirecting root path:", error);
        // If redirect fails, allow request to proceed
        return NextResponse.next({ request });
      }
    }
  } catch (error) {
    console.error("[Middleware] Unexpected error in route protection logic:", error);
    // Fail open - allow request to proceed
    return NextResponse.next({ request });
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
