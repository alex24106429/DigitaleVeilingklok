export interface Purchase {
	id: number;
	userId: string;
	buyerName: string;
	productName: string;
	species: string;
	origin: string;
	quantity: number;
	purchasePrice: number;
	purchaseDate: string;
	sideBuy: boolean;
	sold?: boolean;
	buyer?: string;
}
