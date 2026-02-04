import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Obtener transacción completa con detalles
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        details: {
          include: {
            material: true
          }
        },
        client: true
      }
    })
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transacción no encontrada' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(transaction)
    
  } catch (error) {
    console.error('Error obteniendo detalles de transacción:', error)
    return NextResponse.json(
      { error: 'Error obteniendo detalles de transacción' },
      { status: 500 }
    )
  }
}
