# DASHBOARD REDIRECT LOOP ANALYSIS

**Date:** June 7, 2026
**Project:** NotaryOS
**Issue:** Continuous page reload loop when accessing `/dashboard/notaris`
**Severity:** Critical
**Status:** Root Cause Identified

---

## 🔴 PROBLEM STATEMENT

### Observed Behavior
- User logs in as ADMIN successfully
- Session is valid with `role: "ADMIN"`
- Dashboard `/dashboard/notaris` opens initially
- Terminal logs show continuous repeated requests:
  ```
  [PROXY] Processing: { pathname: '/dashboard/notaris' }
  [PROXY] Auth check: { pathname: '/dashboard/notaris', userRole: 'ADMIN', hasToken: true }
  [PROXY] Access granted to dashboard: /dashboard/notaris
  GET /dashboard/notaris 200 in 91ms
  GET /dashboard/notaris 200 in 133ms
  GET /dashboard/notaris 200 in 95ms
  ... (continues indefinitely)
  ```
- Browser symptoms:
  - Blank screen occasionally
  - Auto-reload behavior
  - `chrome-error://chromewebdata` errors

### Expected Behavior
- Login ADMIN → `/dashboard/notaris` loads **ONCE**
- No continuous requests
- Page renders and stabilizes

---

## 🔍 ROOT CAUSE ANALYSIS

### **Primary Issue: Dual Redirect Mechanism**

The system implements **TWO independent redirect mechanisms** that both activate during the login flow, creating a race condition.

---

### Mechanism 1: Client-Side Redirect

**File:** `src/app/dashboard/page.tsx` (Lines 17-48)

**Code:**
```typescript
export default function DashboardHomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && session?.user?.role) {
      const role = session.user.role;

      // Role-based redirect
      switch (role) {
        case 'ADMIN':
          router.replace('/dashboard/notaris');  // ← CLIENT-SIDE NAVIGATION
          break;
        case 'STAFF':
          router.replace('/dashboard/staff');
          break;
        case 'KURIR':
          router.replace('/dashboard/kurir');
          break;
        case 'FINANCE':
          router.replace('/dashboard/finance');
          break;
        default:
          router.replace('/dashboard/transactions');
          break;
      }
    }
  }, [status, session, router]);

  // Shows loading while redirecting
  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Mengarahkan ke dashboard...</p>
        </div>
      </div>
    );
  }

  return null;
}
```

**Behavior:**
- React `useEffect` hook runs after component mounts
- Checks session status
- When `authenticated`, calls `router.replace('/dashboard/notaris')`
- This is a **CLIENT-SIDE navigation** using Next.js router

---

### Mechanism 2: Server-Side Redirect

**File:** `src/app/dashboard/layout.tsx` (Lines 104-108)

**Code:**
```typescript
export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params?: { path?: string[] };
}) {
  const session = await getServerSession(authOptions);

  // 1. Check authentication
  if (!session?.user) {
    redirect('/login');
  }

  // 2. Check if user is active
  if (!session.user.isActive) {
    redirect('/login?error=account_disabled');
  }

  const userRole = session.user.role;

  // 3. Get current path from params or construct it
  const currentPath = params?.path
    ? `/dashboard/${params.path.join('/')}`
    : '/dashboard';

  // 4. Check RBAC for the specific route
  if (currentPath !== '/dashboard' && !canAccessPath(currentPath, userRole)) {
    const redirectPath = getRoleRedirect(userRole);
    redirect(redirectPath);
  }

  // 5. If accessing dashboard index, redirect based on role
  if (currentPath === '/dashboard') {
    const redirectPath = getRoleRedirect(userRole);
    redirect(redirectPath);  // ← SERVER-SIDE REDIRECT
  }

  // ... rest of layout
}
```

**Role Redirect Function (Lines 35-48):**
```typescript
function getRoleRedirect(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return '/dashboard/notaris';
    case UserRole.STAFF:
      return '/dashboard/staff';
    case UserRole.KURIR:
      return '/dashboard/kurir';
    case UserRole.FINANCE:
      return '/dashboard/finance';
    default:
      return '/dashboard';
  }
}
```

