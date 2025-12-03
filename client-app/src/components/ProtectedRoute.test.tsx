import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { UserRole } from '../types/user';
import * as AuthContextModule from '../contexts/AuthContext';

// Mock ErrorPage
vi.mock('./ErrorPage', () => ({
	default: ({ statusCode }: { statusCode: number }) => (
		<h1>{statusCode === 403 ? 'Toegang geweigerd' : 'Error'}</h1>
	)
}));

const LoginPage = () => <div>Login Page</div>;
const ProtectedContent = () => <div>Protected Content</div>;

describe('ProtectedRoute Component', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	const renderWithRouter = (element: React.ReactNode) => {
		return render(
			<MemoryRouter initialEntries={['/']}>
				<ThemeProvider theme={theme}>
					<Routes>
						<Route path="/" element={element} />
						<Route path="/login" element={<LoginPage />} />
					</Routes>
				</ThemeProvider>
			</MemoryRouter>
		);
	};

	it('shows loading state when isLoading is true', () => {
		vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
			user: null,
			isLoading: true,
			login: vi.fn(),
			logout: vi.fn(),
			updateUser: vi.fn(),
		});

		renderWithRouter(
			<ProtectedRoute>
				<ProtectedContent />
			</ProtectedRoute>
		);

		expect(screen.getByText(/authenticatie controleren/i)).toBeInTheDocument();
	});

	it('redirects to login when user is not authenticated', () => {
		vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
			user: null,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(),
			updateUser: vi.fn(),
		});

		renderWithRouter(
			<ProtectedRoute>
				<ProtectedContent />
			</ProtectedRoute>
		);

		expect(screen.getByText(/login page/i)).toBeInTheDocument();
	});

	it('renders children when user is authenticated and authorized', () => {
		vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
			user: { id: 1, email: 'test@example.com', fullName: 'Test User', role: UserRole.Admin, isTotpEnabled: false, isDisabled: false },
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(),
			updateUser: vi.fn(),
		});

		renderWithRouter(
			<ProtectedRoute>
				<ProtectedContent />
			</ProtectedRoute>
		);

		expect(screen.getByText(/protected content/i)).toBeInTheDocument();
	});

	it('shows 403 page when user lacks required role', () => {
		vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
			user: { id: 2, email: 'buyer@example.com', fullName: 'Buyer User', role: UserRole.Buyer, isTotpEnabled: false, isDisabled: false },
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(),
			updateUser: vi.fn(),
		});

		renderWithRouter(
			<ProtectedRoute allowedRoles={[UserRole.Admin]}>
				<ProtectedContent />
			</ProtectedRoute>
		);

		expect(screen.getByRole('heading', { name: /toegang geweigerd/i })).toBeInTheDocument();
	});

	it('renders children when user has one of the allowed roles', () => {
		vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
			user: { id: 1, email: 'test@example.com', fullName: 'Test User', role: UserRole.Admin, isTotpEnabled: false, isDisabled: false },
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(),
			updateUser: vi.fn(),
		});

		renderWithRouter(
			<ProtectedRoute allowedRoles={[UserRole.Admin, UserRole.Auctioneer]}>
				<ProtectedContent />
			</ProtectedRoute>
		);

		expect(screen.getByText(/protected content/i)).toBeInTheDocument();
	});
});