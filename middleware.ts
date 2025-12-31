import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "[Middleware] Missing Supabase environment variables. NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set."
    );
    // Fail open - allow request to proceed without auth checks
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  let user = null;

  try {
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

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("[Middleware] Error getting user:", authError.message);
      // Continue without user - fail open
    } else {
      user = authUser;
    }
  } catch (error) {
    console.error("[Middleware] Error creating Supabase client or getting user:", error);
    // Fail open - allow request to proceed without auth checks
    return NextResponse.next({ request });
  }

  try {
    // Protect dashboard routes
    const protectedPaths = ["/admin", "/sources", "/dashboard"];
    const isProtectedPath = protectedPaths.some((path) =>
      request.nextUrl.pathname.startsWith(path)
    );

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
