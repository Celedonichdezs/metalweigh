import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Si las variables no están configuradas, redirigir a login
  if (!supabaseUrl || !supabaseKey) {
    if (pathname !== '/login') {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              request.cookies.set(name, value)
            })
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Rutas protegidas
    const protectedPaths = ['/dashboard', '/materials', '/clients', '/transactions', '/inventory', '/history', '/']
    const isProtected = protectedPaths.some(path => pathname === path || pathname.startsWith(path + '/'))

    // Si no hay usuario y es una ruta protegida → redirigir a login
    if (!user && isProtected) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // Si hay usuario y está en login → redirigir a dashboard
    if (user && pathname === '/login') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // Si hay usuario y está en la raíz → redirigir a dashboard
    if (user && pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  } catch (error) {
    console.error('Middleware error:', error)
    
    // En caso de error, redirigir a login si es una ruta protegida
    if (pathname === '/' || pathname.startsWith('/dashboard') || pathname.startsWith('/materials') || 
        pathname.startsWith('/clients') || pathname.startsWith('/transactions') || pathname.startsWith('/inventory') || 
        pathname.startsWith('/history')) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
