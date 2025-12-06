using Microsoft.AspNetCore.Identity;

namespace PetalBid.Api.Domain.Entities;

// Inherit from IdentityUser<int> to use integer Primary Keys
public abstract class User : IdentityUser<int>
{
	public string FullName { get; set; } = string.Empty;
	
	public bool IsDisabled { get; set; }
}