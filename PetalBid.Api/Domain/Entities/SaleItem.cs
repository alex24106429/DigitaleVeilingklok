namespace PetalBid.Api.Domain.Entities;

public class SaleItem
{
	public int Id { get; set; }

	public int SaleId { get; set; }
	public Sale Sale { get; set; } = null!;

	public int ProductId { get; set; }
	public Product Product { get; set; } = null!;

	public int Quantity { get; set; }
	public int UnitPrice { get; set; }
}
