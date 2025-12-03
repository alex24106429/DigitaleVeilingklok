/**
 * Represents a product or lot offered by a supplier for auction.
 */
export interface Product {
	/** The unique identifier for the product. */
	id: number;
	/** The common name of the product (e.g., 'Red Roses'). */
	name: string;
	/** The weight of the product, typically in kilograms. */
	weight: number;
	/** A Base64 string of the processed AVIF image. */
	imageBase64: string;
	/** The scientific or common species name (e.g., 'Rosa'). */
	species: string;
	/** The diameter of the pot in centimeters, if applicable. */
	potSize?: number;
	/** The length of the stem in centimeters, if applicable. */
	stemLength?: number;
	/** The total quantity available in the lot. */
	stock: number;
	/** The minimum price per unit that the supplier will accept. */
	minimumPrice: number;
	/** The ID of the supplier who owns this product. */
	supplierId: number;
	/** The ID of the auction this product is assigned to, if any. */
	auctionId?: number;
	/** The maximum price per unit that a buyer can bid for the product in an auction. */
	maxPricePerUnit?: number;
}
