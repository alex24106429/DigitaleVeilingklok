using PetalBid.Api.Domain.Enums;
using PetalBid.Api.ValidationAttributes;

namespace PetalBid.Api.Domain.Entities;

public class Auction
{
	public int Id { get; set; }
	public string Description { get; set; } = string.Empty;
	[FutureDate]
	public DateTime StartsAt { get; set; }
	public ClockLocation ClockLocation { get; set; }
	public AuctionStatus Status { get; set; } = AuctionStatus.Pending; // Default status is Pending

	public int? Quantity { get; set; }
	public decimal? ReservePrice { get; set; }
	public int AuctioneerId { get; set; }
	public Auctioneer? Auctioneer { get; set; } = null!;
}
