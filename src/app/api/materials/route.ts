import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const materials = await prisma.material.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        stock: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(materials)
  } catch (error) {
    console.error('Error fetching materials:', error)
    return NextResponse.json(
      { error: 'Error fetching materials' },
      { status: 500 }
    )
  }
}
