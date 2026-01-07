namespace PetalBid.Api.DTOs;

public class ProductHistoryDto
{
	public string Species { get; set; } = string.Empty;
	public SupplierHistoryStats SupplierStats { get; set; } = new();
	public SupplierHistoryStats MarketStats { get; set; } = new();
}

public class SupplierHistoryStats
{
	public double AveragePrice { get; set; }
	public List<HistoryItemDto> Last10Sales { get; set; } = [];
}

public class HistoryItemDto
{
	public double Price { get; set; }
	public DateTime Date { get; set; }
}
