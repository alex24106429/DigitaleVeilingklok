import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/user';
import { ReactNode } from 'react';
import ErrorPage from './ErrorPage';

interface ProtectedRouteProps {
	children: ReactNode;
	allowedRoles?: UserRole[];
}
// voor login authentication 
export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
	const { user, isLoading } = useAuth();
	const location = useLocation();

	if (isLoading) {
		return <div>Authenticatie controleren...</div>;
	}

	if (!user) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
		return <ErrorPage statusCode={403} />;
	}

	return <>{children}</>;
}