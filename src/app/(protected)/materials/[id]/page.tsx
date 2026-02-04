import { prisma } from '@/lib/prisma'
import { EditMaterialForm } from '../_components/edit-material-form'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getPrismaErrorMessage } from '@/lib/prisma-errors'

export const dynamic = 'force-dynamic'

async function getMaterial(id: string) {
  return prisma.material.findUnique({ where: { id } })
}

export async function updateMaterial(id: string, formData: FormData) {
  'use server'
  
  try {
    const code = String(formData.get('code') || '').trim()
    const name = String(formData.get('name') || '').trim()
    const category = String(formData.get('category') || '').trim()
    const description = String(formData.get('description') || '').trim() || undefined
    const price = Number(formData.get('price') || 0)
    const isActive = formData.get('isActive') === 'true'

    // Validaciones mejoradas
    if (!code) {
      throw new Error('El código es obligatorio')
    }
    if (code.length < 2 || code.length > 20) {
      throw new Error('El código debe tener entre 2 y 20 caracteres')
    }
    if (!/^[A-Z0-9\-_]+$/.test(code)) {
      throw new Error('El código solo puede contener letras mayúsculas, números, guiones y guiones bajos')
    }
    
    if (!name) {
      throw new Error('El nombre es obligatorio')
    }
    if (name.length < 2 || name.length > 100) {
      throw new Error('El nombre debe tener entre 2 y 100 caracteres')
    }
    
    if (!category) {
      throw new Error('La categoría es obligatoria')
    }
    if (category.length < 2 || category.length > 50) {
      throw new Error('La categoría debe tener entre 2 y 50 caracteres')
    }
    
    if (!price || Number.isNaN(price) || price < 0) {
      throw new Error('El precio debe ser un número mayor o igual a 0')
    }
    if (price > 999999.99) {
      throw new Error('El precio no puede ser mayor a $999,999.99')
    }

    await prisma.material.update({
      where: { id },
      data: { 
        code, 
        name, 
        category, 
        description: description?.trim() || undefined, 
        price, 
        isActive 
      },
    })
    
    revalidatePath('/materials')
    revalidatePath(`/materials/${id}`)
    redirect('/materials')
  } catch (error) {
    throw new Error(getPrismaErrorMessage(error))
  }
}

export default async function MaterialEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const material = await getMaterial(id)
  if (!material) {
    return <div className="p-4">Material no encontrado</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Editar material</h1>
      <EditMaterialForm material={material} updateAction={updateMaterial.bind(null, material.id)} />
    </div>
  )
}
