import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Allowed roles. If empty, any authenticated user is allowed. */
  roles?: string[];
  /** Where to redirect if unauthorized (default: '/') */
  fallback?: string;
}

/**
 * Wraps a route so only users with matching roles can access it.
 * Must be used inside an already-authenticated layout (AppLayout handles the
 * top-level token check; ProtectedRoute handles fine-grained role checks).
 */
export function ProtectedRoute({ children, roles = [], fallback = '/' }: ProtectedRouteProps) {
  const user = useAuthStore((s) => s.user);

  // No role restriction — any authenticated user allowed
  if (roles.length === 0) return <>{children}</>;

  // User object not loaded (shouldn't happen inside AppLayout, but be safe)
  if (!user) return <Navigate to="/login" replace />;

  // Check role
  if (!roles.includes(user.role)) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}

/** Convenience wrappers */
export const AdminOnly = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute roles={['admin', 'financial_manager', 'CFO']}>{children}</ProtectedRoute>
);

export const ManagerOnly = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute roles={['admin', 'financial_manager', 'CFO', 'operations_staff']}>{children}</ProtectedRoute>
);
