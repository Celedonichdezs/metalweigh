// Esta página será redirigida por el middleware
// Si ves esto, significa que el middleware no está funcionando correctamente

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-black">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">MetalWeigh</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">Redirigiendo...</p>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  )
}
