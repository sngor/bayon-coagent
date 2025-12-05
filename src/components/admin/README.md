# Admin Role-Based Feature Visibility

This directory contains components and utilities for implementing role-based access control (RBAC) in the admin dashboard.

## Components

### `useUserRole()` Hook

A React hook that provides access to the current user's role and permission checks.

**Location:** `src/hooks/use-user-role.tsx`

**Usage:**

```tsx
import { useUserRole } from "@/hooks/use-user-role";

function MyComponent() {
  const { role, isAdmin, isSuperAdmin, canManageRoles, isLoading } =
    useUserRole();

  if (isLoading) return <Spinner />;

  return (
    <div>
      <p>Your role: {role}</p>
      {isAdmin && <AdminFeature />}
      {isSuperAdmin && <SuperAdminFeature />}
    </div>
  );
}
```

**Return Values:**

- `role`: The user's role ('user' | 'admin' | 'superadmin')
- `isAdmin`: Boolean indicating if user has admin or superadmin access
- `isSuperAdmin`: Boolean indicating if user has superadmin access
- `canManageRoles`: Boolean indicating if user can manage roles (superadmin only)
- `isLoading`: Boolean indicating if role is still being loaded

### `RoleProtectedFeature` Component

A wrapper component that conditionally renders content based on role requirements.

**Location:** `src/components/admin/role-protected-feature.tsx`

**Usage:**

```tsx
import { RoleProtectedFeature } from '@/components/admin/role-protected-feature';

// Hide feature completely for non-SuperAdmins
<RoleProtectedFeature requiredRole="superadmin">
  <Button>Manage Roles</Button>
</RoleProtectedFeature>

// Show disabled state with tooltip
<RoleProtectedFeature
  requiredRole="superadmin"
  renderDisabled
  showTooltip
  tooltipMessage="Only SuperAdmins can access this feature"
>
  <Button>Manage Roles</Button>
</RoleProtectedFeature>

// Custom fallback content
<RoleProtectedFeature
  requiredRole="admin"
  fallback={<p>Admin access required</p>}
>
  <AdminPanel />
</RoleProtectedFeature>
```

**Props:**

- `requiredRole`: The minimum role required ('user' | 'admin' | 'superadmin')
- `children`: Content to render if user has sufficient permissions
- `fallback`: Optional content to render if user lacks permissions
- `showTooltip`: Whether to show a tooltip explaining the requirement (default: true)
- `tooltipMessage`: Custom tooltip message
- `renderDisabled`: Render children in disabled state instead of hiding (default: false)
- `className`: Custom CSS classes

### `useHasRole()` Hook

A simpler hook for checking if the user has a specific role.

**Usage:**

```tsx
import { useHasRole } from "@/components/admin/role-protected-feature";

function MyComponent() {
  const canManageRoles = useHasRole("superadmin");

  return <div>{canManageRoles && <RoleManagementPanel />}</div>;
}
```

### `PermissionDenied` Component

A pre-styled component for displaying permission denied messages.

**Usage:**

```tsx
import { PermissionDenied } from "@/components/admin/role-protected-feature";

function RestrictedPage() {
  const { isSuperAdmin, isLoading } = useUserRole();

  if (isLoading) return <Spinner />;

  if (!isSuperAdmin) {
    return (
      <PermissionDenied
        requiredRole="superadmin"
        message="This page is only accessible to SuperAdmins."
      />
    );
  }

  return <RestrictedContent />;
}
```

### `RoleBadge` Component

A visual badge component for displaying user roles.

**Location:** `src/components/admin/role-badge.tsx`

**Usage:**

```tsx
import { RoleBadge } from '@/components/admin/role-badge';

<RoleBadge role="superadmin" size="md" />
<RoleBadge role="admin" size="sm" />
<RoleBadge role="user" size="lg" />
```

## Role Hierarchy

The system uses a hierarchical role structure:

1. **SuperAdmin** (highest)

   - Full system access
   - Can manage roles (assign/revoke admin and superadmin)
   - Can access all admin features
   - Can view audit logs

2. **Admin** (middle)

   - Access to admin dashboard
   - Can manage users (view, enable/disable)
   - Cannot manage roles
   - Cannot view audit logs

3. **User** (lowest)
   - Standard platform access
   - No admin features

