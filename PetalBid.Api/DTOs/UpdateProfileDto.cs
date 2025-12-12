using System.ComponentModel.DataAnnotations;

namespace PetalBid.Api.DTOs;

public class UpdateProfileDto
{
	[Required]
	[StringLength(100)]
	public string FullName { get; set; } = string.Empty;

	[Required]
	[EmailAddress]
	[StringLength(255)]
	public string Email { get; set; } = string.Empty;

	public string? ImageBase64 { get; set; }
}
