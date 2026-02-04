import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Materiales comunes de reciclaje ordenados alfabéticamente
const materials = [
  { code: 'ALUM-001', name: 'Aluminio', category: 'Metales', price: 20.50 },
  { code: 'BRCE-001', name: 'Bronce', category: 'Metales', price: 45.00 },
  { code: 'CBL-001', name: 'Cable de Cobre', category: 'Metales', price: 120.00 },
  { code: 'CART-001', name: 'Cartón', category: 'Papel', price: 1.50 },
  { code: 'COPR-001', name: 'Cobre', category: 'Metales', price: 125.00 },
  { code: 'HIER-001', name: 'Hierro', category: 'Metales', price: 3.50 },
  { code: 'LAT-001', name: 'Lata', category: 'Metales', price: 2.00 },
  { code: 'LAT-002', name: 'Lata de Aluminio', category: 'Metales', price: 15.00 },
  { code: 'PLAS-001', name: 'Plástico PET', category: 'Plásticos', price: 2.50 },
  { code: 'VIDR-001', name: 'Vidrio', category: 'Vidrio', price: 0.80 },
  { code: 'ZINC-001', name: 'Zinc', category: 'Metales', price: 8.00 }
]

export async function POST(request: NextRequest) {
  try {
    // Crear materiales si no existen
    const results = []
    
    for (const material of materials) {
      // Verificar si el material ya existe por código o nombre
      const existingMaterial = await prisma.material.findFirst({
        where: {
          OR: [
            { code: material.code },
            { name: material.name }
          ]
        }
      })
      
      if (!existingMaterial) {
        const created = await prisma.material.create({
          data: {
            code: material.code,
            name: material.name,
            category: material.category,
            price: material.price,
            stock: 0,
            isActive: true
          }
        })
        results.push({ action: 'created', material: created })
      } else {
        results.push({ action: 'exists', material: existingMaterial })
      }
    }

    return NextResponse.json({
      message: 'Materiales procesados exitosamente',
      results
    })
  } catch (error) {
    console.error('Error creating materials:', error)
    return NextResponse.json(
      { error: 'Error creating materials' },
      { status: 500 }
    )
  }
}
