# Testing Guide

This document provides comprehensive testing guidelines for the Facility Walkdown System.

## Table of Contents
- [Pre-Testing Setup](#pre-testing-setup)
- [Functional Testing](#functional-testing)
- [Offline Functionality Testing](#offline-functionality-testing)
- [Mobile Testing](#mobile-testing)
- [Performance Testing](#performance-testing)
- [Known Issues](#known-issues)

## Pre-Testing Setup

### 1. Environment Setup
```bash
# Install dependencies
npm install

# Setup database
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate

# Start development server
npm run dev
```

### 2. Create Test Data
1. Create an admin user via `/api/create-admin`
2. Login at `/auth/signin`
3. Create test buildings, floors, and rooms via `/admin/buildings`

## Functional Testing

### Authentication
- [ ] Login with valid credentials succeeds
- [ ] Login with invalid credentials fails with error message
- [ ] Session persists across page refreshes
- [ ] Logout clears session properly

### Building Management (Admin)
- [ ] Create new building with required fields
- [ ] Upload blueprint for floor
- [ ] Create rooms within floors
- [ ] Edit building/floor/room details
- [ ] Validation prevents empty required fields

### Walkdown Creation
- [ ] Create new walkdown session
- [ ] Select building and floor
- [ ] Walkdown appears in list after creation
- [ ] Walkdown status shows as "Draft"

### Issue Management
- [ ] Add issue to walkdown
- [ ] Upload photo with issue
- [ ] Select room, type, and priority
- [ ] Description validation (minimum 10 characters)
- [ ] Issue appears in walkdown detail view
- [ ] Issue displays correct priority color badge

### PDF Report Generation
- [ ] Generate PDF report from walkdown
- [ ] PDF downloads with correct filename
- [ ] PDF contains all issues with photos
- [ ] PDF includes sign-off boxes

## Offline Functionality Testing

### Testing Offline Mode

**Method 1: Browser DevTools**
1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Check "Offline" checkbox
4. Test functionality

**Method 2: Application Tab**
1. Open Chrome DevTools (F12)
2. Go to Application tab > Service Workers
3. Check "Offline" checkbox

### Offline Tests
- [ ] Add issue while offline
- [ ] Photo uploads queued when offline
- [ ] Offline indicator shows in UI
- [ ] Sync status shows pending count
- [ ] Data persists in IndexedDB
- [ ] Going back online triggers auto-sync
- [ ] Manual sync button works
- [ ] Failed syncs show error notification
- [ ] Synced items marked correctly

### IndexedDB Verification
1. Open DevTools > Application > IndexedDB
2. Expand "WalksDatabase"
3. Verify issues table contains offline data
4. Check `synced` field (0 = unsynced, 1 = synced)

## Mobile Testing

### Responsive Design
Test on various screen sizes:
- [ ] Phone (375px width)
- [ ] Tablet (768px width)
- [ ] Desktop (1024px+ width)

### Touch Interactions
- [ ] All buttons are at least 44x44px (iOS guideline)
- [ ] Touch targets don't overlap
- [ ] Swipe gestures work smoothly
- [ ] Pull-to-refresh works on list pages
- [ ] Photo capture from camera works
- [ ] Photo selection from gallery works

### Mobile-Specific Features
- [ ] PWA installs on home screen
- [ ] App works in standalone mode
- [ ] Orientation lock works in portrait
- [ ] Status bar color matches theme
- [ ] Keyboard doesn't obscure inputs
- [ ] Forms are accessible with mobile keyboard

### Testing on Real Devices
**iOS (Safari)**
```
1. Open Safari on iPhone/iPad
2. Navigate to app URL
3. Tap Share button
4. Tap "Add to Home Screen"
5. Open from home screen
6. Test all functionality
```

**Android (Chrome)**
```
1. Open Chrome on Android device
2. Navigate to app URL
3. Tap menu (3 dots)
4. Tap "Add to Home Screen"
5. Open from home screen
6. Test all functionality
```

## Performance Testing

### Load Time
- [ ] Initial page load < 3 seconds
- [ ] Subsequent navigations < 1 second
- [ ] Images load progressively
- [ ] No layout shifts during load

### Large Data Sets
- [ ] List 100+ walkdowns without lag
- [ ] Display walkdown with 50+ issues
- [ ] Handle multiple photo uploads
- [ ] Smooth scrolling on long lists

### Memory Usage
1. Open DevTools > Performance
2. Start recording
3. Navigate through app
4. Check memory usage stays stable
5. No memory leaks on repeated actions

## Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS 14+)
- [ ] Mobile Chrome (Android 8+)

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Enter/Space activates buttons
- [ ] Escape closes dialogs
- [ ] Focus visible on all elements
- [ ] Focus trap works in dialogs

### Screen Reader
Test with screen readers:
- [ ] VoiceOver (macOS/iOS)
- [ ] NVDA (Windows)
- [ ] TalkBack (Android)

Check:
- [ ] All images have alt text
- [ ] Form fields have labels
- [ ] Buttons have descriptive text
- [ ] Error messages are announced
- [ ] Loading states are announced

## Error Handling

### Network Errors
- [ ] Graceful handling of network failures
- [ ] Error notifications display
- [ ] Retry mechanisms work
- [ ] Fallback to offline mode

### Validation Errors
- [ ] Field-level validation shows inline
- [ ] Form-level validation prevents submission
- [ ] Error messages are clear and helpful
- [ ] Errors clear when fixed

### Crash Recovery
- [ ] App recovers from JavaScript errors
- [ ] Error boundary shows fallback UI
- [ ] Refresh button works after error
- [ ] No data loss on crash

## Security Testing

- [ ] Authentication required for protected routes
- [ ] Session timeout works correctly
- [ ] CSRF protection enabled
- [ ] File upload size limits enforced
- [ ] SQL injection prevented (Prisma ORM)
- [ ] XSS prevented (React escaping)

## Known Issues

Document any known issues here:

### Issue Template
```
**Issue**: Brief description
**Severity**: Low/Medium/High/Critical
**Steps to Reproduce**: 
1. Step 1
2. Step 2
3. Step 3
**Expected**: What should happen
**Actual**: What actually happens
**Workaround**: How to work around the issue (if any)
**Status**: Open/In Progress/Fixed
```

## Test Checklist Summary

### Quick Smoke Test (5 minutes)
- [ ] Login works
- [ ] Create walkdown
- [ ] Add issue with photo
- [ ] View walkdown list
- [ ] Generate PDF
- [ ] Test offline mode
- [ ] Check mobile view

### Full Regression Test (30 minutes)
- [ ] All functional tests
- [ ] Offline functionality
- [ ] Mobile responsive
- [ ] Performance checks
- [ ] Error handling

### Pre-Release Test (1 hour)
- [ ] Full regression test
- [ ] Browser compatibility
- [ ] Accessibility audit
- [ ] Security review
- [ ] Performance benchmarks
- [ ] Real device testing

## Reporting Bugs

When reporting bugs, include:
1. Environment (browser, OS, device)
2. Steps to reproduce
3. Expected vs actual behavior
4. Screenshots/videos
5. Console errors (if any)
6. Network logs (if relevant)

## Automated Testing

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

### Writing Tests
Place tests in `__tests__` directories or `.test.ts(x)` files.

Example:
```typescript
describe('SyncManager', () => {
  it('should sync unsynced issues', async () => {
    // Test implementation
  })
})
```

## Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Pre-deployment

Check CI status before merging changes.
