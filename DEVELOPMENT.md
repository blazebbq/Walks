# Development Guide

## Prerequisites

- Node.js 20.x or higher
- PostgreSQL 14.x or higher
- npm or yarn

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure your database connection:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/walks_db?schema=public"
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
UPLOAD_DIR="./uploads"
```

### 3. Set Up the Database

Create the database:

```bash
createdb walks_db
```

Run Prisma migrations:

```bash
npm run prisma:migrate
```

This will:
- Create all database tables
- Generate the Prisma Client
- Apply the schema to your database

### 4. Seed the Database (Optional but Recommended)

Populate the database with sample data for development:

```bash
npm run prisma:seed
```

This creates:
- A test admin user (email: `admin@example.com`, password: `password123`)
- A sample building with floors and rooms
- A sample walkdown with issues

### 5. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Workflow

### Running the App

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Database Management

```bash
# Generate Prisma Client (after schema changes)
npm run prisma:generate

# Create a new migration
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Seed the database
npm run prisma:seed
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Run TypeScript type checking
npx tsc --noEmit
```

## Project Structure

```
/
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Database migrations
│   └── seed.ts            # Seed script
├── src/
│   ├── app/
│   │   ├── admin/         # Admin pages
│   │   ├── api/           # API routes
│   │   ├── auth/          # Authentication pages
│   │   ├── dashboard/     # Dashboard page
│   │   └── walkdown/      # Walkdown pages
│   ├── components/        # Reusable components
│   ├── lib/              # Utilities and config
│   └── types/            # TypeScript type definitions
├── public/               # Static files
└── uploads/              # Uploaded files (gitignored)
```

## Key Features to Test

### 1. Authentication

1. Go to http://localhost:3000
2. Click "Sign In"
3. Use credentials: `admin@example.com` / `password123`

### 2. Admin - Building Management

1. Navigate to Admin > Buildings
2. Create a new building
3. Click on the building
4. Add floors with blueprint images
5. Upload sample blueprint images (PNG/JPG)

### 3. Walkdown Creation

1. Go to Dashboard
2. Click "New Walkdown"
3. Fill in the form and select a building
4. View the walkdown detail page

### 4. Issue Tracking

1. Open a walkdown
2. Click "Add Issue" (currently placeholder)
3. View issues in the list

## API Testing

You can test API endpoints using curl or tools like Postman:

```bash
# Login (get session cookie)
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# Get buildings (requires auth)
curl http://localhost:3000/api/buildings \
  -H "Cookie: your-session-cookie"

# Create a building
curl -X POST http://localhost:3000/api/buildings \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"name":"New Building","siteCode":"NB-001"}'
```

## Common Issues

### Port Already in Use

If port 3000 is already in use:

```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Database Connection Issues

1. Verify PostgreSQL is running:
   ```bash
   pg_isready
   ```

2. Check your DATABASE_URL in .env

3. Ensure the database exists:
   ```bash
   psql -l | grep walks_db
   ```

### Prisma Client Not Generated

If you see "Cannot find module '@prisma/client'":

```bash
npm run prisma:generate
```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| DATABASE_URL | PostgreSQL connection string | Yes | - |
| NEXTAUTH_SECRET | Secret for NextAuth.js | Yes | - |
| NEXTAUTH_URL | Base URL of the application | Yes | http://localhost:3000 |
| UPLOAD_DIR | Directory for file uploads | No | ./uploads |

## Next Steps

1. **Implement Blueprint Viewer**: Add zoom/pan functionality
2. **Room Polygon Tool**: Create UI for defining room boundaries
3. **Issue Creation Form**: Build form with photo capture
4. **Offline Sync**: Implement IndexedDB sync mechanism
5. **PDF Generation**: Add PDF report generation
6. **Mobile Testing**: Test on actual mobile devices

## Getting Help

- Check the [README.md](README.md) for an overview
- Review the Prisma schema in `prisma/schema.prisma`
- Explore the API routes in `src/app/api/`
- Use Prisma Studio to inspect the database: `npm run prisma:studio`

## Contributing

When making changes:

1. Create a new branch
2. Make your changes
3. Run `npm run build` to ensure it compiles
4. Test locally with `npm run dev`
5. Commit with clear messages
6. Push and create a pull request
