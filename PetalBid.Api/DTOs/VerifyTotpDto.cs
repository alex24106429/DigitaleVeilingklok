using System.ComponentModel.DataAnnotations;

namespace PetalBid.Api.DTOs;

public class VerifyTotpDto
{
	[Required]
	[StringLength(10, MinimumLength = 6)]
	[RegularExpression("^[0-9]+$", ErrorMessage = "Code mag alleen cijfers bevatten.")]
	public string Code { get; set; } = string.Empty;
}