namespace PetalBid.Api.Domain.Entities;

public class Auctioneer
{
	public int Id { get; set; }

	public int UserId { get; set; }
	public User User { get; set; } = null!;
}
