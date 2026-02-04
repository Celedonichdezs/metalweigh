import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, User, Weight, DollarSign, Download } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getTransaction(id: string) {
  return prisma.transaction.findUnique({
    where: { id },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          document: true,
          documentType: true,
          address: true,
          phone: true,
          email: true,
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
              category: true,
            }
          }
        }
      }
    }
  })
}

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const transaction = await getTransaction(id)
  
  if (!transaction) {
    return <div className="p-4">Transacción no encontrada</div>
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Completada'
      case 'PENDING':
        return 'Pendiente'
      case 'CANCELLED':
        return 'Cancelada'
      default:
        return status
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/transactions">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Regresar
          </Link>
        </Button>
        
        <Button asChild variant="default" size="sm">
          <a href={`/api/transactions/${transaction.id}/pdf`} download={`transaccion-${transaction.folio}.pdf`}>
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </a>
        </Button>
        
        <h1 className="text-2xl font-semibold">Detalle de Transacción</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Información principal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Información General
              <Badge className={getStatusColor(transaction.status)}>
                {getStatusText(transaction.status)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Folio</label>
              <p className="font-mono text-lg">{transaction.folio}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tipo</label>
              <p>{transaction.type === 'PURCHASE' ? 'Compra' : 'Venta'}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Fuente</label>
              <p>{transaction.source}</p>
            </div>
            
            {transaction.plates && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Placas</label>
                <p>{transaction.plates}</p>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <label className="text-sm font-medium text-muted-foreground">Fecha</label>
                <p>{new Date(transaction.createdAt).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {transaction.client ? (
              <>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                  <p className="font-medium">{transaction.client.name}</p>
                </div>
                
                {transaction.client.document && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Documento</label>
                    <p>
                      {transaction.client.documentType}: {transaction.client.document}
                    </p>
                  </div>
                )}
                
                {transaction.client.address && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Dirección</label>
                    <p>{transaction.client.address}</p>
                  </div>
                )}
                
                {transaction.client.phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                    <p>{transaction.client.phone}</p>
                  </div>
                )}
                
                {transaction.client.email && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p>{transaction.client.email}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">Sin cliente asignado</p>
            )}
          </CardContent>
        </Card>

        {/* Totales */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Weight className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground">Peso Total</label>
                <p className="text-lg font-medium">{transaction.totalWeight.toFixed(2)} kg</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground">Monto Total</label>
                <p className="text-lg font-bold text-green-600">
                  ${transaction.totalAmount.toFixed(2)}
                </p>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Usuario</label>
              <p>{transaction.user.name || transaction.user.email}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detalles de materiales */}
      <Card>
        <CardHeader>
          <CardTitle>Materiales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="px-3 py-2">Código</th>
                  <th className="px-3 py-2">Material</th>
                  <th className="px-3 py-2">Categoría</th>
                  <th className="px-3 py-2 text-right">Cantidad (kg)</th>
                  <th className="px-3 py-2 text-right">Precio/kg</th>
                  <th className="px-3 py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {transaction.details.map((detail, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-3 py-2 font-mono text-xs">
                      {detail.material.code}
                    </td>
                    <td className="px-3 py-2 font-medium">
                      {detail.material.name}
                    </td>
                    <td className="px-3 py-2">
                      {detail.material.category}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {detail.quantity.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      ${detail.unitPrice.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      ${detail.subtotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2">
                  <td colSpan={5} className="px-3 py-2 text-right font-medium">
                    Total:
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-lg">
                    ${transaction.totalAmount.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
