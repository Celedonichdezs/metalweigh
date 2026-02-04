import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Obtener la última transacción creada
    const transaction = await prisma.transaction.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            name: true,
            document: true,
            documentType: true,
          }
        }
      }
    })
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'No hay transacciones' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      id: transaction.id,
      folio: transaction.folio,
      createdAt: transaction.createdAt,
      client: transaction.client
    })
    
  } catch (error) {
    console.error('Error obteniendo última transacción:', error)
    return NextResponse.json(
      { error: 'Error obteniendo última transacción' },
      { status: 500 }
    )
  }
}
