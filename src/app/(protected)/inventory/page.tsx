import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { NewInventoryAdjustmentForm } from './_components/new-inventory-adjustment-form'
import { getPrismaErrorMessage } from '@/lib/prisma-errors'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getInventory(search?: string) {
  const where = search ? {
    AND: [
      { isActive: true },
      {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { code: { contains: search, mode: 'insensitive' as const } },
          { category: { contains: search, mode: 'insensitive' as const } },
        ]
      }
    ]
  } : { isActive: true }

  return prisma.material.findMany({
    where,
    include: {
      inventoryMovements: {
        orderBy: { createdAt: 'desc' },
        take: 3, // Reducir a 3 movimientos para mejorar rendimiento
        include: {
          material: {
            select: {
              name: true,
              code: true,
            }
          }
        }
      }
    },
    orderBy: { name: 'asc' },
    take: 50, // Limitar a 50 materiales para evitar timeouts
  })
}

export async function createInventoryAdjustment(formData: FormData) {
  'use server'
  
  try {
    // Obtener usuario autenticado
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Usuario no autenticado')
    }
    
    // Buscar o crear usuario en la base de datos
    let dbUser = await prisma.user.findUnique({
      where: { email: user.email! }
    })
    
    if (!dbUser) {
      // Crear usuario si no existe
      dbUser = await prisma.user.create({
        data: {
          email: user.email!,
          name: user.user_metadata?.name || user.email!.split('@')[0],
          role: 'OPERATOR' // Rol por defecto
        }
      })
    }
    
    const materialId = String(formData.get('materialId') || '').trim()
    const type = String(formData.get('type') || '').trim() as 'IN' | 'OUT' | 'ADJUST'
    const quantity = parseFloat(String(formData.get('quantity') || '0'))
    const reference = String(formData.get('reference') || '').trim() || undefined
    
    // Validaciones
    if (!materialId) {
      throw new Error('Debe seleccionar un material')
    }
    
    if (!['IN', 'OUT', 'ADJUST'].includes(type)) {
      throw new Error('Tipo de movimiento inválido')
    }
    
    if (quantity <= 0) {
      throw new Error('La cantidad debe ser mayor a 0')
    }
    
    // Obtener material actual
    const material = await prisma.material.findUnique({
      where: { id: materialId }
    })
    
    if (!material) {
      throw new Error('Material no encontrado')
    }
    
    // Calcular nuevo balance
    let newBalance = material.stock
    if (type === 'IN') {
      newBalance += quantity
    } else if (type === 'OUT') {
      if (newBalance < quantity) {
        throw new Error('No hay suficiente inventario para esta salida')
      }
      newBalance -= quantity
    } else if (type === 'ADJUST') {
      // Para ajustes, quantity es el nuevo balance
      newBalance = quantity
    }
    
    // Actualizar inventario
    await prisma.material.update({
      where: { id: materialId },
      data: {
        stock: newBalance
      }
    })
    
    // Registrar movimiento
    await prisma.inventoryMovement.create({
      data: {
        type,
        quantity: type === 'ADJUST' ? newBalance - material.stock : quantity,
        balance: newBalance,
        reference: reference || `Ajuste por ${dbUser.name || dbUser.email}`,
        materialId
      }
    })
    
    revalidatePath('/inventory')
  } catch (error) {
    throw new Error(getPrismaErrorMessage(error))
  }
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search } = await searchParams
  const inventory = await getInventory(search)

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'IN':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'OUT':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'ADJUST':
        return <Minus className="h-4 w-4 text-yellow-600" />
      default:
        return null
    }
  }

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'IN':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'OUT':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'ADJUST':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getMovementText = (type: string) => {
    switch (type) {
      case 'IN':
        return 'Entrada'
      case 'OUT':
        return 'Salida'
      case 'ADJUST':
        return 'Ajuste'
      default:
        return type
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Inventario</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1 rounded-lg border bg-white p-4 shadow-sm dark:bg-zinc-900">
          <h2 className="mb-3 text-lg font-medium">Ajuste de Inventario</h2>
          <NewInventoryAdjustmentForm createAction={createInventoryAdjustment} />
        </div>

        <div className="lg:col-span-3 rounded-lg border bg-white p-4 shadow-sm dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">Materiales en Inventario</h2>
            <form className="flex gap-2">
              <Input
                name="search"
                placeholder="Buscar por código, nombre..."
                defaultValue={search}
                className="w-64"
              />
              <Button type="submit">Buscar</Button>
            </form>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="px-3 py-2">Código</th>
                  <th className="px-3 py-2">Material</th>
                  <th className="px-3 py-2">Categoría</th>
                  <th className="px-3 py-2">Stock (kg)</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Movimientos Recientes</th>
                  <th className="px-3 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((material) => (
                  <tr key={material.id} className="border-b">
                    <td className="px-3 py-2 font-mono text-xs">
                      {material.code}
                    </td>
                    <td className="px-3 py-2 font-medium">
                      {material.name}
                    </td>
                    <td className="px-3 py-2">
                      {material.category}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`font-medium ${
                        material.stock <= 0 
                          ? 'text-red-600'
                          : material.stock < 10
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`}>
                        {material.stock.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <Badge className={
                        material.stock <= 0 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          : material.stock < 10
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      }>
                        {material.stock <= 0 ? 'Sin stock' : material.stock < 10 ? 'Bajo' : 'OK'}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <div className="space-y-1">
                        {material.inventoryMovements.length > 0 ? (
                          material.inventoryMovements.map((movement, index) => (
                            <div key={movement.id} className="flex items-center gap-2 text-xs">
                              {getMovementIcon(movement.type)}
                              <span className={getMovementColor(movement.type)}>
                                {getMovementText(movement.type)}
                              </span>
                              <span>
                                {Math.abs(movement.quantity).toFixed(2)}kg
                              </span>
                              <span className="text-muted-foreground">
                                {new Date(movement.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin movimientos</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/materials/${material.id}`}>Editar</Link>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/inventory/${material.id}/movements`}>Historial</Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {inventory.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {search ? 'No se encontraron materiales con esos criterios' : 'No hay materiales registrados'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
