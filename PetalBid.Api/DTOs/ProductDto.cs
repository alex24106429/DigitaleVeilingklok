using System.ComponentModel.DataAnnotations;
using PetalBid.Api.ValidationAttributes;

namespace PetalBid.Api.DTOs;

public class ProductDto
{
	[Required]
	[StringLength(100)]
	public string Name { get; set; } = string.Empty;

	private const double MaxWeight = 100;
	[Range(0, MaxWeight)]
	public double Weight { get; set; }

	public string ImageBase64 { get; set; } = string.Empty;

	[Required]
	[StringLength(100)]
	public string Species { get; set; } = string.Empty;

	private const double MaxPotSize = 70;
	[Range(0, MaxPotSize)]
	public double PotSize { get; set; }

	private const double MaxStemLength = 100;
	[Range(0, MaxStemLength)]
	public double StemLength { get; set; }

	[Range(1, int.MaxValue)]
	public int Stock { get; set; }

	[Range(0.01, double.MaxValue)]
	public double MinimumPrice { get; set; }

	public int? AuctionId { get; set; }

	public double? MaxPricePerUnit { get; set; }

	[FutureDate]
	public DateTime? SaleDate { get; set; }
}
