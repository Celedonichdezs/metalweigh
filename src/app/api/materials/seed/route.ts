import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Materiales usados en MetalWeigh
const materials = [
  { code: 'ANT', name: 'Antimonio', category: 'Metal', price: 15 },
  { code: 'BAT', name: 'Batería', category: 'Electrónico', price: 12 },
  { code: 'BLD', name: 'Blando', category: 'Metal', price: 24 },
  { code: 'BOT', name: 'Bote', category: 'Contenedor', price: 29 },
  { code: 'BRO', name: 'Bronce', category: 'Metal', price: 116 },
  { code: 'CUP1', name: 'Cobre 1a', category: 'Metal', price: 176 },
  { code: 'CUP2', name: 'Cobre 2a', category: 'Metal', price: 163 },
  { code: 'MAC', name: 'Macizo', category: 'Metal', price: 28 },
  { code: 'OTR', name: 'Otros', category: 'Varios', price: 10 },
  { code: 'PRF', name: 'Perfil', category: 'Metal', price: 38 },
  { code: 'RAD-ALC', name: 'Radiador Alco', category: 'Radiador', price: 78 },
  { code: 'RAD-ALU', name: 'Radiador Aluminio', category: 'Radiador', price: 22 },
  { code: 'RAD-BRO', name: 'Radiador Bronce', category: 'Radiador', price: 98 },
  { code: 'RIN', name: 'Rin', category: 'Automotriz', price: 42 },
  { code: 'SPR', name: 'Spray', category: 'Químico', price: 15 },
  { code: 'TRS', name: 'Traste', category: 'Contenedor', price: 33 },
]

export async function GET(request: NextRequest) {
  try {
    // Crear materiales si no existen
    const results = []
    
    for (const material of materials) {
      // Verificar si el material ya existe por código
      const existingMaterial = await prisma.material.findUnique({
        where: { code: material.code }
      })
      
      if (!existingMaterial) {
        const created = await prisma.material.create({
          data: {
            code: material.code,
            name: material.name,
            category: material.category,
            price: material.price,
            stock: 0,
            isActive: true,
            description: `${material.name} - Precio unitario: ${material.price}`
          }
        })
        results.push({ action: 'created', name: created.name, price: created.price })
      } else {
        results.push({ action: 'exists', name: existingMaterial.name })
      }
    }

    const createdCount = results.filter(r => r.action === 'created').length
    return NextResponse.json({
      success: true,
      message: `Materiales procesados: ${createdCount} nuevos, ${results.filter(r => r.action === 'exists').length} existentes`,
      results,
      total: results.length
    })
  } catch (error) {
    console.error('Error seeding materials:', error)
    return NextResponse.json(
      { error: 'Error creating materials', details: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
