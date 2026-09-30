import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

async function main() {
  console.log('🌱 Seeding plans...')

  const plans = [
    {
      name: 'Starter',
      description: 'Small stores up to 500 orders/month',
      pricePerMonth: 2500,
      orderLimit: 500,
      memberLimit: 2,
      courierLimit: 1,
      features: JSON.stringify(['Shopify sync', 'WhatsApp confirmations', '1 courier integration', 'Basic dashboard', 'Email support']),
    },
    {
      name: 'Growth',
      description: 'Growing stores up to 3,000 orders/month',
      pricePerMonth: 6500,
      orderLimit: 3000,
      memberLimit: 5,
      courierLimit: 6,
      features: JSON.stringify(['Everything in Starter', 'All courier integrations', 'Needs Attention + AI triage', 'Automation rules (10)', 'RTO evidence bundle', 'Priority support']),
    },
    {
      name: 'Business',
      description: 'High-volume stores up to 10,000 orders/month',
      pricePerMonth: 15000,
      orderLimit: 10000,
      memberLimit: 10,
      courierLimit: 6,
      features: JSON.stringify(['Everything in Growth', 'AI risk engine', 'Unlimited automations', 'Team members (10)', 'API access', 'Dedicated account manager']),
    },
    {
      name: 'Enterprise',
      description: 'Large operations 10,000+ orders/month',
      pricePerMonth: 0, // Custom pricing
      orderLimit: 100000,
      memberLimit: 100,
      courierLimit: 99,
      features: JSON.stringify(['Everything in Business', 'Custom courier integrations', 'White-label option', 'SLA guarantee', 'Onboarding & training', '24/7 phone support']),
    },
  ]

  for (const p of plans) {
    const existing = await db.plan.findFirst({ where: { name: p.name } })
    if (existing) {
      await db.plan.update({ where: { id: existing.id }, data: p })
      console.log(`  ✓ Updated: ${p.name}`)
    } else {
      await db.plan.create({ data: p })
      console.log(`  ✓ Created: ${p.name}`)
    }
  }

  // Assign Growth plan to Demo Store PK
  const demoOrg = await db.organization.findUnique({ where: { slug: 'demo-store-pk' } })
  const growthPlan = await db.plan.findFirst({ where: { name: 'Growth' } })
  if (demoOrg && growthPlan) {
    await db.organization.update({ where: { id: demoOrg.id }, data: { planId: growthPlan.id } })
    console.log(`  ✓ Assigned Growth plan to ${demoOrg.name}`)
  }

  console.log('✅ Plans seeded successfully!')
}

main().catch(console.error).finally(() => db.$disconnect())
