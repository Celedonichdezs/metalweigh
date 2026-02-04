'use client'

import { useState, FormEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Client = {
  id: string
  name: string
  documentType: string | null
  document: string | null
  address: string | null
  phone: string | null
  email: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export function EditClientForm({
  client,
  updateAction,
}: {
  client: Client
  updateAction: (formData: FormData) => Promise<void>
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    
    try {
      await updateAction(formData)
      setSuccess('Cliente actualizado exitosamente')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
          ? err
          : 'Error al actualizar cliente'
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
          defaultValue={client.name} 
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
            defaultValue={client.documentType || ''}
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
            defaultValue={client.document || ''} 
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
          defaultValue={client.address || ''} 
          maxLength={200}
        />
        <span className="text-xs text-muted-foreground">Máximo 200 caracteres</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Teléfono</label>
          <Input 
            name="phone" 
            defaultValue={client.phone || ''} 
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
            defaultValue={client.email || ''} 
            type="email"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="isActive"
          value="true"
          defaultChecked={client.isActive}
          className="h-4 w-4"
        />
        <span className="text-sm font-medium">Activo</span>
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
        {loading ? 'Guardando...' : 'Guardar cambios'}
      </Button>
    </form>
  )
}
