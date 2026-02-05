 'use client'
 
 import { useState } from 'react'
 import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
 import { Input } from '@/components/ui/input'
 import { Button } from '@/components/ui/button'
 
 export default function LoginPage() {
   const router = useRouter()
   const [email, setEmail] = useState('')
   const [password, setPassword] = useState('')
   const [loading, setLoading] = useState(false)
   const [error, setError] = useState<string | null>(null)
 
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Debug: Mostrar variables de entorno (solo en desarrollo)
  if (typeof window !== 'undefined') {
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  }

   async function ensureUser(email: string) {
     await fetch('/api/auth/ensure-user', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ email }),
     })
   }
 
  async function onSignIn(e: React.FormEvent) {
     e.preventDefault()
     setError(null)
     setLoading(true)
     
     console.log('Intentando login con:', email)
     
    const { error, data } = await supabase.auth.signInWithPassword({
       email,
       password,
     })
    
    console.log('Resultado login:', { error, data })
    
     if (error) {
       console.error('Error de login:', error.message)
       setError(error.message)
       setLoading(false)
       return
     }
     console.log('Login exitoso!')
     await ensureUser(email)
    router.refresh()
     router.push('/dashboard')
   }
 
   async function onSignUp(e: React.FormEvent) {
     e.preventDefault()
     setError(null)
     setLoading(true)
    const { error } = await supabase.auth.signUp({
       email,
       password,
     })
     if (error) {
       setError(error.message)
       setLoading(false)
       return
     }
     setLoading(false)
   }
 
   return (
     <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
       <div className="w-full max-w-sm rounded-lg border bg-white p-6 shadow-sm dark:bg-neutral-900">
         <h1 className="mb-4 text-xl font-semibold">Acceso</h1>
         <form onSubmit={onSignIn} className="space-y-4">
           <div className="space-y-2">
             <label className="text-sm">Correo</label>
             <Input
               type="email"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               placeholder="correo@dominio.com"
               required
             />
           </div>
           <div className="space-y-2">
             <label className="text-sm">Contraseña</label>
             <Input
               type="password"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               placeholder="••••••••"
               required
             />
           </div>
           {error && (
             <div className="text-sm text-red-600">{error}</div>
           )}
           <Button type="submit" disabled={loading} className="w-full">
             {loading ? 'Cargando...' : 'Entrar'}
           </Button>
         </form>
         <div className="mt-4">
           <Button variant="ghost" onClick={onSignUp} disabled={loading} className="w-full">
             Crear cuenta
           </Button>
         </div>
       </div>
     </div>
   )
 }
