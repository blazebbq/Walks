import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

async function main() {
  console.log('🌱 Starting seed...')

  // Create a test user
  const bcrypt = await import('bcryptjs')
  const hashedPassword = await bcrypt.hash('password123', 10)
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'admin',
    },
  })

  console.log('✅ Created user:', user.email)

  // Create a test building
  const building = await prisma.building.create({
    data: {
      name: 'Main Office Building',
      siteCode: 'MOB-001',
    },
  })

  console.log('✅ Created building:', building.name)

  // Create floors
  const floor1 = await prisma.floor.create({
    data: {
      buildingId: building.id,
      name: 'Ground Floor',
    },
  })

  const floor2 = await prisma.floor.create({
    data: {
      buildingId: building.id,
      name: 'First Floor',
    },
  })

  console.log('✅ Created floors')

  // Create rooms
  const room1 = await prisma.room.create({
    data: {
      floorId: floor1.id,
      name: 'Main Lobby',
      code: 'R101',
    },
  })

  const room2 = await prisma.room.create({
    data: {
      floorId: floor1.id,
      name: 'Conference Room A',
      code: 'R102',
    },
  })

  const room3 = await prisma.room.create({
    data: {
      floorId: floor2.id,
      name: 'Office 201',
      code: 'R201',
    },
  })

  console.log('✅ Created rooms')

  // Create a sample walkdown
  const walkdown = await prisma.walkdown.create({
    data: {
      title: 'Weekly Inspection - February 2026',
      buildingId: building.id,
      floorId: floor1.id,
      createdByUserId: user.id,
      status: 'Draft',
    },
  })

  console.log('✅ Created walkdown:', walkdown.title)

  // Create sample issues
  const issue1 = await prisma.issue.create({
    data: {
      walkdownId: walkdown.id,
      roomId: room1.id,
      type: 'Cleanliness',
      priority: 'Med',
      status: 'Open',
      description: 'Floor needs cleaning in lobby area',
      createdByUserId: user.id,
    },
  })

  const issue2 = await prisma.issue.create({
    data: {
      walkdownId: walkdown.id,
      roomId: room2.id,
      type: 'Electrical',
      priority: 'High',
      status: 'Open',
      description: 'Light fixture not working in conference room',
      createdByUserId: user.id,
    },
  })

  console.log('✅ Created issues')

  console.log('🎉 Seed complete!')
  console.log('\n📝 Login credentials:')
  console.log('Email: admin@example.com')
  console.log('Password: password123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
