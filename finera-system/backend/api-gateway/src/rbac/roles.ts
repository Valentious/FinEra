/**
 * FinEra RBAC - Role definitions and permission matrix
 */

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface Permission {
  resource: string;
  actions: string[];
}

export const rolePermissions: Record<Role, Permission[]> = {
  [Role.USER]: [
    { resource: '/api/v1/users/me', actions: ['GET', 'PUT'] },
    { resource: '/api/v1/users/profile', actions: ['GET', 'POST', 'PUT'] },
    { resource: '/api/v1/users/profile/*', actions: ['GET', 'PUT'] },
    { resource: '/api/v1/ledger/wallets', actions: ['GET', 'POST'] },
    { resource: '/api/v1/ledger/wallets/*', actions: ['GET'] },
    { resource: '/api/v1/credit/score', actions: ['GET'] },
    { resource: '/api/v1/credit/score/*', actions: ['GET'] },
    { resource: '/api/v1/credit/initialize', actions: [] },
    { resource: '/api/v1/notifications', actions: ['GET', 'POST'] },
  ],
  [Role.ADMIN]: [
    { resource: '/api/v1/users/*', actions: ['GET', 'PUT', 'DELETE'] },
    { resource: '/api/v1/users/profile/*', actions: ['GET', 'PUT'] },
    { resource: '/api/v1/ledger/*', actions: ['GET'] },
    { resource: '/api/v1/credit/*', actions: ['GET'] },
    { resource: '/api/v1/admin/*', actions: ['GET', 'POST', 'PUT'] },
    { resource: '/api/v1/notifications', actions: ['GET', 'POST'] },
  ],
  [Role.SUPER_ADMIN]: [
    { resource: '*', actions: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
  ],
};

/** Map DB roles (STUDENT, STAFF, ALUMNI, ADMIN, SYSTEM) to RBAC roles */
export function toRbacRole(dbRole: string): Role {
  switch (dbRole) {
    case 'ADMIN':
      return Role.ADMIN;
    case 'SYSTEM':
      return Role.SUPER_ADMIN;
    case 'STUDENT':
    case 'STAFF':
    case 'ALUMNI':
    default:
      return Role.USER;
  }
}

export function getRoleHierarchy(role: Role): Role[] {
  const hierarchy: Record<Role, Role[]> = {
    [Role.USER]: [Role.USER],
    [Role.ADMIN]: [Role.USER, Role.ADMIN],
    [Role.SUPER_ADMIN]: [Role.USER, Role.ADMIN, Role.SUPER_ADMIN],
  };
  return hierarchy[role];
}
