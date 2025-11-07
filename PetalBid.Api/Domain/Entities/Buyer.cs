namespace PetalBid.Api.Domain.Entities;

public class Buyer : User
{
	public string CompanyName { get; set; } = string.Empty;
}
