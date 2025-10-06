namespace PetalBid.Api.Domain.Entities;

public class Sale
{
	public int Id { get; set; }

	public int AuctionId { get; set; }
	public Auction Auction { get; set; } = null!;

	public int BuyerId { get; set; }
	public Buyer Buyer { get; set; } = null!;

	public DateTime OccurredAt { get; set; }
	public string PaymentReference { get; set; } = string.Empty;
}
