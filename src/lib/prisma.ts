import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createDatabasePool() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required')
  }

  // Para runtime usamos DATABASE_URL (pgBouncer en puerto 6543)
  // Para migraciones se usaría DIRECT_URL (puerto 5432 directo)
  const connectionString = databaseUrl.startsWith('postgresql://')
    ? databaseUrl.replace('postgresql://', 'postgres://')
    : databaseUrl

  const parsed = (() => {
    try {
      const u = new URL(connectionString)
      // Limpiar parámetros de query que puedan interferir
      u.search = ''
      return u.toString()
    } catch {
      return connectionString
    }
  })()

  // Configuración SSL para producción
  const sslConfig = process.env.NODE_ENV === 'production' 
    ? {
        rejectUnauthorized: true, // En producción exigimos certificado válido
        // Para Supabase, el certificado CA generalmente no se necesita explícitamente
        // ya que usan certificados válidos de autoridades confiables
      }
    : {
        rejectUnauthorized: false, // En desarrollo permitimos certificados auto-firmados
      }

  return new Pool({
    connectionString: parsed,
    ssl: sslConfig,
    // Configuración ultra-optimizada para evitar timeouts
    max: 5, // Reducir a 5 conexiones máximas
    min: 1,  // Mínimo 1 conexión mantenida
    idleTimeoutMillis: 20000, // 20 segundos para conexiones inactivas
    connectionTimeoutMillis: 5000, // Reducir a 5 segundos para conectar
    statement_timeout: 8000, // 8 segundos máximo por query
    query_timeout: 8000, // 8 segundos máximo por query
  })
}

const pool = createDatabasePool()
const adapter = new PrismaPg(pool)

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ 
    adapter,
    // Configuración adicional para producción
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Función para cerrar conexiones (útil para testing o shutdown)
export async function disconnectPrisma() {
  await prisma.$disconnect()
  await pool.end()
}
