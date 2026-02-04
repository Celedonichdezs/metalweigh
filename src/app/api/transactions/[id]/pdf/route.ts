import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateTransactionPDF } from '@/lib/pdf-generator'

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
    
    // Generar PDF
    const pdfBlob = generateTransactionPDF(transaction)
    
    // Convertir blob a buffer
    const arrayBuffer = await pdfBlob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Devolver PDF como respuesta
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="transaccion-${transaction.folio}.pdf"`,
        'Content-Length': buffer.length.toString()
      }
    })
    
  } catch (error) {
    console.error('Error generando PDF:', error)
    return NextResponse.json(
      { error: 'Error generando PDF' },
      { status: 500 }
    )
  }
}
