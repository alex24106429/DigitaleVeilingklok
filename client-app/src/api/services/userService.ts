import { api, createCachedResource } from '../client';
import { User } from '../../types/user';
import { RegisterUserRequest } from '../../types/api';

const userCache = createCachedResource<User[]>('/users');

/**
 * Service for user-related API calls (Admin only) with caching.
 */
export const userService = {
	/** Fetches all users. Uses cache unless forced. */
	getAllUsers: (opts?: { force?: boolean }) => userCache.get(opts?.force),

	/** Creates a new user (Admin only). */
	createUser: (data: RegisterUserRequest) => api.post<User>('/users/register', data),

	/** Updates a user by ID and invalidates cache. */
	updateUser: async (id: number, data: Partial<User>) => {
		const res = await api.put<User>(`/users/${id}`, data);
		if (res.data) userCache.invalidate();
		return res;
	},

	/** Resets a user's password. */
	adminChangePassword: (id: number, newPassword: string) =>
		api.put<{ message: string }>(`/users/${id}/password`, { newPassword }),

	/** Deletes a user by ID and invalidates cache. */
	deleteUser: async (id: number) => {
		const res = await api.delete<null>(`/users/${id}`);
		if (!res.error) userCache.invalidate();
		return res;
	},
};
