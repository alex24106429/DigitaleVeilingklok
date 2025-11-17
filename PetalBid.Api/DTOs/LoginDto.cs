using System.ComponentModel.DataAnnotations;

namespace PetalBid.Api.DTOs;

public class LoginDto
{
	[Required]
	[EmailAddress]
	public string Email { get; set; } = string.Empty;

	[Required]
	public string Password { get; set; } = string.Empty;

	[StringLength(10)]
	[RegularExpression("^[0-9]*$", ErrorMessage = "2FA-code mag alleen cijfers bevatten.")]
	public string? TwoFactorCode { get; set; }
}