namespace PetalBid.Api.Domain.Entities;

public class Buyer
{
	public int Id { get; set; }
	public string CompanyName { get; set; } = string.Empty;

	public int UserId { get; set; }
	public User User { get; set; } = null!;
}
