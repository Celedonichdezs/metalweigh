'use client'

import React, { useState, FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Material = {
  id: string
  name: string
  code: string
  stock: number
}

export function NewInventoryAdjustmentForm({
  createAction,
}: {
  createAction: (formData: FormData) => Promise<void>
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [selectedMaterial, setSelectedMaterial] = useState<string>('')
  const [materialStock, setMaterialStock] = useState<number>(0)

  // Cargar materiales cuando el componente se monta
  React.useEffect(() => {
    fetch('/api/materials')
      .then(res => res.json())
      .then(data => setMaterials(data))
      .catch(err => console.error('Error loading materials:', err))
  }, [])

  const handleMaterialChange = (materialId: string) => {
    setSelectedMaterial(materialId)
    const material = materials.find(m => m.id === materialId)
    setMaterialStock(material?.stock || 0)
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
      setSelectedMaterial('')
      setMaterialStock(0)
      setSuccess('Ajuste de inventario realizado exitosamente')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
          ? err
          : 'Error al realizar ajuste'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium">Material *</label>
        <select 
          name="materialId" 
          value={selectedMaterial}
          onChange={(e) => handleMaterialChange(e.target.value)}
          required
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Seleccionar material...</option>
          {materials.map((material) => (
            <option key={material.id} value={material.id}>
              {material.code} - {material.name} ({material.stock.toFixed(2)} kg)
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">Tipo de Movimiento *</label>
        <select 
          name="type" 
          required
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Seleccionar tipo...</option>
          <option value="IN">Entrada</option>
          <option value="OUT">Salida</option>
          <option value="ADJUST">Ajuste (nuevo balance)</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">
          Cantidad {selectedMaterial && `(Actual: ${materialStock.toFixed(2)} kg)`}
        </label>
        <Input
          name="quantity"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          required
        />
        <span className="text-xs text-muted-foreground">
          Para Entrada/Salida: cantidad a mover. Para Ajuste: nuevo balance total
        </span>
      </div>

      <div>
        <label className="text-sm font-medium">Referencia</label>
        <Input
          name="reference"
          placeholder="Folio, motivo, etc..."
          maxLength={100}
        />
        <span className="text-xs text-muted-foreground">Opcional - Máximo 100 caracteres</span>
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
        {loading ? 'Procesando...' : 'Realizar Ajuste'}
      </Button>
    </form>
  )
}
