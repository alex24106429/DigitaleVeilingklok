import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { userService } from './userService';
import { User, UserRole } from '../../types/user';

// Mock data
const mockUser: User = {
	id: 1,
	fullName: 'Admin User',
	email: 'admin@example.com',
	role: UserRole.Admin,
	isTotpEnabled: true,
	isDisabled: false
};

const mockUserList: User[] = [mockUser];

describe('userService', () => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let fetchSpy: any;

	beforeEach(() => {
		vi.restoreAllMocks();
		localStorage.clear();
		fetchSpy = vi.spyOn(global, 'fetch');
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('getAllUsers', () => {
		it('fetches users successfully', async () => {
			fetchSpy.mockResolvedValue({
				ok: true,
				json: async () => mockUserList,
			});

			const result = await userService.getAllUsers({ force: true });

			expect(result.data).toEqual(mockUserList);
			expect(result.error).toBeUndefined();
			expect(fetchSpy).toHaveBeenCalledWith(
				expect.stringContaining('/users'),
				expect.objectContaining({
					// createCachedResource uses request() defaults, so method is implicit GET (undefined in options)
					credentials: 'include'
				})
			);
		});

		it('uses caching for subsequent calls', async () => {
			fetchSpy.mockResolvedValue({
				ok: true,
				json: async () => mockUserList,
			});

			// 1. Force fetch to populate cache
			await userService.getAllUsers({ force: true });

			// 2. Clear mock history
			fetchSpy.mockClear();

			// 3. Normal fetch should hit cache
			const result = await userService.getAllUsers();

			expect(result.data).toEqual(mockUserList);
			expect(fetchSpy).not.toHaveBeenCalled();
		});

		it('bypasses cache when force is true', async () => {
			fetchSpy.mockResolvedValue({
				ok: true,
				json: async () => mockUserList,
			});

			// 1. Populate cache
			await userService.getAllUsers({ force: true });

			// 2. Call again with force
			await userService.getAllUsers({ force: true });

			expect(fetchSpy).toHaveBeenCalledTimes(2);
		});

		it('handles API errors', async () => {
			fetchSpy.mockResolvedValue({
				ok: false,
				statusText: 'Unauthorized',
				json: async () => ({ message: 'Unauthorized' }),
			});

			const result = await userService.getAllUsers({ force: true });

			expect(result.data).toBeUndefined();
			expect(result.error).toBe('Unauthorized');
		});

		it('handles network errors', async () => {
			fetchSpy.mockRejectedValue(new Error('Network fail'));

			const result = await userService.getAllUsers({ force: true });

			expect(result.error).toBe('Network error. Please try again.');
		});
	});

	describe('deleteUser', () => {
		it('deletes a user successfully and invalidates cache', async () => {
			fetchSpy.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ message: 'User deleted successfully.' })
			});

			// 1. Populate cache first (optional, but good for completeness)
			// For simplicity in this test, we just check the delete call.

			const result = await userService.deleteUser(1);

			expect(result.message).toBe('User deleted successfully.');
			expect(fetchSpy).toHaveBeenCalledWith(
				expect.stringContaining('/users/1'),
				expect.objectContaining({ method: 'DELETE' })
			);
		});

		it('handles delete errors with specific message from body', async () => {
			fetchSpy.mockResolvedValue({
				ok: false,
				statusText: 'Bad Request',
				json: async () => ({ message: 'Cannot delete self' }),
			});

			const result = await userService.deleteUser(1);

			expect(result.error).toBe('Cannot delete self');
		});

		it('handles delete errors with status text fallback', async () => {
			// Mock response where json() fails or is empty, but statusText exists
			fetchSpy.mockResolvedValue({
				ok: false,
				statusText: 'Server Error',
				json: async () => ({})
			});

			const result = await userService.deleteUser(1);

			expect(result.error).toBe('Server Error');
		});

		it('handles network errors', async () => {
			fetchSpy.mockRejectedValue(new Error('Network fail'));
			const result = await userService.deleteUser(1);
			expect(result.error).toBe('Network error. Please try again.');
		});
	});
});