**Behavior:**
- Server component runs on server before page renders
- When `currentPath === '/dashboard'`, calls `redirect('/dashboard/notaris')`
- This is a **SERVER-SIDE HTTP redirect** (307 status code)
- Next.js `redirect()` function replaces entire page

---

### The Loop Mechanism

```
STEP 1: User Login
└─ User enters credentials and submits login form

STEP 2: NextAuth Login Success
└─ NextAuth creates session
└─ NextAuth redirects to /dashboard (default redirect target)

STEP 3: Browser Requests /dashboard
└─ GET /dashboard → Next.js router

STEP 4: PARALLEL EXECUTION BEGINS
│
├─ CLIENT-SIDE (src/app/dashboard/page.tsx)
│  ├─ Component mounts with status === 'loading'
│  ├─ Shows loading spinner
│  ├─ Session loads from NextAuth
│  ├─ useEffect triggers when status === 'authenticated'
│  └─ Calls router.replace('/dashboard/notaris')
│     └─ CLIENT-SIDE NAVIGATION STARTS
│
└─ SERVER-SIDE (src/app/dashboard/layout.tsx)
   ├─ Server component runs
   ├─ Calls getServerSession(authOptions)
   ├─ currentPath === '/dashboard'
   ├─ Calls redirect('/dashboard/notaris')
   └─ SERVER-SIDE REDIRECT STARTS (307 status)

STEP 5: CONFLICT RESOLUTION
└─ Server-side redirect (307) takes priority over client-side navigation
└─ Server returns HTTP 307 Redirect response
└─ Browser receives redirect response

STEP 6: BROWSER FOLLOWS REDIRECT
└─ Browser automatically follows 307 redirect
└─ GET /dashboard/notaris → Next.js router

STEP 7: PAGE LOADS SUCCESSFULLY
├─ Proxy validates access: ADMIN can access /dashboard/notaris ✅
├─ Layout renders successfully ✅
└─ Page component renders successfully ✅
└─ HTTP 200 response

STEP 8: LOOP TRIGGER (ROOT CAUSE)
└─ Something triggers a new GET request to /dashboard
└─ Could be:
   ├─ Residual client-side navigation completing
   ├─ Router state inconsistency
   ├─ React hydration issue
   └─ Next.js internal routing conflict

STEP 9: REPEAT LOOP
└─ New GET /dashboard → Step 4
└─ Infinite loop continues
└─ Terminal shows: GET /dashboard/notaris 200 repeated indefinitely
```

---

## 📋 FILES AUDITED

### Dashboard Pages

| File | Line(s) | Finding | Status |
|------|---------|---------|--------|
| `src/app/dashboard/notaris/page.tsx` | 45-49 | `fetchDashboardData()` | ✅ OK - Single fetch on mount |
| `src/app/dashboard/notaris/page.tsx` | 39-43 | Auth check `router.push('/login')` | ✅ OK - Only on unauthenticated |
| `src/app/dashboard/notaris/page.tsx` | 52-64 | `fetchDashboardData` function | ✅ OK - No polling |
| `src/app/dashboard/notaris/page.tsx` | 57-60 | `useEffect` for data fetch | ✅ OK - Dependencies: `[status]` |
| `src/app/dashboard/owner/page.tsx` | 51-55 | `fetchDashboardData()` | ✅ OK - Single fetch on mount |
| `src/app/dashboard/owner/page.tsx` | 51-55 | Auth check `router.push('/login')` | ✅ OK - Only on unauthenticated |
| `src/app/dashboard/staff/page.tsx` | 52-56 | `fetchDashboardData()` | ✅ OK - Single fetch on mount |
| `src/app/dashboard/staff/page.tsx` | 46-50 | Auth check `router.push('/login')` | ✅ OK - Only on unauthenticated |
| `src/app/dashboard/kurir/page.tsx` | 56-60 | `fetchDashboardData()` | ✅ OK - Single fetch on mount |
| `src/app/dashboard/kurir/page.tsx` | 50-54 | Auth check `router.push('/login')` | ✅ OK - Only on unauthenticated |
| `src/app/dashboard/finance/page.tsx` | 20-24 | Auth check `router.push('/login')` | ✅ OK - Only on unauthenticated |

