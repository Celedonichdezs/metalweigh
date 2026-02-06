import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const prisma = new PrismaClient()
    
    // Run raw migrations by directly checking and creating tables if needed
    const tables = ['users', 'clients', 'materials', 'transactions', 'transaction_details', 'inventory_movements']
    
    // Instead of running migrations, just verify the tables exist by doing a simple query
    const tableChecks = await Promise.allSettled(
      tables.map(async (table) => {
        try {
          await prisma.$queryRawUnsafe(`SELECT 1 FROM "${table}" LIMIT 1`)
          return { table, exists: true }
        } catch (error) {
          return { table, exists: false, error: String(error) }
        }
      })
    )

    // Get migration status
    const migrations = await prisma.$queryRawUnsafe(
      'SELECT * FROM "_prisma_migrations" ORDER BY "executedAt" DESC LIMIT 10'
    ).catch(() => null)

    return NextResponse.json({
      success: true,
      message: 'Database check completed',
      tables: tableChecks
        .filter(r => r.status === 'fulfilled')
        .map((r) => r.value),
      migrations: migrations ? 'Migrations exist' : 'No migrations found yet',
      status: migrations ? 'Database initialized' : 'Database needs initialization'
    })
  } catch (error) {
    console.error('Error checking database:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check database', 
        details: String(error),
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    // Don't disconnect, Vercel will handle that
  }
}
