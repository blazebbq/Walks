import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import PDFDocument from 'pdfkit'

interface RouteParams {
  params: Promise<{ id: string }>
}

interface IssuePhoto {
  id: string
  photoUrl: string
  thumbUrl: string | null
}

interface Room {
  id: string
  name: string
}

interface Issue {
  id: string
  title: string | null
  type: string
  priority: string
  status: string
  description: string
  pinX: number | null
  pinY: number | null
  pinContext: string | null
  room: Room
  photos: IssuePhoto[]
  createdAt: Date
}

interface WalkdownData {
  id: string
  title: string
  status: string
  startedAt: Date
  building: {
    id: string
    name: string
  }
  floor: {
    id: string
    name: string
  } | null
  createdBy: {
    name: string | null
    email: string
  }
  issues: Issue[]
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: walkdownId } = await params

    // Fetch walkdown with all related data
    const walkdown = await prisma.walkdown.findUnique({
      where: { id: walkdownId },
      include: {
        building: true,
        floor: true,
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        issues: {
          include: {
            room: true,
            photos: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!walkdown) {
      return NextResponse.json({ error: 'Walkdown not found' }, { status: 404 })
    }

    // Create PDF
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50,
      },
    })

    // Create a buffer to store the PDF
    const chunks: Buffer[] = []
    doc.on('data', (chunk) => chunks.push(chunk))
    
    // Generate PDF content
    await generatePDFContent(doc, walkdown)

    // Finalize the PDF
    doc.end()

    // Wait for PDF to finish
    await new Promise<void>((resolve) => {
      doc.on('end', () => resolve())
    })

    const pdfBuffer = Buffer.concat(chunks)

    // Return PDF with proper headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="walkdown-${walkdown.title.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF report' },
      { status: 500 }
    )
  }
}

