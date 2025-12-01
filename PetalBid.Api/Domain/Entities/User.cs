namespace PetalBid.Api.Domain.Entities;

public abstract class User
{
	public int Id { get; set; }
	public string FullName { get; set; } = string.Empty;
	public string Email { get; set; } = string.Empty;
	public string PasswordHash { get; set; } = string.Empty;
	public bool IsTotpEnabled { get; set; }
	public string? TotpSecret { get; set; }
	public bool IsDisabled { get; set; }
}
