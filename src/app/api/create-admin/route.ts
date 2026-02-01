import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
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

    return NextResponse.json({ success: true, user: { email: user.email, name: user.name } })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
