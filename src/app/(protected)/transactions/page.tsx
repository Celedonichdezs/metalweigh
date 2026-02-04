import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NewTransactionForm } from './_components/new-transaction-form'
import { getPrismaErrorMessage } from '@/lib/prisma-errors'
import { generateTransactionPDF } from '@/lib/pdf-generator'

export const dynamic = 'force-dynamic'

async function getTransactions(search?: string) {
  try {
    const where = search ? {
      OR: [
        { folio: { contains: search, mode: 'insensitive' as const } },
        { client: { name: { contains: search, mode: 'insensitive' as const } } },
        { client: { document: { contains: search, mode: 'insensitive' as const } } },
      ]
    } : {}

    return await prisma.transaction.findMany({
      where,
      select: {
        id: true,
        folio: true,
        type: true,
        status: true,
        totalWeight: true,
        totalAmount: true,
        createdAt: true,
        client: {
          select: {
            id: true,
            name: true,
            document: true,
            documentType: true,
          }
        },
        user: {
          select: {
            id: true,
            email: true,
          }
        },
        // Eliminar details para reducir carga - se pueden obtener bajo demanda
      },
      orderBy: { createdAt: 'desc' }, // Las más recientes primero
      take: 15, // Reducir drasticamente a 15 transacciones
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return [] // Retornar array vacío para evitar que la página falle
  }
}

async function getClients() {
  try {
    return await prisma.client.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        document: true,
        documentType: true,
      },
      orderBy: { name: 'asc' },
      take: 20, // Limitar a 20 clientes
    })
  } catch (error) {
    console.error('Error fetching clients:', error)
    return []
  }
}

async function getMaterials() {
  try {
    return await prisma.material.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        price: true,
      },
      orderBy: { name: 'asc' },
      take: 15, // Limitar a 15 materiales para el formulario
    })
  } catch (error) {
    console.error('Error fetching materials:', error)
    return []
  }
}

async function generateFolio(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `F-${year}-`
  
  try {
    const lastTransaction = await prisma.transaction.findFirst({
      where: {
        folio: { startsWith: prefix }
      },
      select: { folio: true },
      orderBy: { folio: 'desc' }
    })
    
    let sequence = 1
    if (lastTransaction) {
      const lastSequence = parseInt(lastTransaction.folio.split('-')[2] || '0')
      sequence = lastSequence + 1
    }
    
    return `${prefix}${sequence.toString().padStart(6, '0')}`
  } catch (error) {
    console.error('Error generating folio:', error)
    // En caso de error, generar un folio con timestamp
    const timestamp = Date.now().toString().slice(-6)
    return `${prefix}${timestamp}`
  }
}

export async function createTransaction(formData: FormData) {
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
    
    const clientId = String(formData.get('clientId') || '').trim()
    const notes = String(formData.get('notes') || '').trim() || undefined
    
    // Obtener items del formulario
    const items: Array<{
      materialId: string
      quantity: number
      unitPrice: number
      subtotal: number
    }> = []
    
    let index = 0
    while (true) {
      const materialId = formData.get(`items[${index}].materialId`)
      const quantity = formData.get(`items[${index}].quantity`)
      const unitPrice = formData.get(`items[${index}].unitPrice`)
      
      if (!materialId) break
      
      items.push({
        materialId: String(materialId),
        quantity: parseFloat(String(quantity)),
        unitPrice: parseFloat(String(unitPrice)),
        subtotal: parseFloat(String(quantity)) * parseFloat(String(unitPrice))
      })
      
      index++
    }
    
    // Validaciones
    if (!clientId) {
      throw new Error('Debe seleccionar un cliente')
    }
    
    if (items.length === 0) {
      throw new Error('Debe agregar al menos un material')
    }
    
    for (const item of items) {
      if (item.quantity <= 0) {
        throw new Error('La cantidad debe ser mayor a 0')
      }
      if (item.unitPrice <= 0) {
        throw new Error('El precio unitario debe ser mayor a 0')
      }
    }
    
    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0)
    const totalWeight = items.reduce((sum, item) => sum + item.quantity, 0)
    const folio = await generateFolio()
    
    // Crear transacción con detalles
    const transaction = await prisma.transaction.create({
      data: {
        folio,
        type: 'PURCHASE', // Por defecto compra, se puede hacer dinámico
        source: 'KEYBOARD',
        clientId,
        totalWeight,
        totalAmount,
        status: 'COMPLETED',
        userId: dbUser.id, // Usar el ID del usuario de la base de datos
        details: {
          create: items
        }
      },
      include: {
        details: {
          include: {
            material: true
          }
        },
        client: true
      }
    })
    
    // Actualizar inventario
    for (const item of items) {
      await prisma.material.update({
        where: { id: item.materialId },
        data: {
          stock: {
            increment: item.quantity
          }
        }
      })
      
      // Registrar movimiento de inventario
      await prisma.inventoryMovement.create({
        data: {
          type: 'IN',
          quantity: item.quantity,
          balance: 0, // Se calculará después
          reference: folio,
          materialId: item.materialId
        }
      })
    }
    
    revalidatePath('/transactions')
  } catch (error) {
    throw new Error(getPrismaErrorMessage(error))
  }
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search } = await searchParams
  const [transactions, clients, materials] = await Promise.all([
    getTransactions(search),
    getClients(),
    getMaterials()
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transacciones</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border bg-white p-4 shadow-sm dark:bg-zinc-900">
          <h2 className="mb-3 text-lg font-medium">Nueva transacción</h2>
          <NewTransactionForm 
            createAction={createTransaction} 
            clients={clients}
            materials={materials}
          />
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-zinc-900 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">Historial</h2>
            <form className="flex gap-2">
              <Input
                name="search"
                placeholder="Buscar por folio, cliente..."
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
                  <th className="px-3 py-2">Folio</th>
                  <th className="px-3 py-2">Cliente</th>
                  <th className="px-3 py-2">Items</th>
                  <th className="px-3 py-2">Total</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b">
                    <td className="px-3 py-2 font-medium">{transaction.folio}</td>
                    <td className="px-3 py-2">
                      <div>
                        <div className="font-medium">{transaction.client.name}</div>
                        {transaction.client.document && (
                          <div className="text-xs text-muted-foreground">
                            {transaction.client.documentType}: {transaction.client.document}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-xs">
                        {transaction.totalWeight.toFixed(2)} kg
                      </div>
                    </td>
                    <td className="px-3 py-2 font-medium">
                      ${transaction.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        transaction.status === 'COMPLETED' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}>
                        {transaction.status === 'COMPLETED' ? 'Completada' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {new Date(transaction.createdAt).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-3 py-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/transactions/${transaction.id}`}>Ver</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {transactions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {search ? 'No se encontraron transacciones con esos criterios' : 'No hay transacciones registradas'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