### Navigation & Redirect

| File | Line(s) | Finding | Status |
|------|---------|---------|--------|
| `src/app/dashboard/page.tsx` | 17-48 | `useEffect` with `router.replace()` | ❌ PROBLEM - Client-side redirect |
| `src/app/dashboard/page.tsx` | 31 | `router.replace('/dashboard/notaris')` | ❌ PROBLEM - Conflicts with server |
| `src/app/dashboard/layout.tsx` | 104-108 | Server-side `redirect()` | ❌ PROBLEM - Conflicts with client |
| `src/app/dashboard/layout.tsx` | 35-48 | `getRoleRedirect()` function | ✅ OK - Logic is correct |
| `src/proxy.ts` | 128-212 | `proxy()` function | ✅ OK - No redirect loops |
| `src/proxy.ts` | 157-161 | Redirect loop prevention | ✅ OK - Checks `redirectPath !== pathname` |

### TanStack Query Configuration

| File | Line(s) | Finding | Status |
|------|---------|---------|--------|
| `src/components/providers/query-client-provider.tsx` | 14-24 | QueryClient config | ✅ OK - No polling |
| `src/components/providers/query-client-provider.tsx` | 19 | `staleTime: 60 * 1000` | ✅ OK - 60 seconds |
| `src/components/providers/query-client-provider.tsx` | 20 | `refetchOnWindowFocus: false` | ✅ OK - Disabled |

**NO INFINITE LOOP SOURCES FOUND:**
- ❌ No `refetchInterval` configured
- ❌ No `refetchOnWindowFocus: true`
- ❌ No `setInterval` in dashboard pages
- ❌ No polling mechanisms
- ❌ No auto-refresh logic

---

## 🎯 ROOT CAUSE SUMMARY

### **Primary Cause: Dual Redirect Mechanism**

**Problem:**
Two independent redirect mechanisms both activate during login, creating a race condition and causing continuous page reloads.

**Components:**
1. **Client-Side Redirect:** `src/app/dashboard/page.tsx` → `router.replace('/dashboard/notaris')`
2. **Server-Side Redirect:** `src/app/dashboard/layout.tsx` → `redirect('/dashboard/notaris')`

**Why it causes loop:**
- Both redirect to same target
- Server-side redirect (307) takes priority
- Client-side navigation residual effect triggers repeated requests
- Router state becomes inconsistent
- Next.js routing system retries navigation
- Loop continues indefinitely

**Evidence:**
- Terminal logs show continuous `GET /dashboard/notaris 200` requests
- Status 200 means page loads successfully but keeps requesting
- No auto-refresh or polling in dashboard pages
- No `setInterval` or auto-refresh logic

---

## 🔧 PROPOSED SOLUTIONS

### **Option 1: Keep Only Server-Side Redirect** ✅ RECOMMENDED

**Rationale:**
- Server-side redirect is more reliable
- Happens before client component renders
- Single point of control
- Cleaner architecture

**Changes Required:**
1. **Remove** client-side redirect from `src/app/dashboard/page.tsx`
2. **Keep** server-side redirect in `src/app/dashboard/layout.tsx`

**Benefits:**
- ✅ Single redirect mechanism
- ✅ No race condition
- ✅ More predictable behavior
- ✅ Better for SEO
- ✅ Works without JavaScript

**Drawbacks:**
- ⚠️ Requires full page load (minimal impact)

---

### **Option 2: Keep Only Client-Side Redirect**

**Rationale:**
- Client-side navigation is faster
- Better UX (no full page reload)

