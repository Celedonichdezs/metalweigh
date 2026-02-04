'use client'

import { useState, FormEvent, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { generateTransactionPDF } from '@/lib/client-pdf-generator'

type Client = {
  id: string
  name: string
  document: string | null
  documentType: string | null
}

type Material = {
  id: string
  name: string
  code: string
  price: number
}

type TransactionItem = {
  materialId: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export function NewTransactionForm({
  createAction,
  clients,
  materials,
}: {
  createAction: (formData: FormData) => Promise<void>
  clients: Client[]
  materials: Material[]
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [items, setItems] = useState<TransactionItem[]>([
    { materialId: '', quantity: 0, unitPrice: 0, subtotal: 0 }
  ])
  
  // Refs para los inputs de cantidad
  const quantityRefs = useRef<(HTMLInputElement | null)[]>([])

  const addItem = () => {
    setItems([...items, { materialId: '', quantity: 0, unitPrice: 0, subtotal: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index)
      setItems(newItems)
    }
  }

  const updateItem = (index: number, field: keyof TransactionItem, value: string | number) => {
    const newItems = [...items]
    const item = { ...newItems[index] }
    
    if (field === 'materialId') {
      item.materialId = String(value)
      // Auto-llenar precio unitario si se selecciona un material
      const material = materials.find(m => m.id === value)
      if (material) {
        item.unitPrice = material.price
      }
      
      // Mover cursor al campo de cantidad después de seleccionar material
      setTimeout(() => {
        quantityRefs.current[index]?.focus()
      }, 100)
    } else if (field === 'quantity' || field === 'unitPrice') {
      const numValue = parseFloat(String(value)) || 0
      item[field] = numValue
    }
    
    // Recalcular subtotal
    item.subtotal = item.quantity * item.unitPrice
    
    newItems[index] = item
    setItems(newItems)
  }

  const getTotal = () => {
    return items.reduce((sum, item) => sum + item.subtotal, 0)
  }

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
      setItems([{ materialId: '', quantity: 0, unitPrice: 0, subtotal: 0 }])
      
      // Obtener datos de la última transacción para generar PDF
      setTimeout(async () => {
        try {
          const response = await fetch('/api/transactions/latest', {
            signal: AbortSignal.timeout(5000) // Timeout de 5 segundos
          })
          const data = await response.json()
          
          if (data.id) {
            // Obtener detalles completos de la transacción con timeout
            const detailResponse = await fetch(`/api/transactions/${data.id}/details`, {
              signal: AbortSignal.timeout(5000) // Timeout de 5 segundos
            })
            const transactionData = await detailResponse.json()
            
            // Generar PDF en el cliente
            generateTransactionPDF(transactionData)
          }
        } catch (err) {
          console.error('Error generando PDF:', err)
          // No mostrar error al usuario, solo log
        }
      }, 300) // Reducir timeout a 300ms
      
      const now = new Date()
      const timeString = now.toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
      setSuccess(`Transacción creada exitosamente a las ${timeString}`)
      
      setTimeout(() => setSuccess(null), 5000)
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
          ? err
          : 'Error al crear transacción'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium">Cliente *</label>
        <select 
          name="clientId" 
          required
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Seleccionar cliente...</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
              {client.document && ` (${client.documentType}: ${client.document})`}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Materiales *</label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            Agregar material
          </Button>
        </div>
        
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1">
                <select
                  name={`items[${index}].materialId`}
                  value={item.materialId}
                  onChange={(e) => updateItem(index, 'materialId', e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Material...</option>
                  {materials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.code} - {material.name} (${material.price}/kg)
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="w-24">
                <Input
                  name={`items[${index}].quantity`}
                  ref={(el) => {
                    quantityRefs.current[index] = el
                  }}
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Cantidad"
                  value={item.quantity || ''}
                  onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                  required
                />
              </div>
              
              <div className="w-28">
                <Input
                  name={`items[${index}].unitPrice`}
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Precio/kg"
                  value={item.unitPrice || ''}
                  onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                  required
                />
              </div>
              
              <div className="w-28 text-sm font-medium">
                ${item.subtotal.toFixed(2)}
              </div>
              
              {items.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeItem(index)}
                >
                  ×
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Notas</label>
        <textarea
          name="notes"
          placeholder="Notas adicionales..."
          className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm"
          maxLength={500}
        />
        <span className="text-xs text-muted-foreground">Opcional - Máximo 500 caracteres</span>
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-medium">Total:</span>
          <span className="text-lg font-bold">${getTotal().toFixed(2)}</span>
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
        {loading ? 'Guardando...' : 'Crear transacción'}
      </Button>
    </form>
  )
}
