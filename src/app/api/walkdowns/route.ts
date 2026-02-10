import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const walkdowns = await prisma.walkdown.findMany({
      include: {
        building: true,
        floor: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        issues: {
          include: {
            photos: true,
            room: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(walkdowns)
  } catch (error) {
    console.error('Error fetching walkdowns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch walkdowns' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { buildingId, floorId, title } = body

    if (!buildingId || !title) {
      return NextResponse.json(
        { error: 'Building ID and title are required' },
        { status: 400 }
      )
    }

    const walkdown = await prisma.walkdown.create({
      data: {
        buildingId,
        floorId,
        title,
        createdByUserId: session.user.id,
        status: 'Draft',
      },
      include: {
        building: true,
        floor: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(walkdown, { status: 201 })
  } catch (error) {
    console.error('Error creating walkdown:', error)
    return NextResponse.json(
      { error: 'Failed to create walkdown' },
      { status: 500 }
    )
  }
}
