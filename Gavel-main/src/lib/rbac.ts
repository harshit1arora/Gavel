export type UserRole = 'admin' | 'credit_officer' | 'compliance_officer' | 'operations' | 'viewer';

export type Permission =
  | 'dashboard:view'
  | 'dashboard:edit'
  | 'applications:view'
  | 'applications:create'
  | 'applications:approve'
  | 'applications:reject'
  | 'loans:view'
  | 'loans:create'
  | 'loans:disbursement'
  | 'collections:view'
  | 'collections:edit'
  | 'compliance:view'
  | 'compliance:export'
  | 'reports:view'
  | 'reports:export'
  | 'settings:view'
  | 'settings:edit'
  | 'users:manage'
  | 'billing:view'
  | 'billing:manage'
  | 'api:access'
  | 'api:manage';

export interface RolePermissions {
  role: UserRole;
  label: string;
  description: string;
  permissions: Permission[];
}

export const ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: 'admin',
    label: 'Administrator',
    description: 'Full access to all features and settings',
    permissions: [
      'dashboard:view', 'dashboard:edit',
      'applications:view', 'applications:create', 'applications:approve', 'applications:reject',
      'loans:view', 'loans:create', 'loans:disbursement',
      'collections:view', 'collections:edit',
      'compliance:view', 'compliance:export',
      'reports:view', 'reports:export',
      'settings:view', 'settings:edit',
      'users:manage',
      'billing:view', 'billing:manage',
      'api:access', 'api:manage'
    ]
  },
  {
    role: 'credit_officer',
    label: 'Credit Officer',
    description: 'Can view and process loan applications',
    permissions: [
      'dashboard:view',
      'applications:view', 'applications:create', 'applications:approve', 'applications:reject',
      'loans:view', 'loans:create',
      'collections:view',
      'compliance:view',
      'reports:view'
    ]
  },
  {
    role: 'compliance_officer',
    label: 'Compliance Officer',
    description: 'Can view compliance reports and audit logs',
    permissions: [
      'dashboard:view',
      'applications:view',
      'loans:view',
      'collections:view',
      'compliance:view', 'compliance:export',
      'reports:view', 'reports:export'
    ]
  },
  {
    role: 'operations',
    label: 'Operations Manager',
    description: 'Can manage day-to-day operations',
    permissions: [
      'dashboard:view', 'dashboard:edit',
      'applications:view', 'applications:create',
      'loans:view', 'loans:create', 'loans:disbursement',
      'collections:view', 'collections:edit',
      'reports:view'
    ]
  },
  {
    role: 'viewer',
    label: 'Viewer',
    description: 'Read-only access to dashboards and reports',
    permissions: [
      'dashboard:view',
      'applications:view',
      'loans:view',
      'collections:view',
      'reports:view'
    ]
  }
];

export const hasPermission = (role: UserRole, permission: Permission): boolean => {
  const roleData = ROLE_PERMISSIONS.find(r => r.role === role);
  return roleData?.permissions.includes(permission) || false;
};

export const canAccessRoute = (role: UserRole, route: string): boolean => {
  const routePermissions: Record<string, Permission[]> = {
    '/dashboard': ['dashboard:view'],
    '/collections': ['collections:view'],
    '/loan-origination': ['applications:view'],
    '/compliance': ['compliance:view'],
    '/agents': ['applications:view'],
    '/portfolio': ['loans:view'],
    '/pay': ['loans:view'],
    '/settings': ['settings:view'],
    '/console': ['settings:view', 'api:access'],
    '/billing': ['billing:view'],
    '/users': ['users:manage']
  };
  
  const requiredPermission = routePermissions[route]?.[0];
  return requiredPermission ? hasPermission(role, requiredPermission) : true;
};