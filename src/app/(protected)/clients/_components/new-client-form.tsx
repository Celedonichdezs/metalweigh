'use client'

import { useState, FormEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function NewClientForm({
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
      setSuccess('Cliente creado exitosamente')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
          ? err
          : 'Error al crear cliente'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium">Nombre *</label>
        <Input 
          name="name" 
          placeholder="Juan Pérez" 
          required 
          minLength={2}
          maxLength={100}
        />
        <span className="text-xs text-muted-foreground">2-100 caracteres</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Tipo de documento</label>
          <select 
            name="documentType" 
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Seleccionar...</option>
            <option value="RFC">RFC</option>
            <option value="CURP">CURP</option>
            <option value="Pasaporte">Pasaporte</option>
            <option value="Cédula">Cédula</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Documento</label>
          <Input 
            name="document" 
            placeholder="ABC123456XYZ" 
            minLength={5}
            maxLength={50}
          />
          <span className="text-xs text-muted-foreground">5-50 caracteres</span>
        </div>
      </div>
      
      <div>
        <label className="text-sm font-medium">Dirección</label>
        <Input 
          name="address" 
          placeholder="Calle Principal #123, Ciudad" 
          maxLength={200}
        />
        <span className="text-xs text-muted-foreground">Máximo 200 caracteres</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Teléfono</label>
          <Input 
            name="phone" 
            placeholder="+52 555 123 4567" 
            type="tel"
            pattern="[+]?[\d\s\-\(\)]{10,}"
            title="Formato: +52 555 123 4567 o 5551234567"
          />
          <span className="text-xs text-muted-foreground">10+ dígitos</span>
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <Input 
            name="email" 
            placeholder="correo@ejemplo.com" 
            type="email"
          />
        </div>
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
        {loading ? 'Guardando...' : 'Guardar cliente'}
      </Button>
    </form>
  )
}
