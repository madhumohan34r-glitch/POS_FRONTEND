// import { Navigate } from 'react-router-dom';
// import { useAuthStore, UserRole } from '@/lib/auth-store';

// interface ProtectedRouteProps {
//   children: React.ReactNode;
//   allowedRoles: UserRole[];
// }

// const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
//   const { user, isAuthenticated } = useAuthStore();

//   if (!isAuthenticated || !user) {
//     return <Navigate to="/login" replace />;
//   }

//  if (!allowedRoles.includes(user.role)) {
//   return <Navigate to="/unauthorized" replace />;
// }
//   return <>{children}</>;
// };

// export default ProtectedRoute;


// import { Navigate } from 'react-router-dom';
// import { useAuthStore, UserRole } from '@/lib/auth-store';

// interface ProtectedRouteProps {
//   children: React.ReactNode;
//   allowedRoles: UserRole[];
// }

// const ProtectedRoute = ({
//   children,
//   allowedRoles,
// }: ProtectedRouteProps) => {

//   const { user, isAuthenticated } = useAuthStore();

//   console.log("========== PROTECTED ROUTE ==========");
//   console.log("Authenticated:", isAuthenticated);
//   console.log("User:", user);
//   console.log("User Role:", user?.role);
//   console.log("Allowed Roles:", allowedRoles);
//   console.log("=====================================");

//   if (!isAuthenticated || !user) {
//     return <Navigate to="/login" replace />;
//   }

//   const currentRole = String(user.role).trim().toLowerCase();

//   const allowed = allowedRoles.some(
//     (role) => String(role).trim().toLowerCase() === currentRole
//   );

//   if (!allowed) {
//     return <Navigate to="/unauthorized" replace />;
//   }

//   return <>{children}</>;
// };

// export default ProtectedRoute;

import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isAuthenticated } = useAuth();

  console.log("========== PROTECTED ROUTE ==========");
  console.log("Authenticated:", isAuthenticated);
  console.log("User:", user);
  console.log("User Role:", user?.role);
  console.log("Allowed Roles:", allowedRoles);
  console.log("=====================================");

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const currentRole = String(user.role).trim().toLowerCase();

  const allowed = allowedRoles.some(
    (role) => String(role).trim().toLowerCase() === currentRole
  );

  if (!allowed) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;