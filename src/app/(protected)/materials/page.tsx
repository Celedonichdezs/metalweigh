 import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { NewMaterialForm } from './_components/new-material-form'
import { getPrismaErrorMessage } from '@/lib/prisma-errors'

export const dynamic = 'force-dynamic'

async function getMaterials() {
  try {
    return await prisma.material.findMany({
      where: { isActive: true },
      select: { // Solo seleccionar campos necesarios para reducir carga
        id: true,
        code: true,
        name: true,
        category: true,
        price: true,
        stock: true,
      },
      orderBy: { name: 'asc' },
      take: 20, // Reducir a 20 materiales para evitar timeouts
    })
  } catch (error) {
    console.error('Error fetching materials:', error)
    // Retornar array vacío en caso de error para evitar que la página falle
    return []
  }
}

export async function createMaterial(formData: FormData) {
  'use server'
  
  try {
    const code = String(formData.get('code') || '').trim()
    const name = String(formData.get('name') || '').trim()
    const category = String(formData.get('category') || '').trim()
    const description = String(formData.get('description') || '').trim() || undefined
    const price = Number(formData.get('price') || 0)

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

    await prisma.material.create({
      data: {
        code,
        name,
        category,
        description: description?.trim() || undefined,
        price,
      },
    })
    
    revalidatePath('/materials')
  } catch (error) {
    throw new Error(getPrismaErrorMessage(error))
  }
}

export default async function MaterialsPage() {
   const materials = await getMaterials()
 
   return (
     <div className="space-y-6">
       <div className="flex items-center justify-between">
         <h1 className="text-2xl font-semibold">Materiales</h1>
       </div>
 
       <div className="grid gap-6 md:grid-cols-2">
         <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-zinc-900">
           <h2 className="mb-3 text-lg font-medium">Nuevo material</h2>
           <NewMaterialForm createAction={createMaterial} />
         </div>
 
         <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-zinc-900 md:col-span-2">
           <h2 className="mb-3 text-lg font-medium">Listado</h2>
           <div className="overflow-x-auto">
             <table className="min-w-full text-sm">
               <thead>
                 <tr className="text-left border-b">
                   <th className="px-3 py-2">Código</th>
                   <th className="px-3 py-2">Nombre</th>
                   <th className="px-3 py-2">Categoría</th>
                   <th className="px-3 py-2">Precio</th>
                   <th className="px-3 py-2">Stock</th>
                   <th className="px-3 py-2">Estado</th>
                   <th className="px-3 py-2">Acciones</th>
                 </tr>
               </thead>
               <tbody>
                 {materials.map((m) => (
                   <tr key={m.id} className="border-b">
                     <td className="px-3 py-2">{m.code}</td>
                     <td className="px-3 py-2">{m.name}</td>
                     <td className="px-3 py-2">{m.category}</td>
                     <td className="px-3 py-2">${m.price.toFixed(2)}</td>
                     <td className="px-3 py-2">{m.stock.toFixed(2)} kg</td>
                     <td className="px-3 py-2">{m.isActive ? 'Activo' : 'Inactivo'}</td>
                     <td className="px-3 py-2">
                       <Button asChild variant="outline" size="sm">
                         <Link href={`/materials/${m.id}`}>Editar</Link>
                       </Button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </div>
       </div>
     </div>
   )
 }
