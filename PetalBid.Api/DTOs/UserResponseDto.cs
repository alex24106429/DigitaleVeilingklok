using PetalBid.Api.Domain.Enums;

namespace PetalBid.Api.DTOs;

public class UserResponseDto
{
	public int Id { get; set; }
	public string FullName { get; set; } = string.Empty;
	public string Email { get; set; } = string.Empty;
	public UserRole Role { get; set; }
}