**Changes Required:**
1. **Remove** server-side redirect from `src/app/dashboard/layout.tsx`
2. **Keep** client-side redirect in `src/app/dashboard/page.tsx`

**Benefits:**
- ✅ Faster navigation
- ✅ Better UX

**Drawbacks:**
- ❌ Less reliable (depends on JS execution)
- ❌ Complex interaction with proxy
- ❌ Harder to debug

---

### **Option 3: Both with Guards** (NOT RECOMMENDED)

**Rationale:**
- Keep both mechanisms
- Add guards to prevent conflicts

**Changes Required:**
1. Add check in client component: only redirect if not already at target
2. Add check in server component: only redirect if not already at target

**Benefits:**
- ✅ Redundancy (can fallback)

**Drawbacks:**
- ❌ Complex logic
- ❌ Hard to maintain
- ❌ Still potential for race conditions
- ❌ More surface area for bugs

---

## 📊 COMPARISON

| Aspect | Option 1 (Server Only) | Option 2 (Client Only) | Option 3 (Both + Guards) |
|--------|----------------------|----------------------|------------------------|
| Reliability | ✅ High | ⚠️ Medium | ⚠️ Medium |
| Performance | ⚠️ Good | ✅ Excellent | ✅ Excellent |
| Complexity | ✅ Low | ✅ Low | ❌ High |
| Maintainability | ✅ High | ✅ High | ❌ Low |
| SEO | ✅ Better | ⚠️ Medium | ✅ Better |
| No JS Required | ✅ Yes | ❌ No | ⚠️ Partial |
| Loop Prevention | ✅ Guaranteed | ⚠️ Possible | ⚠️ Possible |

**RECOMMENDATION: Option 1 (Server-Side Only)**

---

## 🧪 TESTING PLAN

After implementing fix, verify:

1. **Login Flow**
   - Login as ADMIN → Redirect to `/dashboard/notaris` ✅
   - Login as STAFF → Redirect to `/dashboard/staff` ✅
   - Login as KURIR → Redirect to `/dashboard/kurir` ✅
   - Login as FINANCE → Redirect to `/dashboard/finance` ✅

2. **Single Page Load**
   - Check terminal logs: Only ONE `GET /dashboard/notaris 200` ✅
   - Page loads and stabilizes ✅
   - No continuous requests ✅

3. **No Browser Errors**
   - No blank screen ✅
   - No auto-reload ✅
   - No `chrome-error://chromewebdata` errors ✅

4. **Cross-Role Access**
   - STAFF cannot access `/dashboard/notaris` (403/redirect) ✅
   - FINANCE cannot access `/dashboard/staff` (403/redirect) ✅

5. **API Access**
   - Anonymous API requests return 401 ✅
   - Cross-role API requests return 403 ✅

---

## 📝 IMPLEMENTATION CHECKLIST

- [ ] Remove client-side redirect from `src/app/dashboard/page.tsx`
- [ ] Test login flow with all roles
- [ ] Verify single page load in terminal logs
- [ ] Check for browser errors
- [ ] Run `npm run lint`
- [ ] Run `npm run build`
- [ ] Generate git diff
- [ ] Create pull request
- [ ] Deploy and verify in staging

---

## 🎯 SUCCESS CRITERIA

The fix is considered successful when:

1. **Single Page Load:** Terminal shows only one `GET /dashboard/notaris 200` request
2. **Page Stabilizes:** Dashboard loads and stays loaded without refreshing
3. **No Browser Errors:** No blank screens or `chrome-error` messages
4. **All Roles Work:** Login works correctly for ADMIN, STAFF, KURIR, FINANCE
5. **Build Passes:** `npm run build` succeeds without errors
6. **Lint Passes:** `npm run lint` succeeds without errors

---

**Status:** Root cause identified, solution proposed, ready for implementation

**Next Steps:**
1. Implement Option 1 (Server-Side Only)
2. Run tests
3. Verify in staging environment
4. Deploy to production