## Implementation Examples

### Protecting a Page

```tsx
"use client";

import { useUserRole } from "@/hooks/use-user-role";
import { PermissionDenied } from "@/components/admin/role-protected-feature";
import { Loader2 } from "lucide-react";

export default function SuperAdminPage() {
  const { isSuperAdmin, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return <PermissionDenied requiredRole="superadmin" />;
  }

  return (
    <div>
      <h1>SuperAdmin Dashboard</h1>
      {/* SuperAdmin content */}
    </div>
  );
}
```

### Conditional Feature Rendering

```tsx
"use client";

import { useUserRole } from "@/hooks/use-user-role";
import { RoleProtectedFeature } from "@/components/admin/role-protected-feature";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const { role, isSuperAdmin } = useUserRole();

  return (
    <div>
      <h1>Admin Dashboard</h1>

      {/* Always visible to admins and superadmins */}
      <Button>View Users</Button>

      {/* Only visible to superadmins */}
      <RoleProtectedFeature requiredRole="superadmin">
        <Button>Manage Roles</Button>
      </RoleProtectedFeature>

      {/* Disabled for non-superadmins with tooltip */}
      <RoleProtectedFeature
        requiredRole="superadmin"
        renderDisabled
        showTooltip
      >
        <Button>View Audit Log</Button>
      </RoleProtectedFeature>

      {/* Conditional rendering with hook */}
      {isSuperAdmin && (
        <div>
          <h2>SuperAdmin Tools</h2>
          <Button>Advanced Settings</Button>
        </div>
      )}
    </div>
  );
}
```

### Navigation Items

```tsx
import { useUserRole } from "@/hooks/use-user-role";
import { RoleProtectedFeature } from "@/components/admin/role-protected-feature";

export function AdminNavigation() {
  const { isAdmin, isSuperAdmin } = useUserRole();

  return (
    <nav>
      {/* Show for all admins */}
      {isAdmin && <NavItem href="/admin" label="Admin Dashboard" />}

      {/* Show only for superadmins */}
      <RoleProtectedFeature requiredRole="superadmin">
        <NavItem href="/admin/audit" label="Audit Log" />
      </RoleProtectedFeature>
    </nav>
  );
}
```

### Table Actions

```tsx
import { RoleProtectedFeature } from "@/components/admin/role-protected-feature";
import { Button } from "@/components/ui/button";
import { UserCog } from "lucide-react";

export function UserTableRow({ user }) {
  return (
    <TableRow>
      <TableCell>{user.name}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button size="sm">View</Button>

          {/* Only superadmins can manage roles */}
          <RoleProtectedFeature
            requiredRole="superadmin"
            renderDisabled
            showTooltip
            tooltipMessage="Only SuperAdmins can manage user roles"
          >
            <Button size="sm" variant="outline">
              <UserCog className="w-4 h-4 mr-2" />
              Manage Role
            </Button>
          </RoleProtectedFeature>
        </div>
      </TableCell>
    </TableRow>
  );
}
```

## Best Practices

1. **Always check loading state**: Before rendering role-based content, check if the role is still loading.

2. **Use the right tool for the job**:

   - Use `useUserRole()` hook for simple conditional rendering
   - Use `RoleProtectedFeature` component for wrapping UI elements
   - Use `PermissionDenied` component for full-page restrictions

3. **Provide clear feedback**: When hiding features, consider using tooltips to explain why a feature is unavailable.

4. **Server-side validation**: Always validate permissions on the server side as well. Client-side checks are for UX only.

5. **Consistent role checks**: Use the same role checking logic throughout the application (via `role-utils.ts`).

## Testing

When testing role-based features:

1. Test with all three role levels (user, admin, superadmin)
2. Test loading states
3. Test permission denied states
4. Test tooltips and disabled states
5. Verify server-side validation matches client-side checks

## Related Files

- `src/hooks/use-user-role.tsx` - Main role hook
- `src/components/admin/role-protected-feature.tsx` - Role protection components
- `src/components/admin/role-badge.tsx` - Role badge component
- `src/aws/auth/role-utils.ts` - Role utility functions
- `src/aws/dynamodb/admin-types.ts` - Type definitions
- `src/middleware.ts` - Server-side route protection
