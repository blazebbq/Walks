# Facility Walkdown System

A crash-safe, data-safe system for facility walkdowns with offline support, blueprint visualization, and automated PDF report generation.

## Features

- 🏢 **Building Management**: Create and manage buildings, floors, and rooms with blueprint uploads
- 📱 **Mobile-First Walkdown UI**: Conduct inspections on-site with tap-to-pin issue marking
- 📵 **Offline-First**: Capture issues even without internet, automatic sync when online
- 🖼️ **Blueprint Visualization**: Zoom, pan, and tap blueprints to mark exact issue locations
- 📸 **Photo Capture**: Required photo capture for each issue with thumbnail support
- 📄 **PDF Reports**: Generate professional contractor-ready reports with sign-off boxes
- 🔐 **Authentication**: Secure login with NextAuth.js
- 🔄 **PWA Support**: Installable as a progressive web app

## Tech Stack

- **Framework**: Next.js 16 with TypeScript
- **UI**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Offline Storage**: IndexedDB (Dexie.js)
- **PWA**: next-pwa
- **PDF Generation**: PDFKit / jsPDF

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/blazebbq/Walks.git
cd Walks
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials and other settings.

4. Set up the database:
```bash
npm run prisma:migrate
```

5. Generate Prisma client:
```bash
npm run prisma:generate
```

6. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── admin/          # Admin UI for building management
│   │   ├── api/            # API routes
│   │   ├── auth/           # Authentication pages
│   │   ├── dashboard/      # Main dashboard
│   │   └── walkdown/       # Walkdown UI
│   ├── components/         # Reusable components
│   └── lib/               # Utilities and shared code
├── prisma/
│   └── schema.prisma      # Database schema
└── public/                # Static assets
```

## Key Workflows

### Admin Setup

1. Navigate to `/admin/buildings`
2. Create a building
3. Add floors with blueprint images
4. Define rooms with polygon regions or room-specific blueprints

### Conducting a Walkdown

1. Create a new walkdown session
2. Select a building and floor
3. Tap on the blueprint to select a room
4. Mark issues by tapping on the room blueprint
5. Add photos, description, type, and priority
6. Issues are saved locally and synced to server

### Generating Reports

1. View a walkdown session
2. Click "Generate PDF Report"
3. Report includes all issues grouped by room with photos and sign-off boxes

## Database Schema

- **Buildings**: Top-level facility entities
- **Floors**: Floors within buildings with blueprints
- **Rooms**: Individual rooms with optional blueprints
- **Walkdowns**: Inspection sessions
- **Issues**: Individual defects/observations
- **IssuePhotos**: Photos attached to issues
- **SignOffs**: Contractor and QA sign-offs

## API Endpoints

- `GET/POST /api/buildings` - Buildings management
- `GET/POST /api/floors` - Floors management
- `GET/POST /api/rooms` - Rooms management
- `GET/POST /api/walkdowns` - Walkdown sessions
- `GET/POST /api/issues` - Issues management
- `POST /api/issues/:id/photos` - Photo uploads

## License

MIT
