import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const buildingId = searchParams.get('buildingId')

    const where = buildingId ? { buildingId } : {}

    const floors = await prisma.floor.findMany({
      where,
      include: {
        building: true,
        rooms: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(floors)
  } catch (error) {
    console.error('Error fetching floors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch floors' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { buildingId, name, blueprintImageUrl, blueprintWidth, blueprintHeight } = body

    if (!buildingId || !name) {
      return NextResponse.json(
        { error: 'Building ID and name are required' },
        { status: 400 }
      )
    }

    const floor = await prisma.floor.create({
      data: {
        buildingId,
        name,
        blueprintImageUrl,
        blueprintWidth,
        blueprintHeight,
      },
      include: {
        building: true,
      },
    })

    return NextResponse.json(floor, { status: 201 })
  } catch (error) {
    console.error('Error creating floor:', error)
    return NextResponse.json(
      { error: 'Failed to create floor' },
      { status: 500 }
    )
  }
}
