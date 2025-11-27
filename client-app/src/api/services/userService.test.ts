import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { userService } from './userService';
import { User, UserRole } from '../../types/user';

// Mock data
const mockUser: User = {
	id: 1,
	fullName: 'Admin User',
	email: 'admin@example.com',
	role: UserRole.Admin,
	isTotpEnabled: true
};

const mockUserList: User[] = [mockUser];

describe('userService', () => {
	// Helper to mock fetch responses
	const mockFetch = (ok: boolean, data: unknown, statusText = 'Error') => {
		return vi.fn().mockResolvedValue({
			ok,
			json: async () => data,
			statusText,
		});
	};

	beforeEach(() => {
		vi.restoreAllMocks();
		localStorage.clear();
		// Default to having a token
		localStorage.setItem('token', 'test-token');
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('getAllUsers', () => {
		it('fetches users successfully', async () => {
			global.fetch = mockFetch(true, mockUserList);

			const result = await userService.getAllUsers({ force: true });

			expect(result.data).toEqual(mockUserList);
			expect(result.error).toBeUndefined();
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/users'),
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						'Authorization': 'Bearer test-token'
					})
				})
			);
		});

		it('returns error when no token exists', async () => {
			localStorage.removeItem('token');
			const result = await userService.getAllUsers({ force: true });
			expect(result.error).toBe('No authentication token found.');
			expect(global.fetch).not.toHaveBeenCalled();
		});

		it('uses caching for subsequent calls', async () => {
			global.fetch = mockFetch(true, mockUserList);

			// 1. Force fetch to populate cache
			await userService.getAllUsers({ force: true });

			// 2. Clear mock history to ensure next call isn't just counting the previous one
			vi.mocked(global.fetch).mockClear();

			// 3. Normal fetch should hit cache
			const result = await userService.getAllUsers();

			expect(result.data).toEqual(mockUserList);
			expect(global.fetch).not.toHaveBeenCalled();
		});

		it('bypasses cache when force is true', async () => {
			global.fetch = mockFetch(true, mockUserList);

			// 1. Populate cache
			await userService.getAllUsers({ force: true });

			// 2. Call again with force
			await userService.getAllUsers({ force: true });

			expect(global.fetch).toHaveBeenCalledTimes(2);
		});

		it('handles API errors', async () => {
			global.fetch = mockFetch(false, { message: 'Unauthorized' }, 'Unauthorized');

			const result = await userService.getAllUsers({ force: true });

			expect(result.data).toBeUndefined();
			expect(result.error).toBe('Unauthorized');
		});

		it('handles network errors', async () => {
			global.fetch = vi.fn().mockRejectedValue(new Error('Network fail'));

			const result = await userService.getAllUsers({ force: true });

			expect(result.error).toBe('Network error. Please try again.');
		});
	});

	describe('deleteUser', () => {
		it('deletes a user successfully and invalidates cache', async () => {
			global.fetch = mockFetch(true, {});

			// 1. Populate cache first
			const listFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockUserList
			});
			global.fetch = listFetch;
			await userService.getAllUsers({ force: true });

			// Verify caching is working (should not call fetch)
			listFetch.mockClear();
			await userService.getAllUsers();
			expect(listFetch).not.toHaveBeenCalled();

			// 2. Perform delete
			const deleteFetch = mockFetch(true, {});
			global.fetch = deleteFetch;

			const result = await userService.deleteUser(1);

			expect(result.message).toBe('User deleted successfully.');
			expect(deleteFetch).toHaveBeenCalledWith(
				expect.stringContaining('/users/1'),
				expect.objectContaining({ method: 'DELETE' })
			);

			// 3. Verify cache was invalidated
			// Next get call should trigger a fetch
			global.fetch = listFetch;
			await userService.getAllUsers();
			expect(listFetch).toHaveBeenCalled();
		});

		it('returns error when no token exists', async () => {
			localStorage.removeItem('token');
			const result = await userService.deleteUser(1);
			expect(result.error).toBe('No authentication token found.');
		});

		it('handles delete errors with specific message from body', async () => {
			global.fetch = mockFetch(false, { message: 'Cannot delete self' }, 'Bad Request');

			const result = await userService.deleteUser(1);

			expect(result.error).toBe('Cannot delete self');
		});

		it('handles delete errors with status text fallback', async () => {
			// Mock response where json() fails or is empty, but statusText exists
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				statusText: 'Server Error',
				json: async () => { throw new Error('No JSON'); }
			});

			const result = await userService.deleteUser(1);

			expect(result.error).toBe('Failed to delete user: Server Error');
		});

		it('handles network errors', async () => {
			global.fetch = vi.fn().mockRejectedValue(new Error('Network fail'));
			const result = await userService.deleteUser(1);
			expect(result.error).toBe('Network error. Please try again.');
		});
	});
});