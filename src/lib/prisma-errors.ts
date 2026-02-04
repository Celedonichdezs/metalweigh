import { Prisma } from '@prisma/client'

export function getPrismaErrorMessage(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        const target = error.meta?.target as string[] | undefined
        if (target?.includes('code')) {
          return 'El código del material ya existe. Usa otro código.'
        }
        if (target?.includes('email')) {
          return 'El correo electrónico ya está registrado.'
        }
        if (target?.includes('document')) {
          return 'El documento del cliente ya está registrado.'
        }
        return 'Ya existe un registro con estos datos únicos.'
      
      case 'P2025':
        return 'Registro no encontrado.'
      
      case 'P2003':
        return 'Error de relación: el registro referenciado no existe.'
      
      case 'P2014':
        return 'No se puede eliminar el registro porque tiene datos relacionados.'
      
      case 'P2021':
        return 'La tabla no existe en la base de datos.'
      
      case 'P2022':
        return 'La columna no existe en la tabla.'
      
      default:
        return `Error de base de datos (${error.code}): ${error.message}`
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return 'Error de validación en los datos enviados.'
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return 'Error desconocido en la base de datos.'
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return 'Error crítico en la conexión a la base de datos.'
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return 'Error al inicializar la conexión a la base de datos.'
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'Error desconocido. Por favor, intenta de nuevo.'
}

export function isPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError
}
