import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { productService, ProductDto } from './productService';
import { Product } from '../../types/product';

// Mock data
const mockProduct: Product = {
	id: 1,
	name: 'Red Roses',
	species: 'Rosa',
	weight: 10,
	imageBase64: 'data:image/avif;base64,',
	stock: 100,
	minimumPrice: 0.5,
	supplierId: 99,
	auctionId: 1
};

const mockProductDto: ProductDto = {
	name: 'Red Roses',
	species: 'Rosa',
	weight: 10,
	imageBase64: 'data:image/avif;base64,',
	stock: 100,
	minimumPrice: 0.5,
};

describe('productService', () => {
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
		// Set a token so getAuthHeaders doesn't throw immediately (unless we want it to)
		localStorage.setItem('token', 'valid-token');
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('getMyProducts', () => {
		it('fetches products successfully', async () => {
			global.fetch = mockFetch(true, [mockProduct]);

			const result = await productService.getMyProducts({ force: true });

			expect(result.data).toEqual([mockProduct]);
			expect(result.error).toBeUndefined();
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/products'),
				expect.objectContaining({ method: 'GET' })
			);
		});

		it('uses caching for subsequent calls', async () => {
			global.fetch = mockFetch(true, [mockProduct]);

			// First call - triggers fetch
			await productService.getMyProducts({ force: true });

			// Second call - should use cache
			const result = await productService.getMyProducts();

			expect(result.data).toEqual([mockProduct]);
			expect(global.fetch).toHaveBeenCalledTimes(1);
		});

		it('bypasses cache when force is true', async () => {
			global.fetch = mockFetch(true, [mockProduct]);

			// First call
			await productService.getMyProducts({ force: true });

			// Second call with force
			await productService.getMyProducts({ force: true });

			expect(global.fetch).toHaveBeenCalledTimes(2);
		});

		it('handles API errors', async () => {
			global.fetch = mockFetch(false, { message: 'Server Error' });

			const result = await productService.getMyProducts({ force: true });

			expect(result.data).toBeUndefined();
			expect(result.error).toBe('Server Error');
		});

		it('handles network exceptions', async () => {
			global.fetch = vi.fn().mockRejectedValue(new Error('Network fail'));

			const result = await productService.getMyProducts({ force: true });

			expect(result.error).toBe('Network error. Please try again.');
		});
	});

	describe('createProduct', () => {
		it('creates a product successfully and invalidates cache', async () => {
			global.fetch = mockFetch(true, mockProduct);

			// 1. Prime the cache
			await productService.getMyProducts({ force: true });

			// 2. Create product
			const result = await productService.createProduct(mockProductDto);

			expect(result.data).toEqual(mockProduct);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/products'),
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify(mockProductDto)
				})
			);

			// 3. Verify cache was invalidated by calling getMyProducts again
			// If cache was valid, fetch count would be 2 (1 prime + 1 create).
			// Since it's invalidated, it should be 3 (1 prime + 1 create + 1 re-fetch).
			await productService.getMyProducts();
			expect(global.fetch).toHaveBeenCalledTimes(3);
		});

		it('handles validation errors from backend', async () => {
			global.fetch = mockFetch(false, { errors: { name: 'Name required' } });

			const result = await productService.createProduct(mockProductDto);

			expect(result.error).toBe('Name required');
		});

		it('returns error if no token is present', async () => {
			localStorage.removeItem('token');
			// The service catches the synchronous error thrown by getAuthHeaders inside the try/catch block
			const result = await productService.createProduct(mockProductDto);
			expect(result.error).toBe('Network error. Please try again.');
		});
	});

	describe('updateProduct', () => {
		it('updates a product successfully', async () => {
			const updatedProduct = { ...mockProduct, name: 'Updated Rose' };
			global.fetch = mockFetch(true, updatedProduct);

			const result = await productService.updateProduct(1, mockProductDto);

			expect(result.data).toEqual(updatedProduct);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/products/1'),
				expect.objectContaining({
					method: 'PUT',
					body: JSON.stringify(mockProductDto)
				})
			);
		});

		it('handles update failures', async () => {
			global.fetch = mockFetch(false, { errors: { stock: 'Invalid stock' } });

			const result = await productService.updateProduct(1, mockProductDto);

			expect(result.error).toBe('Invalid stock');
		});
	});

	describe('deleteProduct', () => {
		it('deletes a product successfully and invalidates cache', async () => {
			global.fetch = mockFetch(true, {}); // Delete usually returns 200/204

			const result = await productService.deleteProduct(1);

			expect(result.message).toBe('Product deleted successfully.');
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/products/1'),
				expect.objectContaining({ method: 'DELETE' })
			);

			// Ensure cache invalidation logic is hit (we can't easily check the private cache var, 
			// but we can check if a subsequent get triggers a fetch)
			vi.clearAllMocks(); // clear the delete call
			global.fetch = mockFetch(true, []);

			await productService.getMyProducts();
			expect(global.fetch).toHaveBeenCalledTimes(1);
		});

		it('handles delete errors', async () => {
			global.fetch = mockFetch(false, { message: 'Not found' }, 'Not Found');

			const result = await productService.deleteProduct(999);

			expect(result.error).toBe('Not found');
		});
	});
});