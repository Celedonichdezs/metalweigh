 'use client'
 
import { useState, useMemo } from 'react'
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

  // Inicializar Supabase una sola vez (memoizado)
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      throw new Error('Supabase environment variables are not configured')
    }

    return createBrowserClient(url, key)
  }, [])

  async function ensureUser(email: string) {
    try {
      const response = await fetch('/api/auth/ensure-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!response.ok) {
        console.error('Error ensuring user:', response.statusText)
      }
    } catch (err) {
      console.error('Error in ensureUser:', err)
    }
  }

  async function onSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      // Usuario autenticado exitosamente
      if (data.user?.email) {
        await ensureUser(data.user.email)
      }
      router.push('/dashboard')
    } catch (err) {
      setError('Error durante el login. Intenta nuevamente.')
      setLoading(false)
    }
  }

  async function onSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      // Limpiar formulario
      setEmail('')
      setPassword('')
      setError(null)
      alert('Cuenta creada. Por favor verifica tu correo electrónico')
    } catch (err) {
      setError('Error durante el registro. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-md rounded-lg border bg-white p-8 shadow-sm dark:bg-neutral-900">
        <h1 className="mb-4 text-xl font-semibold">Acceso</h1>
        <form onSubmit={onSignIn} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Correo</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@dominio.com"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Contraseña</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••••"
              required
            />
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>
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
