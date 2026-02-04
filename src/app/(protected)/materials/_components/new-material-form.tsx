 'use client'

import { useState, FormEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function NewMaterialForm({
  createAction,
}: {
  createAction: (formData: FormData) => Promise<void>
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    
    const form = e.currentTarget
    const formData = new FormData(form)
    
    try {
      await createAction(formData)
      form.reset()
      setSuccess('Material creado exitosamente')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
          ? err
          : 'Error al crear material'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Código *</label>
          <Input 
            name="code" 
            placeholder="MTL-001" 
            required 
            pattern="[A-Z0-9\-_]{2,20}"
            title="Solo letras mayúsculas, números, guiones y guiones bajos (2-20 caracteres)"
            className="uppercase"
          />
          <span className="text-xs text-muted-foreground">Ej: MTL-001, ACERO_01</span>
        </div>
        <div>
          <label className="text-sm font-medium">Nombre *</label>
          <Input 
            name="name" 
            placeholder="Acero" 
            required 
            minLength={2}
            maxLength={100}
          />
          <span className="text-xs text-muted-foreground">2-100 caracteres</span>
        </div>
        <div>
          <label className="text-sm font-medium">Categoría *</label>
          <Input 
            name="category" 
            placeholder="Metales" 
            required 
            minLength={2}
            maxLength={50}
          />
          <span className="text-xs text-muted-foreground">2-50 caracteres</span>
        </div>
        <div>
          <label className="text-sm font-medium">Precio (por kg) *</label>
          <Input 
            name="price" 
            type="number" 
            step="0.01" 
            min="0" 
            max="999999.99"
            required 
          />
          <span className="text-xs text-muted-foreground">Máximo: $999,999.99</span>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Descripción</label>
        <Input 
          name="description" 
          placeholder="Opcional" 
          maxLength={200}
        />
        <span className="text-xs text-muted-foreground">Máximo 200 caracteres</span>
      </div>
      
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      
      {success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
          {success}
        </div>
      )}
      
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Guardando...' : 'Guardar material'}
      </Button>
    </form>
  )
}
