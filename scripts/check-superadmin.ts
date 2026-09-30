import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const user = await db.user.findUnique({ where: { email: 'hamza@demostore.pk' } })
  console.log('User:', user?.email, '| isSuperAdmin:', user?.isSuperAdmin)
  console.log('Full user:', JSON.stringify(user, null, 2))
}
main().catch(console.error).finally(() => db.$disconnect())
