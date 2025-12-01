import { api, createCachedResource } from '../client';
import { Product } from '../../types/product';

/** DTO for creating/updating a product. */
export type ProductDto = Omit<Product, 'id' | 'supplierId' | 'supplier' | 'auction'>;

const productCache = createCachedResource<Product[]>('/products');

/**
 * Service for handling product-related API calls with caching.
 */
export const productService = {
	/** Fetches all products. Uses cache unless forced. */
	getMyProducts: (opts?: { force?: boolean }) => productCache.get(opts?.force),

	/** Creates a new product and invalidates cache. */
	createProduct: async (data: ProductDto) => {
		const res = await api.post<Product>('/products', data);
		if (res.data) productCache.invalidate();
		return res;
	},

	/** Updates an existing product and invalidates cache. */
	updateProduct: async (id: number, data: ProductDto) => {
		const res = await api.put<Product>(`/products/${id}`, data);
		if (res.data) productCache.invalidate();
		return res;
	},

	/** Deletes a product and invalidates cache. */
	deleteProduct: async (id: number) => {
		const res = await api.delete<null>(`/products/${id}`);
		if (!res.error) productCache.invalidate();
		return res;
	},
};