import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getMaterial(id: string) {
  return prisma.material.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      code: true,
      category: true,
      stock: true,
      price: true,
    }
  })
}

async function getInventoryMovements(materialId: string) {
  return prisma.inventoryMovement.findMany({
    where: { materialId },
    include: {
      material: {
        select: {
          name: true,
          code: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function MaterialMovementsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [material, movements] = await Promise.all([
    getMaterial(id),
    getInventoryMovements(id)
  ])
  
  if (!material) {
    return <div className="p-4">Material no encontrado</div>
  }

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
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/inventory">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Regresar a Inventario
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Historial de Movimientos</h1>
      </div>

      {/* Información del material */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Material</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Código</label>
              <p className="font-mono font-medium">{material.code}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nombre</label>
              <p className="font-medium">{material.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Categoría</label>
              <p>{material.category}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Stock Actual</label>
              <p className={`font-bold text-lg ${
                material.stock <= 0 
                  ? 'text-red-600'
                  : material.stock < 10
                  ? 'text-yellow-600'
                  : 'text-green-600'
              }`}>
                {material.stock.toFixed(2)} kg
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Movimientos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Movimientos de Inventario
          </CardTitle>
        </CardHeader>
        <CardContent>
          {movements.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="px-3 py-2">Fecha y Hora</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Cantidad</th>
                    <th className="px-3 py-2">Balance Después</th>
                    <th className="px-3 py-2">Referencia</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((movement, index) => (
                    <tr key={movement.id} className="border-b">
                      <td className="px-3 py-2">
                        {new Date(movement.createdAt).toLocaleString('es-MX', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {getMovementIcon(movement.type)}
                          <Badge className={getMovementColor(movement.type)}>
                            {getMovementText(movement.type)}
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
                      <td className="px-3 py-2">
                        {movement.reference || (
                          <span className="text-muted-foreground">Sin referencia</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay movimientos registrados para este material
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
