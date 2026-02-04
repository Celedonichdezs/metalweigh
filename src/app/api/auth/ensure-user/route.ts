 import { prisma } from '@/lib/prisma'
 
 export async function POST(req: Request) {
   const body = await req.json()
   const email = (body?.email as string | undefined)?.trim()
   if (!email) {
     return new Response(JSON.stringify({ error: 'email requerido' }), {
       status: 400,
       headers: { 'Content-Type': 'application/json' },
     })
   }
   await prisma.user.upsert({
     where: { email },
     update: { isActive: true },
     create: { email },
   })
   return new Response(JSON.stringify({ ok: true }), {
     status: 200,
     headers: { 'Content-Type': 'application/json' },
   })
 }
