import { ApiResponse } from '../../types/api';
import { Product } from '../../types/product';

const API_BASE_URL = 'http://localhost:5048/api';

/**
 * Data Transfer Object for creating or updating a product.
 * It omits fields that are managed by the server, such as `id`, `supplierId`, and `auctionId`.
 */
export type ProductDto = Omit<Product, 'id' | 'supplierId' | 'auctionId' | 'supplier' | 'auction'>;

/**
 * Retrieves the authorization headers from local storage.
 * @returns {HeadersInit} The headers object with the Authorization token.
 * @throws {Error} If the authentication token is not found.
 */
const getAuthHeaders = (): HeadersInit => {
	const token = localStorage.getItem('token');
	if (!token) {
		throw new Error('No authentication token found.');
	}
	return {
		'Authorization': `Bearer ${token}`,
		'Content-Type': 'application/json',
	};
};

/**
 * Service for handling product-related API calls.
 */
export const productService = {
	/**
	 * Fetches all products belonging to the currently authenticated supplier.
	 * @returns {Promise<ApiResponse<Product[]>>} A promise resolving to the list of products or an error.
	 */
	async getMyProducts(): Promise<ApiResponse<Product[]>> {
		try {
			const response = await fetch(`${API_BASE_URL}/products`, {
				method: 'GET',
				headers: getAuthHeaders(),
			});
			const data = await response.json();
			if (!response.ok) {
				return { error: data.message || `Failed to fetch products: ${response.statusText}` };
			}
			return { data };
		} catch (err) {
			return { error: 'Network error. Please try again.' };
		}
	},

	/**
	 * Creates a new product for the authenticated supplier.
	 * @param {ProductDto} productData - The data for the new product.
	 * @returns {Promise<ApiResponse<Product>>} A promise resolving to the newly created product or an error.
	 */
	async createProduct(productData: ProductDto): Promise<ApiResponse<Product>> {
		try {
			const response = await fetch(`${API_BASE_URL}/products`, {
				method: 'POST',
				headers: getAuthHeaders(),
				body: JSON.stringify(productData),
			});
			const data = await response.json();
			if (!response.ok) {
				return { error: data.message || 'Failed to create product.' };
			}
			return { data };
		} catch (err) {
			return { error: 'Network error. Please try again.' };
		}
	},

	/**
	 * Updates an existing product.
	 * @param {number} id - The ID of the product to update.
	 * @param {ProductDto} productData - The updated product data.
	 * @returns {Promise<ApiResponse<Product>>} A promise resolving to the updated product or an error.
	 */
	async updateProduct(id: number, productData: ProductDto): Promise<ApiResponse<Product>> {
		try {
			const response = await fetch(`${API_BASE_URL}/products/${id}`, {
				method: 'PUT',
				headers: getAuthHeaders(),
				body: JSON.stringify(productData),
			});
			const data = await response.json();
			if (!response.ok) {
				return { error: data.message || 'Failed to update product.' };
			}
			return { data };
		} catch (err) {
			return { error: 'Network error. Please try again.' };
		}
	},

	/**
	 * Deletes a product by its ID.
	 * @param {number} id - The ID of the product to delete.
	 * @returns {Promise<ApiResponse<null>>} A promise indicating success or failure.
	 */
	async deleteProduct(id: number): Promise<ApiResponse<null>> {
		try {
			const response = await fetch(`${API_BASE_URL}/products/${id}`, {
				method: 'DELETE',
				headers: getAuthHeaders(),
			});
			if (!response.ok) {
				const data = await response.json();
				return { error: data.message || `Failed to delete product: ${response.statusText}` };
			}
			return { data: null, message: 'Product deleted successfully.' };
		} catch (err) {
			return { error: 'Network error. Please try again.' };
		}
	},
};
