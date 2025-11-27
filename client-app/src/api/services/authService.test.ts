import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authService } from './authService';
import { UserRole } from '../../types/user';

// Mock data
const mockUser = {
	id: 1,
	email: 'test@example.com',
	fullName: 'Test User',
	role: UserRole.Buyer,
	isTotpEnabled: false
};

describe('authService', () => {
	// Spy on the global fetch function
	const fetchSpy = vi.spyOn(global, 'fetch');

	beforeEach(() => {
		vi.resetAllMocks();
		localStorage.clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('register', () => {
		it('returns user data on successful registration', async () => {
			fetchSpy.mockResolvedValueOnce({
				ok: true,
				json: async () => mockUser,
			} as Response);

			const requestData = {
				fullName: 'Test User',
				email: 'test@example.com',
				password: 'password123',
				role: UserRole.Buyer
			};

			const result = await authService.register(requestData);

			expect(result.data).toEqual(mockUser);
			expect(result.error).toBeUndefined();
			expect(fetchSpy).toHaveBeenCalledWith(
				expect.stringContaining('/users/register'),
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify(requestData)
				})
			);
		});

		it('handles unexpected network errors', async () => {
			fetchSpy.mockRejectedValueOnce(new Error('Network error'));

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const result = await authService.register({} as any);

			expect(result.error).toContain('onverwachte fout');
		});
	});
});