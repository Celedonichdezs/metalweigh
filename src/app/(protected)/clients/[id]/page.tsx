import { prisma } from '@/lib/prisma'
import { EditClientForm } from '../_components/edit-client-form'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getPrismaErrorMessage } from '@/lib/prisma-errors'

export const dynamic = 'force-dynamic'

async function getClient(id: string) {
  return prisma.client.findUnique({ where: { id } })
}

export async function updateClient(id: string, formData: FormData) {
  'use server'
  
  try {
    const name = String(formData.get('name') || '').trim()
    const documentType = String(formData.get('documentType') || '').trim() || undefined
    const document = String(formData.get('document') || '').trim() || undefined
    const address = String(formData.get('address') || '').trim() || undefined
    const phone = String(formData.get('phone') || '').trim() || undefined
    const email = String(formData.get('email') || '').trim() || undefined
    const isActive = formData.get('isActive') === 'true'

    // Validaciones
    if (!name) {
      throw new Error('El nombre es obligatorio')
    }
    if (name.length < 2 || name.length > 100) {
      throw new Error('El nombre debe tener entre 2 y 100 caracteres')
    }
    
    if (document && document.length < 5) {
      throw new Error('El documento debe tener al menos 5 caracteres')
    }
    
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('El correo electrónico no es válido')
    }
    
    if (phone && !/^[+]?[\d\s\-\(\)]{10,}$/.test(phone)) {
      throw new Error('El teléfono no es válido')
    }

    await prisma.client.update({
      where: { id },
      data: {
        name,
        documentType,
        document: document || undefined,
        address: address || undefined,
        phone: phone || undefined,
        email: email || undefined,
        isActive,
      },
    })
    
    revalidatePath('/clients')
    revalidatePath(`/clients/${id}`)
    redirect('/clients')
  } catch (error) {
    throw new Error(getPrismaErrorMessage(error))
  }
}

export default async function ClientEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const client = await getClient(id)
  
  if (!client) {
    return <div className="p-4">Cliente no encontrado</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Editar cliente</h1>
      <EditClientForm client={client} updateAction={updateClient.bind(null, client.id)} />
    </div>
  )
}
