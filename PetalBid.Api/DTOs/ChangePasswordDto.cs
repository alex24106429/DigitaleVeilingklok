using System.ComponentModel.DataAnnotations;

namespace PetalBid.Api.DTOs;

public class ChangePasswordDto
{
	[Required]
	public string CurrentPassword { get; set; } = string.Empty;

	[Required]
	public string NewPassword { get; set; } = string.Empty;
}
