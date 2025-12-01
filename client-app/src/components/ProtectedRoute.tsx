import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/user';
import { ReactNode } from 'react';
import ErrorPage from './ErrorPage';

/**
 * Props for the ProtectedRoute component.
 */
export interface ProtectedRouteProps {
	/** The component or elements to render if the user is authorized. */
	children: ReactNode;
	/** An optional array of user roles allowed to access this route. If not provided, any authenticated user can access it. */
	allowedRoles?: UserRole[];
}

/**
 * A component that wraps routes to protect them from unauthorized access.
 *
 * It performs the following checks:
 * 1. Shows a loading state while checking authentication status.
 * 2. If the user is not authenticated, it redirects to the login page.
 * 3. If `allowedRoles` are specified, it checks if the authenticated user has one of the required roles.
 *    If not, it displays a 403 Forbidden error page.
 * 4. If the user is authenticated and authorized, it renders the child components.
 *
 * @param {ProtectedRouteProps} props The props for the component.
 * @returns {JSX.Element} The child components, a redirect, a loading indicator, or an error page.
 */
export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
	const { user, isLoading } = useAuth();
	const location = useLocation();

	// While authentication status is being determined, show a loading message.
	if (isLoading) {
		return <div>Authenticatie controleren...</div>;
	}

	// If there is no authenticated user, redirect to the login page.
	// The current location is passed in the state to allow redirecting back after a successful login.
	if (!user) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	// If the route requires specific roles and the user's role is not in the allowed list, show a "Forbidden" error.
	if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
		return <ErrorPage statusCode={403} />;
	}

	// If the user is authenticated and has the required role (if any), render the children.
	return <>{children}</>;
}