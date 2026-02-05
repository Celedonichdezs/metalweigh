'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState, useMemo } from 'react'
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Scale, 
  History, 
  LogOut,
  Menu,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Nueva Transacción', href: '/transactions', icon: Scale },
  { name: 'Materiales', href: '/materials', icon: Package },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Historial', href: '/history', icon: History },
  { name: 'Inventario', href: '/inventory', icon: Package }, 
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<{ name?: string; email: string } | null>(null)

  // Inicializar Supabase una sola vez
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      console.error('Supabase environment variables are not configured')
      return null
    }

    return createBrowserClient(url, key)
  }, [])

  useEffect(() => {
    if (!supabase) return

    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUser({
            name: user.user_metadata?.name || user.email?.split('@')[0],
            email: user.email!
          })
        }
      } catch (error) {
        console.error('Error getting user:', error)
      }
    }
    
    getUser()
  }, [supabase])

  const handleSignOut = async () => {
    if (!supabase) return
    
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden p-4 border-b flex justify-between items-center bg-white dark:bg-zinc-900">
        <span className="font-bold text-xl">MetalWeigh</span>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900 text-white transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:inset-auto md:flex md:flex-col",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center justify-center border-b border-zinc-800">
          <h1 className="text-xl font-bold">MetalWeigh</h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800 space-y-3">
          {user && (
            <div className="flex items-center gap-3 px-2 py-1">
              <User className="h-4 w-4 text-zinc-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-300 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-zinc-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          )}
          
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-zinc-400 hover:text-red-400 hover:bg-zinc-800"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            Cerrar Sesión
          </Button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}
