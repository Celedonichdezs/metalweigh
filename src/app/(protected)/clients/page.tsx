import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NewClientForm } from './_components/new-client-form'
import { getPrismaErrorMessage } from '@/lib/prisma-errors'

export const dynamic = 'force-dynamic'

async function getClients(search?: string) {
  const where = search ? {
    OR: [
      { name: { contains: search, mode: 'insensitive' as const } },
      { document: { contains: search, mode: 'insensitive' as const } },
      { phone: { contains: search, mode: 'insensitive' as const } },
      { email: { contains: search, mode: 'insensitive' as const } },
    ]
  } : {}

  return prisma.client.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
}

export async function createClient(formData: FormData) {
  'use server'
  
  try {
    const name = String(formData.get('name') || '').trim()
    const documentType = String(formData.get('documentType') || '').trim() || undefined
    const document = String(formData.get('document') || '').trim() || undefined
    const address = String(formData.get('address') || '').trim() || undefined
    const phone = String(formData.get('phone') || '').trim() || undefined
    const email = String(formData.get('email') || '').trim() || undefined

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

    await prisma.client.create({
      data: {
        name,
        documentType,
        document: document || undefined,
        address: address || undefined,
        phone: phone || undefined,
        email: email || undefined,
      },
    })
    
    revalidatePath('/clients')
  } catch (error) {
    throw new Error(getPrismaErrorMessage(error))
  }
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search } = await searchParams
  const clients = await getClients(search)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clientes</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-zinc-900">
          <h2 className="mb-3 text-lg font-medium">Nuevo cliente</h2>
          <NewClientForm createAction={createClient} />
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-zinc-900 md:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">Listado</h2>
            <form className="flex gap-2">
              <Input
                name="search"
                placeholder="Buscar por nombre, documento, teléfono..."
                defaultValue={search}
                className="w-64"
              />
              <Button type="submit">Buscar</Button>
            </form>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Documento</th>
                  <th className="px-3 py-2">Teléfono</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b">
                    <td className="px-3 py-2 font-medium">{client.name}</td>
                    <td className="px-3 py-2">
                      {client.document ? (
                        <span>
                          {client.documentType && `${client.documentType}: `}
                          {client.document}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </td>
                    <td className="px-3 py-2">{client.phone || 'N/A'}</td>
                    <td className="px-3 py-2">{client.email || 'N/A'}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        client.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {client.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/clients/${client.id}`}>Editar</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {clients.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {search ? 'No se encontraron clientes con esos criterios' : 'No hay clientes registrados'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
