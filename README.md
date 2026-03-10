# Facility Walkdown System

A production-ready, crash-safe, data-safe system for facility walkdowns with comprehensive offline support, blueprint visualization, and automated PDF report generation.

## ✨ Features

### Core Functionality
- 🏢 **Building Management**: Create and manage buildings, floors, and rooms with blueprint uploads
- 📱 **Mobile-First Walkdown UI**: Conduct inspections on-site with tap-to-pin issue marking
- 📵 **Complete Offline Support**: Capture issues without internet, automatic sync when online
- 🖼️ **Blueprint Visualization**: Zoom, pan, and tap blueprints to mark exact issue locations
- 📸 **Photo Capture**: Capture photos with each issue, works offline
- 📄 **PDF Reports**: Generate professional contractor-ready reports with sign-off boxes
- 🔐 **Authentication**: Secure login with NextAuth.js
- 🔄 **PWA Support**: Installable as a progressive web app

### Offline & Sync
- ✅ **IndexedDB Storage**: Local data persistence with Dexie.js
- ✅ **Background Sync**: Automatic retry and sync when connection restored
- ✅ **Sync Status Indicator**: Real-time sync state with pending count
- ✅ **Service Worker**: Offline caching for core app functionality
- ✅ **Retry Logic**: Exponential backoff for failed uploads
- ✅ **Queue Management**: View and manually trigger sync

### User Experience
- ✅ **Toast Notifications**: Success, error, info, and warning messages
- ✅ **Confirmation Dialogs**: Protect against accidental destructive actions
- ✅ **Loading States**: All buttons and forms show loading indicators
- ✅ **Error Boundaries**: Graceful error handling with fallback UI
- ✅ **Pull-to-Refresh**: Refresh walkdown lists on mobile
- ✅ **Form Validation**: Clear, actionable error messages
- ✅ **Keyboard Shortcuts**: Enhanced productivity for power users
- ✅ **Mobile Optimized**: 44x44px touch targets, responsive design

### Blueprint Features
- ✅ **Zoom & Pan**: Pinch-to-zoom on mobile, scroll wheel on desktop
- ✅ **Tap-to-Pin**: Mark issue locations with normalized coordinates
- ✅ **Priority Colors**: Visual coding (Critical=red, High=orange, Medium=yellow, Low=green)
- ✅ **Interactive Tooltips**: Issue metadata on hover/tap
- ✅ **Device Independent**: Normalized coordinates (0..1) work on any screen

## Tech Stack

