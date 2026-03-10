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
    const walkdownId = searchParams.get('walkdownId')

    const where = walkdownId ? { walkdownId } : {}

    const issues = await prisma.issue.findMany({
      where,
      include: {
        room: true,
        photos: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        qaVerifiedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(issues)
  } catch (error) {
    console.error('Error fetching issues:', error)
    return NextResponse.json(
      { error: 'Failed to fetch issues' },
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
    const {
      walkdownId,
      roomId,
      title,
      type,
      priority,
      description,
      pinX,
      pinY,
      pinContext,
    } = body

    if (!walkdownId || !roomId || !type || !priority || !description) {
      return NextResponse.json(
        { error: 'Required fields missing' },
        { status: 400 }
      )
    }

    const issue = await prisma.issue.create({
      data: {
        walkdownId,
        roomId,
        title: title || `${type} - ${priority}`,
        type,
        priority,
        description,
        pinX,
        pinY,
        pinContext,
        createdByUserId: session.user.id,
        status: 'Open',
      },
      include: {
        room: true,
        photos: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(issue, { status: 201 })
  } catch (error) {
    console.error('Error creating issue:', error)
    return NextResponse.json(
      { error: 'Failed to create issue' },
      { status: 500 }
    )
  }
}
