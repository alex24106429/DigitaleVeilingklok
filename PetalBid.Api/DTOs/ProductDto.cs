using System.ComponentModel.DataAnnotations;

namespace PetalBid.Api.DTOs;

public class ProductDto
{
	[Required]
	[StringLength(100)]
	public string Name { get; set; } = string.Empty;

	[Range(0, double.MaxValue)]
	public double Weight { get; set; }

	[Url]
	public string ImageUrl { get; set; } = string.Empty;

	[Required]
	[StringLength(100)]
	public string Species { get; set; } = string.Empty;

	public double? PotSize { get; set; }

	public double? StemLength { get; set; }

	[Range(1, int.MaxValue)]
	public int Stock { get; set; }

	[Range(0.01, double.MaxValue)]
	public double MinimumPrice { get; set; }
}