- **Framework**: Next.js 16 with TypeScript and App Router
- **UI**: Tailwind CSS 4
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Offline Storage**: IndexedDB (Dexie.js)
- **PWA**: Service Worker with caching strategy
- **PDF Generation**: PDFKit
- **Blueprint Viewer**: react-zoom-pan-pinch (custom component)
- **State Management**: React hooks

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
│   │   ├── blueprint-demo/ # BlueprintViewer demo page
│   │   ├── dashboard/      # Main dashboard
│   │   └── walkdown/       # Walkdown UI
│   ├── components/         # Reusable components
│   │   └── BlueprintViewer.tsx  # Blueprint zoom/pan/pin component
│   └── lib/               # Utilities and shared code
├── prisma/
│   └── schema.prisma      # Database schema
└── public/                # Static assets
```

## BlueprintViewer Component

The project includes a professional, production-ready BlueprintViewer component with:

- ✅ **Zoom & Pan**: Pinch-to-zoom on mobile, scroll wheel on desktop
- ✅ **Tap-to-Pin**: Mark issue locations with normalized coordinates
- ✅ **Priority Colors**: Visual coding (Critical=red, High=orange, Medium=yellow, Low=green)
- ✅ **Interactive Tooltips**: Issue metadata on hover/tap
- ✅ **Mobile Optimized**: Touch-friendly, responsive design
- ✅ **Device Independent**: Normalized coordinates (0..1) work on any screen

**Demo**: Visit `/blueprint-demo` to see it in action

**Documentation**: 
- Component API: `src/components/BlueprintViewer.README.md`
- Integration guide: `BLUEPRINT_INTEGRATION.md`
- Implementation details: `BLUEPRINT_VIEWER_SUMMARY.md`

## Key Workflows

### Admin Setup

1. Navigate to `/admin/buildings`
2. Create a building with name and address
3. Add floors with blueprint images
4. Define rooms with optional room-specific blueprints

### Conducting a Walkdown

1. Go to `/walkdown` and click "New Walkdown"
2. Select a building and optional floor
3. Navigate to the walkdown and click "Add Issue"
4. Fill in issue details:
   - Select room
   - Choose issue type (Electrical, HVAC, etc.)
   - Set priority (Low, Med, High, Critical)
   - Add description (minimum 10 characters)
   - Capture photo (optional)
   - Add blueprint pin coordinates (optional)
5. Issue is automatically saved locally if offline
6. Automatic sync when connection restored

### Working Offline

1. Open the app while online to cache resources
2. Lose connection or enable airplane mode
3. Continue adding issues - they save to IndexedDB
4. Offline indicator shows at bottom of screen
5. When online, sync status shows pending count
6. Click "Sync Now" or wait for automatic sync
7. Toast notification confirms successful sync

### Generating Reports

1. View a walkdown session
2. Click "Generate PDF Report"
3. Report downloads with all issues grouped by room
4. Includes photos, descriptions, and sign-off boxes
5. Professional format ready for contractors

### Using the App as PWA

**iOS**:
1. Open app in Safari
2. Tap Share button
3. Select "Add to Home Screen"
4. Open from home screen icon

**Android**:
1. Open app in Chrome
2. Tap menu (⋮)
3. Select "Add to Home Screen"
4. Open from home screen icon

## Database Schema

- **Buildings**: Top-level facility entities
- **Floors**: Floors within buildings with blueprints
- **Rooms**: Individual rooms with optional blueprints
- **Walkdowns**: Inspection sessions
- **Issues**: Individual defects/observations
- **IssuePhotos**: Photos attached to issues
- **SignOffs**: Contractor and QA sign-offs

## API Endpoints

### Authentication
- `POST /api/auth/signin` - User login
- `GET /api/auth/session` - Get current session
- `POST /api/auth/signout` - User logout
- `POST /api/create-admin` - Create admin user (first-time setup)

### Buildings & Facilities
- `GET /api/buildings` - List all buildings
- `POST /api/buildings` - Create new building
- `GET /api/floors?buildingId={id}` - List floors for building
- `POST /api/floors` - Create new floor
- `GET /api/rooms?floorId={id}` - List rooms for floor
- `POST /api/rooms` - Create new room
- `GET /api/rooms/:id` - Get room details
- `PUT /api/rooms/:id` - Update room

### Walkdowns & Issues
- `GET /api/walkdowns` - List all walkdowns
- `POST /api/walkdowns` - Create new walkdown
- `GET /api/issues` - List all issues
- `POST /api/issues` - Create new issue
- `POST /api/photos` - Link photo to issue
- `GET /api/walkdowns/:id/report` - Generate PDF report

### File Uploads
- `POST /api/upload` - Upload file (photos, blueprints)
- `GET /api/uploads/:filename` - Retrieve uploaded file

## Testing

See [TESTING.md](./TESTING.md) for comprehensive testing guide covering:
- Functional testing
- Offline functionality
- Mobile testing
- Performance testing
- Accessibility testing
- Browser compatibility

### Quick Start Testing
```bash
# Run development server
npm run dev

# Create admin user
# Navigate to /api/create-admin

# Login
# Navigate to /auth/signin

# Create test data
# Navigate to /admin/buildings
```

## Documentation

- **README.md** - This file, project overview
- **TESTING.md** - Comprehensive testing guide
- **CHANGELOG.md** - Version history and roadmap
- **DEPLOYMENT.md** - Deployment instructions
- **DEVELOPMENT.md** - Development setup guide
- **BLUEPRINT_INTEGRATION.md** - Blueprint component integration
- **BLUEPRINT_VIEWER_SUMMARY.md** - Blueprint viewer details

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history and planned features.

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

See [CHANGELOG.md](./CHANGELOG.md) for commit message guidelines.

## Support

- **Issues**: [GitHub Issues](https://github.com/blazebbq/Walks/issues)
- **Documentation**: See docs listed above
- **Testing Guide**: [TESTING.md](./TESTING.md)

## License

MIT License - See LICENSE file for details

## Acknowledgments

Built with modern web technologies for reliable field use. Special thanks to the open-source community for the excellent tools and libraries that make this project possible.
