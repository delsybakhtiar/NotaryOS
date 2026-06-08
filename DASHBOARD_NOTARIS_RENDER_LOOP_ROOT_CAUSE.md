# DASHBOARD_NOTARIS_RENDER_LOOP_ROOT_CAUSE

**Date:** 2025-06-08
**Status:** INVESTIGATION IN PROGRESS
**Commit Context:** d0118b9 (Dual redirect mechanism fix)

---

## EXECUTIVE SUMMARY

The continuous `GET /dashboard/notaris 200` requests in the terminal logs indicate a **render loop** issue. This investigation follows a systematic 7-step audit to identify the root cause.

**NOTE:** Debug logs have been added to track the render chain. Login as ADMIN and observe the console/terminal logs to capture the evidence.

---

## STEP 1: AUDIT - src/app/dashboard/notaris/page.tsx

### useEffect Hooks Found:

**Effect 1 - Auth Check (Lines 41-46):**
```typescript
useEffect(() => {
  console.log('NOTARIS_EFFECT_1 - Auth Check');
  if (status === 'unauthenticated') {
    router.push('/login');
  }
}, [status, router]);  // ⚠️ router in dependency array
```

**Effect 2 - Fetch Data (Lines 48-53):**
```typescript
useEffect(() => {
  console.log('NOTARIS_EFFECT_2 - Fetch Data', { status });
  if (status === 'authenticated') {
    fetchDashboardData();  // Sets loading state
  }
}, [status]);  // ⚠️ Only depends on status
```

### State Variables:
- `stats` - Dashboard statistics
- `loading` - Loading state (toggled by fetchDashboardData)

### Fetch Found:
```typescript
const fetchDashboardData = async () => {
  console.log('NOTARIS_FETCH - Fetching dashboard data');
  try {
    setLoading(true);  // ⚠️ Triggers re-render
    const response = await fetch('/api/dashboard/notaris');
    const data = await response.json();

    if (data.success) {
      setStats(data.data);  // ⚠️ Triggers re-render
    }
  } catch (error) {
    console.error('NOTARIS_FETCH - Error:', error);
  } finally {
    setLoading(false);  // ⚠️ Triggers re-render
  }
};
```

### Potential Issues Identified:

1. **Loading state causes early return:**
   ```typescript
   if (status === 'loading' || loading) {
     console.log('NOTARIS_RENDER - Loading state', { status, loading });
     return <Spinner />;
   }
   ```
   - When `loading` changes from `true` → `false`, component re-renders
   - But the data is already fetched, so should not loop

2. **No obvious infinite loop in useEffect:**
   - Effect 2 only runs when `status` changes
   - Once `status` is "authenticated", effect should not re-run

---

## STEP 2: AUDIT - Components Imported by notaris/page.tsx

### Imported Components:
- `Card, CardContent, CardDescription, CardHeader, CardTitle` (UI components)
- `Badge` (UI component)
- `FileText, Clock, AlertTriangle, CheckCircle2, PenTool, Users, Activity` (Lucide icons)
- `Link` (Next.js)

### Audit Results:
- ✅ No `setInterval` or `setTimeout` found
- ✅ No `router.refresh` found
- ✅ No `invalidateQueries` or `refetch` found
- ✅ No automated polling found
- **Conclusion:** Imported components are stateless UI components - NOT causing the loop

---

## STEP 3: AUDIT - src/app/dashboard/layout.tsx

### redirect() Calls Found:

1. **Line 82-83:** No session → `/login`
   ```typescript
   if (!session?.user) {
     console.log('[DASHBOARD_LAYOUT] No session, redirecting to login');
     redirect('/login');
   }
   ```

2. **Line 86-87:** User inactive → `/login?error=account_disabled`
   ```typescript
   if (!session.user.isActive) {
     redirect('/login?error=account_disabled');
   }
   ```

3. **Line 104-105:** RBAC denied → Role-based redirect
   ```typescript
   if (currentPath !== '/dashboard' && !canAccessPath(currentPath, userRole)) {
     const redirectPath = getRoleRedirect(userRole);
     console.log('[DASHBOARD_LAYOUT] RBAC redirect:', { currentPath, userRole, redirectPath });
     redirect(redirectPath);
   }
   ```

