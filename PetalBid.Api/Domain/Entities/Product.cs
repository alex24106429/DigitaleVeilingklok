namespace PetalBid.Api.Domain.Entities;

public class Product
{
	public int Id { get; set; }
	public string Name { get; set; } = string.Empty;
	public double Weight { get; set; }
	public string ImageBase64 { get; set; } = string.Empty;
	public string Species { get; set; } = string.Empty;
	public double? PotSize { get; set; }
	public double? StemLength { get; set; }
	public int Stock { get; set; }
	public double MinimumPrice { get; set; }

	// Link to Supplier
	public int SupplierId { get; set; }
	public Supplier Supplier { get; set; } = null!;

	// AuctionId is now nullable
	public int? AuctionId { get; set; }
	public Auction? Auction { get; set; }

	// Maximum price per unit that a buyer can bid for the product in an auction
	public double? MaxPricePerUnit { get; set; }

	// Date when the product is available for sale
	public DateTime? SaleDate { get; set; }
}
