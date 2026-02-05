import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Calendar, 
  DollarSign, 
  Weight,
  Package,
  Users
} from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getHistory(search?: string, type?: string, dateFrom?: string, dateTo?: string) {
  // Construir filtros
  const where: any = {}
  
  if (search) {
    where.OR = [
      { folio: { contains: search, mode: 'insensitive' as const } },
      { client: { name: { contains: search, mode: 'insensitive' as const } } },
      { reference: { contains: search, mode: 'insensitive' as const } },
    ]
  }

  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) where.createdAt.gte = new Date(dateFrom)
    if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z')
  }

  // Obtener transacciones
  const transactions = await prisma.transaction.findMany({
    where: type === 'transactions' || !type ? where : {},
    include: {
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
          name: true,
        }
      },
      details: {
        include: {
          material: {
            select: {
              id: true,
              name: true,
              code: true,
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 30, // Limitar a 30 transacciones para evitar timeouts
  })

  // Obtener movimientos de inventario
  const inventoryMovements = await prisma.inventoryMovement.findMany({
    where: type === 'inventory' || !type ? where : {},
    include: {
      material: {
        select: {
          id: true,
          name: true,
          code: true,
          category: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 30, // Limitar a 30 movimientos para evitar timeouts
  })

  return { transactions, inventoryMovements }
}

async function getStats() {
  const [
    totalTransactions,
    totalAmount,
    totalWeight,
    totalMaterials,
    totalClients,
    recentMovements
  ] = await Promise.all([
    prisma.transaction.count(),
    prisma.transaction.aggregate({ _sum: { totalAmount: true } }),
    prisma.transaction.aggregate({ _sum: { totalWeight: true } }),
    prisma.material.count({ where: { isActive: true } }),
    prisma.client.count({ where: { isActive: true } }),
    prisma.inventoryMovement.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
        }
      }
    })
  ])

  return {
    totalTransactions,
    totalAmount: totalAmount._sum.totalAmount || 0,
    totalWeight: totalWeight._sum.totalWeight || 0,
    totalMaterials,
    totalClients,
    recentMovements
  }
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    search?: string
    type?: string
    dateFrom?: string
    dateTo?: string
  }>
}) {
  const { search, type, dateFrom, dateTo } = await searchParams
  const { transactions, inventoryMovements } = await getHistory(search, type, dateFrom, dateTo)
  const stats = await getStats()

  const getTransactionStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getMovementIcon = (movementType: string) => {
    switch (movementType) {
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

  const getMovementColor = (movementType: string) => {
    switch (movementType) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Historial del Sistema</h1>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Transacciones</p>
                <p className="text-lg font-bold">{stats.totalTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Monto Total</p>
                <p className="text-lg font-bold">${stats.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Weight className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Peso Total</p>
                <p className="text-lg font-bold">{stats.totalWeight.toFixed(2)} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Materiales</p>
                <p className="text-lg font-bold">{stats.totalMaterials}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Clientes</p>
                <p className="text-lg font-bold">{stats.totalClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Mov. 24h</p>
                <p className="text-lg font-bold">{stats.recentMovements}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-5">
            <Input
              name="search"
              placeholder="Buscar por folio, cliente, referencia..."
              defaultValue={search}
            />
            
            <select 
              name="type" 
              defaultValue={type || ''}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Todos los tipos</option>
              <option value="transactions">Solo transacciones</option>
              <option value="inventory">Solo inventario</option>
            </select>
            
            <Input
              name="dateFrom"
              type="date"
              placeholder="Fecha desde"
              defaultValue={dateFrom}
            />
            
            <Input
              name="dateTo"
              type="date"
              placeholder="Fecha hasta"
              defaultValue={dateTo}
            />
            
            <Button type="submit">Filtrar</Button>
          </form>
        </CardContent>
      </Card>

      {/* Transacciones */}
      {(type === 'transactions' || !type) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Transacciones Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="px-3 py-2">Folio</th>
                      <th className="px-3 py-2">Cliente</th>
                      <th className="px-3 py-2">Tipo</th>
                      <th className="px-3 py-2">Peso</th>
                      <th className="px-3 py-2">Monto</th>
                      <th className="px-3 py-2">Estado</th>
                      <th className="px-3 py-2">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction: any) => (
                      <tr key={transaction.id} className="border-b">
                        <td className="px-3 py-2 font-mono font-medium">
                          {transaction.folio}
                        </td>
                        <td className="px-3 py-2">
                          {transaction.client?.name || 'Sin cliente'}
                        </td>
                        <td className="px-3 py-2">
                          {transaction.type === 'PURCHASE' ? 'Compra' : 'Venta'}
                        </td>
                        <td className="px-3 py-2">
                          {transaction.totalWeight.toFixed(2)} kg
                        </td>
                        <td className="px-3 py-2 font-medium">
                          ${transaction.totalAmount.toFixed(2)}
                        </td>
                        <td className="px-3 py-2">
                          <Badge className={getTransactionStatusColor(transaction.status)}>
                            {transaction.status === 'COMPLETED' ? 'Completada' : 
                             transaction.status === 'PENDING' ? 'Pendiente' : 'Cancelada'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {new Date(transaction.createdAt).toLocaleDateString('es-MX')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hay transacciones que coincidan con los filtros
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Movimientos de Inventario */}
      {(type === 'inventory' || !type) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Movimientos de Inventario Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {inventoryMovements.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="px-3 py-2">Fecha</th>
                      <th className="px-3 py-2">Material</th>
                      <th className="px-3 py-2">Tipo</th>
                      <th className="px-3 py-2">Cantidad</th>
                      <th className="px-3 py-2">Balance</th>
                      <th className="px-3 py-2">Referencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryMovements.map((movement) => (
                      <tr key={movement.id} className="border-b">
                        <td className="px-3 py-2 text-xs">
                          {new Date(movement.createdAt).toLocaleString('es-MX')}
                        </td>
                        <td className="px-3 py-2">
                          <div>
                            <div className="font-medium">{movement.material.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {movement.material.code}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            {getMovementIcon(movement.type)}
                            <Badge className={getMovementColor(movement.type)}>
                              {movement.type === 'IN' ? 'Entrada' : 
                               movement.type === 'OUT' ? 'Salida' : 'Ajuste'}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`font-medium ${
                            movement.quantity > 0 ? 'text-green-600' : 
                            movement.quantity < 0 ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                            {movement.quantity > 0 ? '+' : ''}{movement.quantity.toFixed(2)} kg
                          </span>
                        </td>
                        <td className="px-3 py-2 font-medium">
                          {movement.balance.toFixed(2)} kg
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {movement.reference || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hay movimientos de inventario que coincidan con los filtros
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
