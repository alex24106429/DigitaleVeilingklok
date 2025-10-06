using PetalBid.Api.Domain.Enums;

namespace PetalBid.Api.Domain.Entities;

public class Auction
{
	public int Id { get; set; }
	public string Description { get; set; } = string.Empty;
	public DateTime StartsAt { get; set; }
	public int Quantity { get; set; }
	public int ReservePrice { get; set; }
	public ClockLocation ClockLocation { get; set; }

	public int AuctioneerId { get; set; }
	public Auctioneer Auctioneer { get; set; } = null!;
}
