import { ApiResponse } from '../../types/api';
import { User } from '../../types/user';

const API_BASE_URL = 'http://localhost:5048/api';

/**
 * Service for user-related API calls, intended for admin use.
 */
export const userService = {
	/**
	 * Fetches a list of all users from the server. Requires admin privileges.
	 * @returns {Promise<ApiResponse<User[]>>} A promise that resolves to an ApiResponse containing the list of users or an error.
	 */
	async getAllUsers(): Promise<ApiResponse<User[]>> {
		const token = localStorage.getItem('token');
		if (!token) {
			return { error: 'No authentication token found.' };
		}

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

			return { data };
		} catch (err) {
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
				} catch (e) {
					// Response body was not JSON or was empty
				}
				return { error: message };
			}
			// A 204 No Content response is a success
			return { data: null, message: 'User deleted successfully.' };
		} catch (err) {
			return { error: 'Network error. Please try again.' };
		}
	}
};
