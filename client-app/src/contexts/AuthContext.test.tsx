import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { authService } from '../api/services/authService';
import { User, UserRole } from '../types/user';

// Mock the authService
vi.mock('../api/services/authService', () => ({
	authService: {
		login: vi.fn(),
		getUserById: vi.fn(),
	}
}));

// Define mock data
const mockUser: User = {
	id: 1,
	fullName: 'Test User',
	email: 'test@example.com',
	role: UserRole.Buyer,
	isTotpEnabled: false
};

const mockToken = 'fake-jwt-token';

// A consumer component to test the hook
const TestConsumer = () => {
	const { user, token, isLoading, login, logout, updateUser } = useAuth();

	if (isLoading) return <div>Loading...</div>;

	return (
		<div>
			<div data-testid="user-name">{user ? user.fullName : 'No User'}</div>
			<div data-testid="token-value">{token ?? 'No Token'}</div>
			<button onClick={async () => {
				const result = await login('test@example.com', 'password');
				if (!result.success) {
					document.body.setAttribute('data-login-error', result.error || 'Unknown');
				}
			}}>
				Login
			</button>
			<button onClick={logout}>Logout</button>
			<button onClick={() => updateUser({ ...mockUser, fullName: 'Updated Name' })}>
				Update Profile
			</button>
		</div>
	);
};

describe('AuthContext', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('initializes with no user when localStorage is empty', async () => {
		render(
			<AuthProvider>
				<TestConsumer />
			</AuthProvider>
		);

		// Should start loading, then finish
		expect(screen.getByText('Loading...')).toBeInTheDocument();

		await waitFor(() => {
			expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
		});

		expect(screen.getByTestId('user-name')).toHaveTextContent('No User');
		expect(screen.getByTestId('token-value')).toHaveTextContent('No Token');
	});

	it('logs in successfully and updates state and localStorage', async () => {
		// Setup mock response
		vi.mocked(authService.login).mockResolvedValue({
			data: { user: mockUser, token: mockToken }
		});

		render(
			<AuthProvider>
				<TestConsumer />
			</AuthProvider>
		);

		await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());

		// Click login
		fireEvent.click(screen.getByText('Login'));

		// Wait for state update
		await waitFor(() => {
			expect(screen.getByTestId('user-name')).toHaveTextContent(mockUser.fullName);
		});

		expect(screen.getByTestId('token-value')).toHaveTextContent(mockToken);

		// Check localStorage
		expect(localStorage.getItem('token')).toBe(mockToken);
		expect(JSON.parse(localStorage.getItem('user')!)).toEqual(mockUser);
	});

	it('handles login failure', async () => {
		// Setup mock failure
		vi.mocked(authService.login).mockResolvedValue({
			error: 'Invalid credentials'
		});

		render(
			<AuthProvider>
				<TestConsumer />
			</AuthProvider>
		);

		await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());

		fireEvent.click(screen.getByText('Login'));

		await waitFor(() => {
			expect(document.body.getAttribute('data-login-error')).toBe('Invalid credentials');
		});

		expect(screen.getByTestId('user-name')).toHaveTextContent('No User');
		expect(localStorage.getItem('token')).toBeNull();
	});

	it('logs out successfully and clears storage', async () => {
		// Pre-set storage to simulate logged-in state
		localStorage.setItem('user', JSON.stringify(mockUser));
		localStorage.setItem('token', mockToken);

		// Mock validation check to succeed so we stay logged in on mount
		vi.mocked(authService.getUserById).mockResolvedValue({ data: mockUser });

		render(
			<AuthProvider>
				<TestConsumer />
			</AuthProvider>
		);

		await waitFor(() => expect(screen.getByTestId('user-name')).toHaveTextContent(mockUser.fullName));

		// Click logout
		fireEvent.click(screen.getByText('Logout'));

		await waitFor(() => {
			expect(screen.getByTestId('user-name')).toHaveTextContent('No User');
		});

		expect(localStorage.getItem('token')).toBeNull();
		expect(localStorage.getItem('user')).toBeNull();
	});

	it('validates session on load: keeps user if server confirms', async () => {
		localStorage.setItem('user', JSON.stringify(mockUser));
		localStorage.setItem('token', mockToken);

		// Server confirms user data matches
		vi.mocked(authService.getUserById).mockResolvedValue({ data: mockUser });

		render(
			<AuthProvider>
				<TestConsumer />
			</AuthProvider>
		);

		// Should eventually show the user
		await waitFor(() => {
			expect(screen.getByTestId('user-name')).toHaveTextContent(mockUser.fullName);
		});

		expect(authService.getUserById).toHaveBeenCalledWith(mockUser.id);
	});

	it('validates session on load: logs out if server data mismatch or error', async () => {
		localStorage.setItem('user', JSON.stringify(mockUser));
		localStorage.setItem('token', mockToken);

		// Scenario 1: Server returns 404/Error (data is undefined)
		vi.mocked(authService.getUserById).mockResolvedValue({ error: 'User not found' });

		render(
			<AuthProvider>
				<TestConsumer />
			</AuthProvider>
		);

		await waitFor(() => {
			expect(screen.getByTestId('user-name')).toHaveTextContent('No User');
		});

		expect(localStorage.getItem('token')).toBeNull();
	});

	it('updates user profile data', async () => {
		// Start logged in
		localStorage.setItem('user', JSON.stringify(mockUser));
		localStorage.setItem('token', mockToken);
		vi.mocked(authService.getUserById).mockResolvedValue({ data: mockUser });

		render(
			<AuthProvider>
				<TestConsumer />
			</AuthProvider>
		);

		await waitFor(() => expect(screen.getByTestId('user-name')).toHaveTextContent('Test User'));

		// Trigger update
		fireEvent.click(screen.getByText('Update Profile'));

		await waitFor(() => {
			expect(screen.getByTestId('user-name')).toHaveTextContent('Updated Name');
		});

		// Check persistence
		const storedUser = JSON.parse(localStorage.getItem('user')!);
		expect(storedUser.fullName).toBe('Updated Name');
	});
});