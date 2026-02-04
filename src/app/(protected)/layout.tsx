import { AppSidebar } from '@/components/app-sidebar'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppSidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </div>
        
        {/* Pie de página global */}
        <footer className="py-3 px-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
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
      </main>
    </div>
  )
}
