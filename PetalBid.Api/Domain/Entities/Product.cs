namespace PetalBid.Api.Domain.Entities;

public class Product
{
	public int Id { get; set; }
	public string Name { get; set; } = string.Empty;
	public double Weight { get; set; }
	public string ImageUrl { get; set; } = string.Empty;
	public string Species { get; set; } = string.Empty;
	public double? PotSize { get; set; }
	public double? StemLength { get; set; }
	public int Stock { get; set; }

	public int AuctionId { get; set; }
	public Auction Auction { get; set; } = null!;
}
