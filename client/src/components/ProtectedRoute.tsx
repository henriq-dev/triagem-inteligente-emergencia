import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import NotFound from "@/pages/NotFound";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-mono">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login
    window.location.href = getLoginUrl();
    return null;
  }

  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    // User doesn't have required role
    return <NotFound />;
  }

  return <>{children}</>;
}
