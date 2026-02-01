# BlueprintViewer Integration Guide

This guide shows how to integrate the BlueprintViewer component into the existing Facility Walkdown System.

## Quick Start

The BlueprintViewer component is located at `src/components/BlueprintViewer.tsx` and is ready to use in any page or component.

## Integration Points

### 1. Walkdown Issue Creation

Add blueprint support to the issue creation flow:

```tsx
// src/app/walkdown/[id]/add-issue/page.tsx

import BlueprintViewer, { Issue } from '@/components/BlueprintViewer';

export default function AddIssuePage({ params }: { params: { id: string } }) {
  const [selectedPosition, setSelectedPosition] = useState<{x: number, y: number} | null>(null);

  const handlePinAdd = (x: number, y: number) => {
    setSelectedPosition({ x, y });
    // Optionally scroll to form or show modal
  };

  const handleSubmit = async (formData: FormData) => {
    const issueData = {
      ...formData,
      pinX: selectedPosition?.x,
      pinY: selectedPosition?.y,
      walkdownId: params.id,
    };
    
    await fetch('/api/issues', {
      method: 'POST',
      body: JSON.stringify(issueData),
    });
  };

  return (
    <div>
      <div className="h-[600px]">
        <BlueprintViewer
          blueprintUrl="/blueprints/floor-1.png"
          onPinAdd={handlePinAdd}
        />
      </div>
      
      {selectedPosition && (
        <form onSubmit={handleSubmit}>
          <input type="text" name="title" placeholder="Issue title" required />
          <select name="priority">
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <button type="submit">Create Issue</button>
        </form>
      )}
    </div>
  );
}
```

### 2. Walkdown Overview/Dashboard

Display all issues on the blueprint:

```tsx
// src/app/walkdown/[id]/page.tsx

import BlueprintViewer, { Issue } from '@/components/BlueprintViewer';

export default async function WalkdownPage({ params }: { params: { id: string } }) {
  // Fetch walkdown and issues
  const walkdown = await fetch(`/api/walkdowns/${params.id}`).then(r => r.json());
  const issues = await fetch(`/api/walkdowns/${params.id}/issues`).then(r => r.json());

  // Transform issues to match BlueprintViewer format
  const blueprintIssues: Issue[] = issues
    .filter(issue => issue.pinX !== null && issue.pinY !== null)
    .map(issue => ({
      id: issue.id,
      pinX: issue.pinX,
      pinY: issue.pinY,
      title: issue.title,
      priority: issue.priority,
      type: issue.type,
    }));

  return (
    <div>
      <h1>{walkdown.name}</h1>
      
      <div className="h-[800px] mt-4">
        <BlueprintViewer
          blueprintUrl={walkdown.blueprintUrl}
          existingIssues={blueprintIssues}
          readOnly={true}
        />
      </div>

      {/* Issue list below */}
      <div className="mt-8">
        <h2>All Issues</h2>
        {issues.map(issue => (
          <div key={issue.id}>
            {issue.title} - {issue.priority}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3. Real-time Collaboration

Add real-time updates for team collaboration:

```tsx
'use client';

import { useEffect, useState } from 'react';
import BlueprintViewer, { Issue } from '@/components/BlueprintViewer';

