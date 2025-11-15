using System.ComponentModel.DataAnnotations;
using PetalBid.Api.Domain.Enums;

namespace PetalBid.Api.DTOs;

public class RegisterUserDto
{
	[Required]
	[StringLength(100)]
	public string FullName { get; set; } = string.Empty;

	[Required]
	[EmailAddress]
	[StringLength(255)]
	public string Email { get; set; } = string.Empty;

	[Required]
	public string Password { get; set; } = string.Empty;

	[Required]
	public UserRole Role { get; set; }
}