4. **Line 110-111:** Dashboard index → Role-based redirect
   ```typescript
   if (currentPath === '/dashboard') {
     const redirectPath = getRoleRedirect(userRole);
     console.log('[DASHBOARD_LAYOUT] Index redirect:', { currentPath, userRole, redirectPath });
     redirect(redirectPath);
   }
   ```

### Session Usage:
- Uses `getServerSession(authOptions)` - **server-side**
- Uses `redirect()` - **server-side, non-recurring**

### Potential Issues:

**⚠️ CRITICAL FINDING - Line 91-92:**
```typescript
// params.path will be undefined for /dashboard route
const currentPath = params?.path
  ? `/dashboard/${params.path.join('/')}`
  : '/dashboard';
```

The layout receives `params` for `/dashboard/[...path]` routes.
- For `/dashboard/notaris`, params.path should be `['notaris']`
- For `/dashboard`, params.path should be undefined

**However**, in Next.js 16 App Router:
- The layout might be rendered differently
- The `params` structure might not match expectations

---

## STEP 4: AUDIT - TanStack Query Global Configuration

### File: src/components/providers/query-client-provider.tsx

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,           // 60 seconds
      refetchOnWindowFocus: false,   // ✅ Disabled
    },
  },
});
```

### Audit Results:
- ✅ `refetchOnWindowFocus: false` - No window focus refetch
- ✅ `staleTime: 60s` - Reasonable cache duration
- ✅ No `refetchInterval` - No polling
- ✅ No `refetchOnReconnect` - No reconnect refetch
- **Conclusion:** Query configuration is NOT causing the loop

---

## STEP 5: AUDIT - All Dashboard Hooks

### Grep Results for useQuery/invalidateQueries/refetch/router.refresh:

**Found in:**
- `src/app/dashboard/transactions/page.tsx` - Manual `refetch()` on button click (user-triggered)
- `src/app/dashboard/transactions/[id]/page.tsx` - Manual `refetch()` after mutations (user-triggered)
- `src/app/dashboard/clients/[id]/kyc/kyc-review-form.tsx` - `setTimeout(() => router.refresh())` after KYC review

### Audit Results:
- ✅ All `refetch()` calls are user-triggered (button clicks)
- ✅ `router.refresh()` is only called after user action (KYC review)
- ✅ No polling or automatic refetch found
- **Conclusion:** These are NOT causing the continuous loop

---

## STEP 6: TEMPORARY DEBUG LOGS ADDED

### Debug Log Locations:

**src/app/dashboard/notaris/page.tsx:**
- `NOTARIS_PAGE_RENDER` - On every component render
- `NOTARIS_EFFECT_1` - On auth check effect
- `NOTARIS_EFFECT_2` - On fetch data effect
- `NOTARIS_FETCH` - On API fetch
- `NOTARIS_RENDER - Loading state` - When showing loading spinner
- `NOTARIS_RENDER - No session` - When no session
- `NOTARIS_RENDER - Rendering dashboard` - When rendering actual content

**src/app/dashboard/layout.tsx:**
- `DASHBOARD_LAYOUT` - On layout render
- `DASHBOARD_LAYOUT - No session` - When redirecting to login
- `DASHBOARD_LAYOUT - Index redirect` - When redirecting from /dashboard
- `DASHBOARD_LAYOUT - RBAC redirect` - When redirecting due to RBAC

**src/proxy.ts:**
- `PROXY` - With timestamp for every request

---

## STEP 7: WAITING FOR LOG EVIDENCE

### Required Logs:
1. **Terminal logs** showing:
   - `[PROXY] Processing:` with timestamps
   - `[DASHBOARD_LAYOUT]` messages
   - Console render counts

2. **Browser console** showing:
   - `NOTARIS_PAGE_RENDER` count
   - `NOTARIS_EFFECT_1` and `NOTARIS_EFFECT_2` calls
   - `NOTARIS_FETCH` calls
   - Any error messages

### How to Collect:
1. Login as ADMIN user
2. Navigate to `/dashboard`
3. Observe the redirect to `/dashboard/notaris`
4. Capture 30 seconds of terminal output
5. Capture 30 seconds of browser console output
6. Copy logs to this file

---

## PRELIMINARY ANALYSIS

### Possible Root Causes (NEED EVIDENCE):

#### Hypothesis 1: Next.js Layout Re-render Loop
- The dashboard layout might be re-rendering continuously
- Server components in Next.js 16 with certain patterns can cause loops
- Need log evidence: Count of `DASHBOARD_LAYOUT` renders

#### Hypothesis 2: useSession State Oscillation
- The `useSession()` hook might be cycling between states
- Session provider might be causing re-renders
- Need log evidence: Sequence of `NOTARIS_EFFECT_1` and `NOTARIS_EFFECT_2`

#### Hypothesis 3: API Route Triggering Layout Reload
- The `/api/dashboard/notaris` fetch might somehow trigger a layout reload
- Response format might cause issue
- Need log evidence: Correlation between `NOTARIS_FETCH` and `DASHBOARD_LAYOUT`

#### Hypothesis 4: NextAuth Session Polling
- NextAuth might be internally polling for session updates
- This might trigger re-renders of components using `useSession()`
- Need log evidence: Check if requests align with session polling intervals

#### Hypothesis 5: React StrictMode (DOUBLE RENDER)
- `reactStrictMode: false` in next.config.ts - ✅ Already disabled
- Should not be causing double renders
- Still need log evidence to confirm

#### Hypothesis 6: Browser Extension Interference
- Extensions might be causing repeated requests
- Need log evidence: Check if requests happen without user interaction

---

## NEXT STEPS

1. **Login as ADMIN and capture logs**
   - Open browser dev console
   - Navigate to `/dashboard`
   - Capture 60 seconds of logs

2. **Analyze log patterns**
   - Look for repeating sequences
   - Identify which component/function is called repeatedly
   - Correlate timing between different logs

3. **Implement fix based on evidence**
   - Wait for root cause to be PROVEN with logs
   - Do NOT claim fixed until evidence shows resolution

---

## EVIDENCE SECTION

### Terminal Logs (Capture Here):

```
[PASTE YOUR TERMINAL LOGS HERE]
```

### Browser Console Logs (Capture Here):

```
[PASTE YOUR BROWSER CONSOLE LOGS HERE]
```

---

## ROOT CAUSE (TO BE FILLED AFTER EVIDENCE)

**Status:** PENDING EVIDENCE

**Root Cause:** [TO BE DETERMINED]

**File:** [TO BE DETERMINED]

**Line Number:** [TO BE DETERMINED]

**Why GET /dashboard/notaris Continues:** [TO BE DETERMINED]

**Fix to Apply:** [TO BE DETERMINED]

---

## FOOTNOTES

### Why Previous Analysis Was Incomplete:

1. **Assumed redirect loop was the issue**
   - The dual redirect fix (commit d0118b9) addressed the 307 redirect loop
   - But continuous 200 GET requests continued

2. **Did not add debug logs**
   - Without logs, could not see actual render/redirect sequence
   - Debug logs now added to track exact flow

3. **Focused on client-side only**
   - Did not fully audit server-side layout rendering
   - Did not consider Next.js 16 layout behavior

4. **Missing session provider audit**
   - Need to verify if NextAuth is polling
   - Need to verify session stability

### Files Modified for Debugging:

1. `src/app/dashboard/notaris/page.tsx` - Added console.log statements
2. `src/app/dashboard/layout.tsx` - Added console.log statements
3. `src/proxy.ts` - Added timestamp to logs

### Note on Proxy Configuration:

The `src/proxy.ts` file exports a `proxy` function as required by Next.js 16.
Previous error about middleware.ts was resolved by renaming to proxy.ts.

---

**END OF INVESTIGATION REPORT**
**Awaiting log evidence to determine root cause.**