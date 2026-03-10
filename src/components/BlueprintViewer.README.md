# BlueprintViewer Component

A professional, mobile-optimized React component for viewing blueprints with zoom, pan, and tap-to-pin functionality. Built for facility walkdown systems.

## Features

✅ **Zoom & Pan**
- Scroll wheel zoom on desktop
- Pinch-to-zoom on mobile
- Drag to pan around the blueprint
- Zoom controls (+/-/reset buttons)

✅ **Tap-to-Pin**
- Click/tap anywhere to mark issue locations
- Normalized coordinates (0..1) for device-independent positioning
- Callback function to handle new pin additions

✅ **Issue Visualization**
- Display existing issue pins on the blueprint
- Color-coded by priority (Critical=red, High=orange, Medium=yellow, Low=green)
- Interactive tooltips with issue metadata
- Mobile-friendly touch interactions

✅ **Mobile Optimized**
- Responsive design with Tailwind CSS
- Touch-friendly controls
- Smooth performance on mobile devices

✅ **User Experience**
- Loading states for blueprint images
- Error handling for failed image loads
- Read-only mode for viewing
- Professional UI with smooth animations

## Installation

The component uses `react-zoom-pan-pinch` which is already installed in the project:

```json
"react-zoom-pan-pinch": "^3.7.0"
```

## Usage

### Basic Example

```tsx
import BlueprintViewer from '@/components/BlueprintViewer';

export default function MyPage() {
  const handlePinAdd = (x: number, y: number) => {
    console.log('New pin at:', x, y);
    // Save to database or state
  };

  return (
    <BlueprintViewer
      blueprintUrl="/blueprints/floor-1.png"
      onPinAdd={handlePinAdd}
    />
  );
}
```

### With Existing Issues

```tsx
import BlueprintViewer, { Issue } from '@/components/BlueprintViewer';

const issues: Issue[] = [
  {
    id: '1',
    pinX: 0.3,
    pinY: 0.4,
    title: 'Water leak detected',
    priority: 'Critical',
    type: 'Plumbing',
  },
  {
    id: '2',
    pinX: 0.7,
    pinY: 0.3,
    title: 'HVAC maintenance required',
    priority: 'High',
    type: 'HVAC',
  },
];

<BlueprintViewer
  blueprintUrl="/blueprints/floor-1.png"
  existingIssues={issues}
  onPinAdd={handlePinAdd}
/>
```

### Read-Only Mode

```tsx
<BlueprintViewer
  blueprintUrl="/blueprints/floor-1.png"
  existingIssues={issues}
  readOnly={true}
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `blueprintUrl` | `string` | Yes | - | URL or path to the blueprint image |
| `existingIssues` | `Issue[]` | No | `[]` | Array of existing issue pins to display |
| `onPinAdd` | `(x: number, y: number) => void` | No | - | Callback when user adds a new pin. Coordinates are normalized (0..1) |
| `readOnly` | `boolean` | No | `false` | If true, disables tap-to-pin functionality |

## Issue Interface

```tsx
interface Issue {
  id: string;
  pinX: number;      // Normalized 0..1 (left to right)
  pinY: number;      // Normalized 0..1 (top to bottom)
  title: string;     // Issue title/description
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  type: string;      // Issue category/type
}
```

## Normalized Coordinates

The component uses normalized coordinates (0..1) for pin positions, making them device-independent:

- `pinX: 0` = left edge, `pinX: 1` = right edge
- `pinY: 0` = top edge, `pinY: 1` = bottom edge

This ensures pins appear in the same relative position regardless of:
- Screen size
- Device type (mobile/tablet/desktop)
- Image resolution
- Zoom level

### Example Coordinate Mapping

```tsx
// User taps at 300px from left, 200px from top
// Image is 1000px wide, 800px tall
// Normalized: x = 300/1000 = 0.3, y = 200/800 = 0.25

const handlePinAdd = (x: number, y: number) => {
  // x = 0.3, y = 0.25 (device-independent!)
  saveIssue({ pinX: x, pinY: y, ...otherData });
};
```

## Controls

### Desktop
- **Zoom:** Scroll wheel or +/- buttons
- **Pan:** Click and drag
- **Add Pin:** Click on blueprint (interactive mode)
- **View Info:** Hover over pins

### Mobile
- **Zoom:** Pinch gesture or +/- buttons
- **Pan:** Touch and drag
- **Add Pin:** Tap on blueprint (interactive mode)
- **View Info:** Tap and hold on pins

## Styling

The component uses Tailwind CSS and follows these design principles:

- **Priority Colors:**
  - Critical: Red (`bg-red-500`, `border-red-600`)
  - High: Orange (`bg-orange-500`, `border-orange-600`)
  - Medium: Yellow (`bg-yellow-500`, `border-yellow-600`)
  - Low: Green (`bg-green-500`, `border-green-600`)

- **Responsive Design:**
  - Minimum height: 400px
  - Adapts to container size
  - Touch-optimized controls
  - Mobile-friendly tooltips

## Demo

Visit `/blueprint-demo` to see the component in action with:
- Interactive mode example
- Read-only mode example
- Priority legend
- Feature list
- Live coordinate display

## Performance Considerations

- ✅ Images are loaded lazily
- ✅ Smooth zoom/pan transitions
- ✅ Optimized touch handling
- ✅ Minimal re-renders
- ✅ Efficient coordinate calculations

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility

- Semantic HTML structure
- ARIA labels on control buttons
- Keyboard-friendly (tab navigation)
- Screen reader compatible

## Integration Example

### With Database

```tsx
'use client';

import { useState, useEffect } from 'react';
import BlueprintViewer, { Issue } from '@/components/BlueprintViewer';

export default function WalkdownPage({ facilityId }: { facilityId: string }) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load issues from database
    fetch(`/api/facilities/${facilityId}/issues`)
      .then(res => res.json())
      .then(data => {
        setIssues(data);
        setLoading(false);
      });
  }, [facilityId]);

  const handlePinAdd = async (x: number, y: number) => {
    // Save new pin to database
    const response = await fetch(`/api/facilities/${facilityId}/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pinX: x,
        pinY: y,
        title: 'New Issue',
        priority: 'Medium',
        type: 'General',
      }),
    });
    
    const newIssue = await response.json();
    setIssues([...issues, newIssue]);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="h-screen">
      <BlueprintViewer
        blueprintUrl={`/blueprints/${facilityId}/floor-1.png`}
        existingIssues={issues}
        onPinAdd={handlePinAdd}
      />
    </div>
  );
}
```

## License

Part of the Facility Walkdown System project.
