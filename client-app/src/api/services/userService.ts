import { ApiResponse } from '../../types/api';
import { User } from '../../types/user';

const API_BASE_URL = 'http://localhost:5048/api';

// In-flight + result cache for GET /users (admin only)
let usersCache: User[] | null = null;
let usersInFlight: Promise<ApiResponse<User[]>> | null = null;
const invalidateUsersCache = () => {
	usersCache = null;
};

/**
 * Service for user-related API calls, intended for admin use.
 */
export const userService = {
	/**
	 * Fetches a list of all users from the server. Requires admin privileges.
	 * Pass { force: true } to bypass cache.
	 */
	async getAllUsers(options?: { force?: boolean }): Promise<ApiResponse<User[]>> {
		const force = Boolean(options?.force);

		// Return cached result or in-flight promise if available
		if (!force) {
			if (usersCache) return { data: usersCache };
			if (usersInFlight) return usersInFlight;
		}

		const token = localStorage.getItem('token');
		if (!token) {
			return { error: 'No authentication token found.' };
		}

		const promise = (async () => {
			try {
				const response = await fetch(`${API_BASE_URL}/users`, {
					method: 'GET',
					headers: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json',
					},
				});

				const data = await response.json();

				if (!response.ok) {
					return { error: data.message || `Failed to fetch users: ${response.statusText}` };
				}

				usersCache = data as User[];
				return { data: usersCache };
			} catch {
				return { error: 'Network error. Please try again.' };
			} finally {
				usersInFlight = null;
			}
		})();

		usersInFlight = promise;
		return promise;
	},

	/**
	 * Updates a user by their ID. Requires admin privileges.
	 * @param {number} id The ID of the user to update.
	 * @param {Partial<User>} userData The updated user data.
	 * @returns {Promise<ApiResponse<User>>} A promise that resolves to an ApiResponse containing the updated user.
	 */
	async updateUser(id: number, userData: Partial<User>): Promise<ApiResponse<User>> {
		const token = localStorage.getItem('token');
		if (!token) {
			return { error: 'No authentication token found.' };
		}

		try {
			const response = await fetch(`${API_BASE_URL}/users/${id}`, {
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(userData),
			});

			const data = await response.json();

			if (!response.ok) {
				return { error: data.message || `Failed to update user: ${response.statusText}` };
			}

			// Invalidate cached user list after mutation
			invalidateUsersCache();

			return { data };
		} catch {
			return { error: 'Network error. Please try again.' };
		}
	},

	/**
	 * Deletes a user by their ID. Requires admin privileges.
	 * @param {number} id The ID of the user to delete.
	 * @returns {Promise<ApiResponse<null>>} A promise that resolves to an ApiResponse indicating success or failure.
	 */
	async deleteUser(id: number): Promise<ApiResponse<null>> {
		const token = localStorage.getItem('token');
		if (!token) {
			return { error: 'No authentication token found.' };
		}

		try {
			const response = await fetch(`${API_BASE_URL}/users/${id}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				let message = `Failed to delete user: ${response.statusText}`;
				try {
					// Attempt to parse a more specific error message from the response body
					const errorData = await response.json();
					if (errorData.message) message = errorData.message;
				} catch {
					// ignore parse errors
				}
				return { error: message };
			}

			// Invalidate cached user list after mutation
			invalidateUsersCache();

			return { data: null, message: 'User deleted successfully.' };
		} catch {
			return { error: 'Network error. Please try again.' };
		}
	}
};
