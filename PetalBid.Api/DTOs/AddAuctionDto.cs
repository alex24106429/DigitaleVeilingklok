using System.ComponentModel.DataAnnotations;
using PetalBid.Api.Domain.Enums;
using PetalBid.Api.ValidationAttributes;

namespace PetalBid.Api.DTOs;

public class AddAuctionDto
{
	[Required]
	[StringLength(500, MinimumLength = 10)]
	public string Description { get; set; } = string.Empty;

	[Required]
	[FutureDate]
	public DateTime StartsAt { get; set; }

	[Required]
	public ClockLocation ClockLocation { get; set; }

	public int? Quantity { get; set; }

	public decimal? ReservePrice { get; set; }

	[Required]
	public int AuctioneerId { get; set; }
}
