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
    const floorId = searchParams.get('floorId')

    const where = floorId ? { floorId } : {}

    const rooms = await prisma.room.findMany({
      where,
      include: {
        floor: {
          include: {
            building: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(rooms)
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
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
    const { 
      floorId, 
      name, 
      code, 
      polygonJson, 
      roomBlueprintImageUrl,
      roomBlueprintWidth,
      roomBlueprintHeight 
    } = body

    if (!floorId || !name) {
      return NextResponse.json(
        { error: 'Floor ID and name are required' },
        { status: 400 }
      )
    }

    const room = await prisma.room.create({
      data: {
        floorId,
        name,
        code,
        polygonJson,
        roomBlueprintImageUrl,
        roomBlueprintWidth,
        roomBlueprintHeight,
      },
      include: {
        floor: {
          include: {
            building: true,
          },
        },
      },
    })

    return NextResponse.json(room, { status: 201 })
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    )
  }
}
