import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET(request: NextRequest) {
  try {
    // Run Prisma migrate deploy
    const { stdout, stderr } = await execAsync('npx prisma migrate deploy', {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL,
        DIRECT_URL: process.env.DIRECT_URL,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Migrations deployed successfully',
      output: stdout,
      errors: stderr || undefined
    })
  } catch (error) {
    console.error('Error running migrations:', error)
    return NextResponse.json(
      { 
        error: 'Failed to deploy migrations', 
        details: String(error),
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