export default function CollaborativeWalkdown({ walkdownId }: { walkdownId: string }) {
  const [issues, setIssues] = useState<Issue[]>([]);

  useEffect(() => {
    // Initial load
    loadIssues();

    // Poll for updates (or use WebSocket)
    const interval = setInterval(loadIssues, 5000);
    return () => clearInterval(interval);
  }, [walkdownId]);

  const loadIssues = async () => {
    const data = await fetch(`/api/walkdowns/${walkdownId}/issues`).then(r => r.json());
    setIssues(data);
  };

  const handlePinAdd = async (x: number, y: number) => {
    const newIssue = await fetch(`/api/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walkdownId,
        pinX: x,
        pinY: y,
        title: 'New Issue',
        priority: 'Medium',
        type: 'General',
      }),
    }).then(r => r.json());

    setIssues([...issues, newIssue]);
  };

  return (
    <BlueprintViewer
      blueprintUrl="/blueprints/floor-1.png"
      existingIssues={issues}
      onPinAdd={handlePinAdd}
    />
  );
}
```

## Database Schema Updates

Add blueprint coordinate fields to your issues table:

```sql
-- Add to existing issues table
ALTER TABLE issues 
ADD COLUMN pin_x DECIMAL(10, 8),
ADD COLUMN pin_y DECIMAL(10, 8);

-- Prisma schema update
model Issue {
  id        String   @id @default(cuid())
  title     String
  priority  String
  type      String
  pinX      Float?   @map("pin_x")
  pinY      Float?   @map("pin_y")
  // ... existing fields
}
```

## API Routes

### Create Issue with Pin

```ts
// src/app/api/issues/route.ts

export async function POST(request: Request) {
  const body = await request.json();
  
  const issue = await prisma.issue.create({
    data: {
      title: body.title,
      priority: body.priority,
      type: body.type,
      pinX: body.pinX,  // Normalized 0..1
      pinY: body.pinY,  // Normalized 0..1
      walkdownId: body.walkdownId,
      // ... other fields
    },
  });

  return Response.json(issue);
}
```

### Get Issues with Pins

```ts
// src/app/api/walkdowns/[id]/issues/route.ts

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const issues = await prisma.issue.findMany({
    where: { walkdownId: params.id },
    select: {
      id: true,
      title: true,
      priority: true,
      type: true,
      pinX: true,
      pinY: true,
      // ... other fields
    },
  });

  return Response.json(issues);
}
```

## Blueprint Management

### Upload Blueprints

```ts
// src/app/api/blueprints/route.ts

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  // Save file to storage
  const filename = `blueprint-${Date.now()}.png`;
  await saveFile(file, filename);
  
  return Response.json({ 
    url: `/uploads/${filename}` 
  });
}
```

### Associate with Buildings/Floors

```ts
// Add blueprint URL to building or floor model
model Floor {
  id            String   @id @default(cuid())
  name          String
  blueprintUrl  String?  @map("blueprint_url")
  buildingId    String   @map("building_id")
  // ... existing fields
}
```

## Mobile Optimization

The component is already mobile-optimized, but consider these UX enhancements:

### Full-Screen Mode

```tsx
'use client';

import { useState } from 'react';
import BlueprintViewer from '@/components/BlueprintViewer';

export default function MobileFriendlyWalkdown() {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <div className={fullscreen ? 'fixed inset-0 z-50' : 'h-[500px]'}>
      <button 
        onClick={() => setFullscreen(!fullscreen)}
        className="absolute top-2 right-2 z-30 bg-white p-2 rounded"
      >
        {fullscreen ? 'Exit' : 'Fullscreen'}
      </button>
      
      <BlueprintViewer
        blueprintUrl="/blueprints/floor-1.png"
        existingIssues={issues}
        onPinAdd={handlePinAdd}
      />
    </div>
  );
}
```

### Offline Support

```tsx
// Use IndexedDB for offline pin storage
import Dexie from 'dexie';

const db = new Dexie('WalkdownDB');
db.version(1).stores({
  pendingPins: '++id, walkdownId, pinX, pinY, timestamp',
});

const handlePinAdd = async (x: number, y: number) => {
  if (!navigator.onLine) {
    // Store offline
    await db.pendingPins.add({
      walkdownId,
      pinX: x,
      pinY: y,
      timestamp: Date.now(),
    });
  } else {
    // Send to server
    await createIssue({ pinX: x, pinY: y });
  }
};

// Sync when back online
window.addEventListener('online', async () => {
  const pending = await db.pendingPins.toArray();
  for (const pin of pending) {
    await createIssue(pin);
    await db.pendingPins.delete(pin.id);
  }
});
```

## Best Practices

1. **Blueprint Quality**: Use high-resolution images (at least 2000px wide) for better zoom quality
2. **Loading States**: Always show loading indicators while blueprints load
3. **Error Handling**: Provide fallback UI if blueprint fails to load
4. **Coordinate Validation**: Validate that pinX and pinY are between 0 and 1 before saving
5. **Performance**: For large numbers of pins (100+), consider clustering or filtering
6. **Accessibility**: Provide alternative issue navigation for users who can't interact with blueprints
7. **Offline First**: Cache blueprints for offline access during walkdowns

## Testing

### Unit Test Example

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import BlueprintViewer from '@/components/BlueprintViewer';

test('calls onPinAdd with normalized coordinates', () => {
  const handlePinAdd = jest.fn();
  
  render(
    <BlueprintViewer
      blueprintUrl="/test-blueprint.png"
      onPinAdd={handlePinAdd}
    />
  );

  const image = screen.getByAltText('Blueprint');
  fireEvent.click(image, { clientX: 500, clientY: 300 });

  expect(handlePinAdd).toHaveBeenCalledWith(
    expect.any(Number),
    expect.any(Number)
  );
  
  const [x, y] = handlePinAdd.mock.calls[0];
  expect(x).toBeGreaterThanOrEqual(0);
  expect(x).toBeLessThanOrEqual(1);
  expect(y).toBeGreaterThanOrEqual(0);
  expect(y).toBeLessThanOrEqual(1);
});
```

## Troubleshooting

### Pins Not Appearing
- Check that pinX and pinY are between 0 and 1
- Verify blueprint image has loaded (check loading state)
- Ensure existingIssues prop is passed correctly

### Coordinates Incorrect
- Verify you're using normalized coordinates (0..1)
- Check that the image ref is properly initialized
- Ensure getBoundingClientRect() is called after image loads

### Performance Issues
- Reduce blueprint image size
- Implement virtual scrolling for large pin lists
- Use React.memo() for pin components
- Debounce zoom/pan events if needed

## Demo

Visit `/blueprint-demo` in your development environment to see the component in action.

## Support

For questions or issues, refer to:
- Component README: `src/components/BlueprintViewer.README.md`
- Demo page: `/blueprint-demo`
- Project documentation: `IMPLEMENTATION_SUMMARY.md`
