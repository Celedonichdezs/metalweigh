 'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function check() {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.replace('/login')
        return
      }
      setReady(true)
    }
    check()
  }, [router])

  async function onSignOut() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (!ready) return null

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Panel</h1>
          <Button variant="outline" onClick={onSignOut}>Salir</Button>
        </div>
        <div className="mt-6">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Bienvenido. Desde aquí construiremos los módulos.
          </p>
        </div>
      </div>
      
      {/* Pie de página */}
      <footer className="py-4 px-6 border-t border-zinc-200 dark:border-zinc-800">
        <div className="text-center space-y-1">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Copyright 2026. Tecnología Inteligente para tu Negocio
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Conecta, protege y optimiza: lo hacemos fácil, lo hacemos bien
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Contacto WhatsApp 7225468979
          </p>
        </div>
      </footer>
    </div>
  )
}