async function generatePDFContent(doc: typeof PDFDocument.prototype, walkdown: WalkdownData) {
  const pageWidth = doc.page.width
  const pageHeight = doc.page.height
  const margin = 50

  // Helper function to check if we need a new page
  const checkNewPage = (neededSpace: number) => {
    if (doc.y + neededSpace > pageHeight - margin) {
      doc.addPage()
      return true
    }
    return false
  }

  // Header
  doc.fontSize(20).font('Helvetica-Bold').text('Facility Walkdown Report', { align: 'center' })
  doc.moveDown(0.5)
  
  // Header information
  doc.fontSize(10).font('Helvetica')
  const startDate = new Date(walkdown.startedAt).toLocaleString()
  
  doc.fontSize(12).font('Helvetica-Bold')
  doc.text(`Building: ${walkdown.building.name}`, margin, doc.y)
  doc.font('Helvetica')
  if (walkdown.floor) {
    doc.text(`Floor: ${walkdown.floor.name}`)
  }
  doc.text(`Title: ${walkdown.title}`)
  doc.text(`Date: ${startDate}`)
  doc.text(`Status: ${walkdown.status}`)
  doc.text(`Created by: ${walkdown.createdBy.name || walkdown.createdBy.email}`)
  
  doc.moveDown(1)

  // Draw separator line
  doc.strokeColor('#cccccc').lineWidth(1)
  doc.moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).stroke()
  doc.moveDown(1)

  // Summary Section
  doc.fontSize(14).font('Helvetica-Bold').text('Summary', { underline: true })
  doc.moveDown(0.5)

  const totalIssues = walkdown.issues.length
  const priorityCounts = {
    Critical: walkdown.issues.filter((i: Issue) => i.priority === 'Critical').length,
    High: walkdown.issues.filter((i: Issue) => i.priority === 'High').length,
    Med: walkdown.issues.filter((i: Issue) => i.priority === 'Med').length,
    Low: walkdown.issues.filter((i: Issue) => i.priority === 'Low').length,
  }
  const statusCounts = {
    Open: walkdown.issues.filter((i: Issue) => i.status === 'Open').length,
    InProgress: walkdown.issues.filter((i: Issue) => i.status === 'InProgress').length,
    Closed: walkdown.issues.filter((i: Issue) => i.status === 'Closed').length,
  }

  doc.fontSize(11).font('Helvetica')
  doc.text(`Total Issues: ${totalIssues}`)
  doc.moveDown(0.3)
  doc.text('By Priority:', { continued: false })
  doc.fontSize(10)
  doc.text(`  • Critical: ${priorityCounts.Critical}`, { indent: 20 })
  doc.text(`  • High: ${priorityCounts.High}`, { indent: 20 })
  doc.text(`  • Medium: ${priorityCounts.Med}`, { indent: 20 })
  doc.text(`  • Low: ${priorityCounts.Low}`, { indent: 20 })
  doc.moveDown(0.3)
  doc.fontSize(11)
  doc.text('By Status:', { continued: false })
  doc.fontSize(10)
  doc.text(`  • Open: ${statusCounts.Open}`, { indent: 20 })
  doc.text(`  • In Progress: ${statusCounts.InProgress}`, { indent: 20 })
  doc.text(`  • Closed: ${statusCounts.Closed}`, { indent: 20 })

  doc.moveDown(1.5)

  // Draw separator line
  doc.strokeColor('#cccccc').lineWidth(1)
  doc.moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).stroke()
  doc.moveDown(1)

  // Issues Section
  doc.fontSize(14).font('Helvetica-Bold').text('Issues by Room', { underline: true })
  doc.moveDown(0.5)

  if (walkdown.issues.length === 0) {
    doc.fontSize(11).font('Helvetica').text('No issues recorded.')
  } else {
    // Group issues by room
    const issuesByRoom: { [key: string]: Issue[] } = {}
    walkdown.issues.forEach((issue: Issue) => {
      const roomName = issue.room.name
      if (!issuesByRoom[roomName]) {
        issuesByRoom[roomName] = []
      }
      issuesByRoom[roomName].push(issue)
    })

    // Render each room section
    for (const [roomName, issues] of Object.entries(issuesByRoom)) {
      checkNewPage(100)

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e40af')
      doc.text(`📍 ${roomName}`, margin, doc.y)
      doc.fillColor('#000000')
      doc.moveDown(0.5)

      for (let i = 0; i < issues.length; i++) {
        const issue = issues[i]
        
        // Check if we need space for the issue (estimate)
        checkNewPage(150)

        // Issue box
        const boxY = doc.y

        doc.fontSize(10).font('Helvetica-Bold')
        doc.text(`Issue #${issue.id.substring(0, 8).toUpperCase()}`, margin + 5, boxY + 5)
        
        doc.fontSize(9).font('Helvetica')
        const issueX = margin + 5
        let issueY = boxY + 20

        // Type, Priority, Status badges
        doc.text(`Type: ${issue.type}  |  Priority: ${issue.priority}  |  Status: ${issue.status}`, issueX, issueY)
        issueY += 15

        // Title
        if (issue.title) {
          doc.font('Helvetica-Bold').text(`Title: `, issueX, issueY, { continued: true })
          doc.font('Helvetica').text(issue.title)
          issueY = doc.y + 3
        }

        // Description
        doc.font('Helvetica-Bold').text('Description: ', issueX, issueY, { continued: true })
        doc.font('Helvetica').text(issue.description, {
          width: pageWidth - margin * 2 - 10,
        })
        issueY = doc.y + 5

        // Blueprint location
        if (issue.pinX !== null && issue.pinY !== null) {
          doc.fontSize(8).fillColor('#666666')
          doc.text(`📍 Blueprint Location: (${(issue.pinX * 100).toFixed(1)}%, ${(issue.pinY * 100).toFixed(1)}%) on ${issue.pinContext || 'floor'}`, issueX, issueY)
          doc.fillColor('#000000')
          issueY = doc.y + 3
        }

        // Photos
        if (issue.photos && issue.photos.length > 0) {
          doc.fontSize(8).text(`📷 ${issue.photos.length} photo(s) attached`, issueX, issueY)
          issueY = doc.y + 5
        }

        // Draw a light border around the issue
        doc.rect(margin, boxY, pageWidth - margin * 2, issueY - boxY + 5)
          .strokeColor('#e5e7eb')
          .lineWidth(0.5)
          .stroke()

        doc.y = issueY + 10
        doc.moveDown(0.5)
      }

      doc.moveDown(0.5)
    }
  }

  // Sign-off section at the end
  checkNewPage(150)
  doc.moveDown(1)

  // Draw separator line
  doc.strokeColor('#cccccc').lineWidth(1)
  doc.moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).stroke()
  doc.moveDown(1)

  doc.fontSize(14).font('Helvetica-Bold').text('Sign-off', { underline: true })
  doc.moveDown(1)

  doc.fontSize(10).font('Helvetica')
  
  // Raised by
  doc.text('Raised by: _______________________________________     Date: _______________')
  doc.moveDown(1.5)

  // Contractor/Maintenance
  doc.text('Contractor/Maintenance: ___________________________     Date: _______________')
  doc.moveDown(1.5)

  // QA Verification
  doc.text('QA Verification: ___________________________________     Date: _______________')
  doc.moveDown(2)

  // Footer
  doc.fontSize(8).fillColor('#666666')
  doc.text(
    `Generated on ${new Date().toLocaleString()}`,
    margin,
    pageHeight - margin + 10,
    { align: 'center' }
  )
}
