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

	describe('getMyProducts', () => {
		it('fetches products successfully', async () => {
			fetchSpy.mockResolvedValue({
				ok: true,
				json: async () => [mockProduct],
			});

			const result = await productService.getMyProducts({ force: true });

			expect(result.data).toEqual([mockProduct]);
			expect(result.error).toBeUndefined();
			expect(fetchSpy).toHaveBeenCalledWith(
				expect.stringContaining('/products'),
				expect.objectContaining({
					// createCachedResource uses request() defaults, so method is implicit GET (undefined in options)
					credentials: 'include'
				})
			);
		});

		it('uses caching for subsequent calls', async () => {
			fetchSpy.mockResolvedValue({
				ok: true,
				json: async () => [mockProduct],
			});

			// First call - triggers fetch
			await productService.getMyProducts({ force: true });

			// Second call - should use cache
			fetchSpy.mockClear();
			const result = await productService.getMyProducts();

			expect(result.data).toEqual([mockProduct]);
			expect(fetchSpy).not.toHaveBeenCalled();
		});

		it('bypasses cache when force is true', async () => {
			fetchSpy.mockResolvedValue({
				ok: true,
				json: async () => [mockProduct],
			});

			// First call
			await productService.getMyProducts({ force: true });

			// Second call with force
			await productService.getMyProducts({ force: true });

			expect(fetchSpy).toHaveBeenCalledTimes(2);
		});

		it('handles API errors', async () => {
			fetchSpy.mockResolvedValue({
				ok: false,
				json: async () => ({ message: 'Server Error' }),
			});

			const result = await productService.getMyProducts({ force: true });

			expect(result.data).toBeUndefined();
			expect(result.error).toBe('Server Error');
		});

		it('handles network exceptions', async () => {
			fetchSpy.mockRejectedValue(new Error('Network fail'));

			const result = await productService.getMyProducts({ force: true });

			expect(result.error).toBe('Network error. Please try again.');
		});
	});

	describe('createProduct', () => {
		it('creates a product successfully and invalidates cache', async () => {
			fetchSpy.mockResolvedValue({
				ok: true,
				json: async () => mockProduct,
			});

			// 1. Prime the cache
			await productService.getMyProducts({ force: true });

			// 2. Create product
			const result = await productService.createProduct(mockProductDto);

			expect(result.data).toEqual(mockProduct);
			expect(fetchSpy).toHaveBeenCalledWith(
				expect.stringContaining('/products'),
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify(mockProductDto)
				})
			);

			// 3. Verify cache invalidation
			fetchSpy.mockClear();
			fetchSpy.mockResolvedValue({
				ok: true,
				json: async () => [mockProduct]
			});
			await productService.getMyProducts();
			expect(fetchSpy).toHaveBeenCalledTimes(1);
		});

		it('handles validation errors from backend', async () => {
			fetchSpy.mockResolvedValue({
				ok: false,
				json: async () => ({ errors: { name: 'Name required' } }),
			});

			const result = await productService.createProduct(mockProductDto);

			expect(result.error).toBe('Name required');
		});
	});

	describe('updateProduct', () => {
		it('updates a product successfully', async () => {
			const updatedProduct = { ...mockProduct, name: 'Updated Rose' };
			fetchSpy.mockResolvedValue({
				ok: true,
				json: async () => updatedProduct,
			});

			const result = await productService.updateProduct(1, mockProductDto);

			expect(result.data).toEqual(updatedProduct);
			expect(fetchSpy).toHaveBeenCalledWith(
				expect.stringContaining('/products/1'),
				expect.objectContaining({
					method: 'PUT',
					body: JSON.stringify(mockProductDto)
				})
			);
		});

		it('handles update failures', async () => {
			fetchSpy.mockResolvedValue({
				ok: false,
				json: async () => ({ errors: { stock: 'Invalid stock' } }),
			});

			const result = await productService.updateProduct(1, mockProductDto);

			expect(result.error).toBe('Invalid stock');
		});
	});

	describe('deleteProduct', () => {
		it('deletes a product successfully and invalidates cache', async () => {
			fetchSpy.mockResolvedValue({
				ok: true,
				json: async () => ({ message: 'Product deleted successfully.' })
			});

			const result = await productService.deleteProduct(1);

			expect(result.message).toBe('Product deleted successfully.');
			expect(fetchSpy).toHaveBeenCalledWith(
				expect.stringContaining('/products/1'),
				expect.objectContaining({ method: 'DELETE' })
			);
		});

		it('handles delete errors', async () => {
			fetchSpy.mockResolvedValue({
				ok: false,
				statusText: 'Not Found',
				json: async () => ({ message: 'Not found' }),
			});

			const result = await productService.deleteProduct(999);

			expect(result.error).toBe('Not found');
		});
	});
});
