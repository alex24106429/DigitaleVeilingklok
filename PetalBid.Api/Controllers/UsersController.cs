using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PetalBid.Api.Data;
using PetalBid.Api.Domain.Entities;
using PetalBid.Api.Domain.Enums;
using PetalBid.Api.DTOs;
using PetalBid.Api.Services;
using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace PetalBid.Api.Controllers;

/// <summary>
/// Controller for all users
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class UsersController(
	AppDbContext db,
	IConfiguration config,
	IPwnedPasswordsService pwnedPasswordsService,
	ITotpService totpService) : ApiControllerBase(db)
{
	private readonly IConfiguration _config = config;
	private readonly IPwnedPasswordsService _pwnedPasswordsService = pwnedPasswordsService;
	private readonly ITotpService _totpService = totpService;

	/// <summary>
	/// Retrieves all users
	/// </summary>
	[HttpGet]
	[Authorize(Roles = "Admin")]
	public async Task<ActionResult<List<UserResponseDto>>> GetAll()
	{
		var users = await Db.Users.AsNoTracking().ToListAsync();
		var responseDtos = users.Select(MapUser).ToList();
		return Ok(responseDtos);
	}

	/// <summary>
	/// Retrieves a specific user
	/// </summary>
	[HttpGet("{id:int}")]
	[Authorize]
	public async Task<ActionResult<UserResponseDto>> GetById(int id)
	{
		var user = await Db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);
		if (user is null) return NotFound();

		// Optional: Prevent disabled users from retrieving data if they still have a token
		if (user.IsDisabled) return Unauthorized("Account is disabled.");

		return Ok(MapUser(user));
	}

	/// <summary>
	/// Registers a new user
	/// </summary>
	[HttpPost("register")]
	public async Task<ActionResult<UserResponseDto>> Register(RegisterUserDto registerDto)
	{

		var existingUser = await Db.Users.FirstOrDefaultAsync(u => u.Email == registerDto.Email);
		if (existingUser != null)
		{
			return BadRequest(new { message = "Uw e-mailadres is al geregistreerd." });
		}

		var (isValid, errorMessage) = PasswordService.ValidatePasswordRequirements(registerDto.Password);
		if (!isValid)
		{
			return BadRequest(new { message = errorMessage });
		}

		// Check if the password has been exposed in a data breach
		if (await _pwnedPasswordsService.IsPasswordPwnedAsync(registerDto.Password))
		{
			return BadRequest(new { message = "Dit wachtwoord komt te vaak voor en is uitgelekt bij datalekken. Kies alstublieft een ander wachtwoord." });
		}

		var passwordHash = PasswordService.HashPassword(registerDto.Password);

		User user = registerDto.Role switch
		{
			UserRole.Buyer => new Buyer { CompanyName = "Default Company" },
			UserRole.Supplier => new Supplier { CompanyName = "Default Company" },
			UserRole.Auctioneer => new Auctioneer(),
			UserRole.Admin => new Admin(),
			_ => throw new InvalidOperationException("Ongeldige gebruikersrol opgegeven.")
		};

		user.FullName = registerDto.FullName;
		user.Email = registerDto.Email;
		user.PasswordHash = passwordHash;
		user.IsTotpEnabled = false;
		user.IsDisabled = false;

		Db.Users.Add(user);
		await Db.SaveChangesAsync();

		return CreatedAtAction(nameof(GetById), new { id = user.Id }, MapUser(user));
	}

	/// <summary>
	/// Logs in a user and sets an HttpOnly cookie
	/// </summary>
	[HttpPost("login")]
	public async Task<ActionResult<object>> Login(LoginDto loginDto)
	{
		// Find user by email
		var user = await Db.Users.FirstOrDefaultAsync(u => u.Email == loginDto.Email);
		if (user == null)
		{
			return Unauthorized(new { message = "Ongeldig e-mailadres of wachtwoord." });
		}

		if (user.IsDisabled)
		{
			return Unauthorized(new { message = "Uw account is uitgeschakeld. Neem contact op met de beheerder." });
		}

		// Verify password
		if (!PasswordService.VerifyPassword(user.PasswordHash, loginDto.Password))
		{
			return Unauthorized(new { message = "Ongeldig e-mailadres of wachtwoord." });
		}

		if (user.IsTotpEnabled)
		{
			if (string.IsNullOrEmpty(user.TotpSecret))
			{
				return StatusCode(500, "TOTP-configuratie ontbreekt voor deze gebruiker.");
			}

			var code = loginDto.TwoFactorCode?.Trim();
			if (string.IsNullOrWhiteSpace(code))
			{
				return Unauthorized(new { message = "Tweestapsverificatie vereist." });
			}

			if (!_totpService.ValidateCode(user.TotpSecret, code))
			{
				return Unauthorized(new { message = "Ongeldige 2FA-code." });
			}
		}

		var token = GenerateJwtToken(user, GetRole(user));

		// Set HttpOnly Cookie
		var cookieOptions = new CookieOptions
		{
			HttpOnly = true,
			Secure = true, // Always true for production/HTTPS
			Expires = DateTime.UtcNow.AddHours(2)
		};

		// Determine Domain and SameSite based on environment
		if (Request.Host.Host.Contains("localhost"))
		{
			cookieOptions.SameSite = SameSiteMode.Lax;
		}
		else
		{
			cookieOptions.SameSite = SameSiteMode.Lax;
			// Set the domain so the cookie is shared between api.petalbid.bid and petalbid.bid
			cookieOptions.Domain = ".petalbid.bid";
		}

		Response.Cookies.Append("jwt", token, cookieOptions);

		// Do not return token in body
		return Ok(new { User = MapUser(user) });
	}

	/// <summary>
	/// Logs out the user by clearing the cookie
	/// </summary>
	[HttpPost("logout")]
	public ActionResult Logout()
	{
		var cookieOptions = new CookieOptions
		{
			HttpOnly = true,
			Secure = true
		};

		// To delete a cookie, the options (Domain/Path) must match exactly how it was created
		if (Request.Host.Host.Contains("localhost"))
		{
			cookieOptions.SameSite = SameSiteMode.Lax;
		}
		else
		{
			cookieOptions.SameSite = SameSiteMode.Lax;
			cookieOptions.Domain = ".petalbid.bid";
		}

		Response.Cookies.Delete("jwt", cookieOptions);
		return Ok(new { message = "Logged out successfully" });
	}

	/// <summary>
	/// Updates the authenticated user's profile (name + email)
	/// </summary>
	[HttpPut("me")]
	[Authorize]
	public async Task<ActionResult<UserResponseDto>> UpdateMe(UpdateProfileDto dto)
	{
		var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
		if (userIdString is null) return Unauthorized();

		var userId = int.Parse(userIdString);
		var existing = await Db.Users.FindAsync(userId);
		if (existing is null) return NotFound();

		if (existing.IsDisabled) return Unauthorized("Account is disabled.");

		// Enforce unique email across users (except current)
		var emailExists = await Db.Users.AnyAsync(u => u.Email == dto.Email && u.Id != userId);
		if (emailExists)
		{
			return BadRequest(new { message = "Uw e-mailadres is al geregistreerd." });
		}

		existing.FullName = dto.FullName;
		existing.Email = dto.Email;

		await Db.SaveChangesAsync();
		return Ok(MapUser(existing));
	}

	/// <summary>
	/// Changes the authenticated user's password
	/// </summary>
	[HttpPut("me/password")]
	[Authorize]
	public async Task<ActionResult<object>> ChangePassword(ChangePasswordDto dto)
	{
		var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
		if (userIdString is null) return Unauthorized();

		var userId = int.Parse(userIdString);
		var existing = await Db.Users.FindAsync(userId);
		if (existing is null) return NotFound();

		if (existing.IsDisabled) return Unauthorized("Account is disabled.");

		if (!PasswordService.VerifyPassword(existing.PasswordHash, dto.CurrentPassword))
		{
			return BadRequest(new { message = "Huidig wachtwoord is onjuist." });
		}

		var (isValid, errorMessage) = PasswordService.ValidatePasswordRequirements(dto.NewPassword);
		if (!isValid)
		{
			return BadRequest(new { message = errorMessage });
		}

		// Check if the new password has been exposed in a data breach
		if (await _pwnedPasswordsService.IsPasswordPwnedAsync(dto.NewPassword))
		{
			return BadRequest(new { message = "Dit wachtwoord komt te vaak voor en is uitgelekt bij datalekken. Kies alstublieft een ander wachtwoord." });
		}

		existing.PasswordHash = PasswordService.HashPassword(dto.NewPassword);
		await Db.SaveChangesAsync();

		return Ok(new { message = "Wachtwoord succesvol gewijzigd." });
	}

	/// <summary>
	/// Starts the TOTP setup for the authenticated user
	/// </summary>
	[HttpPost("me/totp/setup")]
	[Authorize]
	public async Task<ActionResult<TotpSetupResponseDto>> BeginTotpSetup()
	{
		var user = await GetCurrentUserAsync();
		if (user is null) return Unauthorized();
		if (user.IsDisabled) return Unauthorized("Account is disabled.");

		if (user.IsTotpEnabled)
		{
			return BadRequest(new { message = "Tweestapsverificatie is al ingeschakeld. Schakel het eerst uit om opnieuw te configureren." });
		}

		var secret = _totpService.GenerateSecret();
		user.TotpSecret = secret;
		user.IsTotpEnabled = false;
		await Db.SaveChangesAsync();

		var otpauthUrl = _totpService.BuildOtpAuthUri(secret, user.Email, "PetalBid");
		return Ok(new TotpSetupResponseDto { Secret = secret, OtpauthUrl = otpauthUrl });
	}

	/// <summary>
	/// Confirms the TOTP setup with a code from the authenticator app
	/// </summary>
	[HttpPost("me/totp/verify")]
	[Authorize]
	public async Task<ActionResult<UserResponseDto>> VerifyTotp(VerifyTotpDto dto)
	{
		var user = await GetCurrentUserAsync();
		if (user is null) return Unauthorized();
		if (user.IsDisabled) return Unauthorized("Account is disabled.");

		if (string.IsNullOrEmpty(user.TotpSecret))
		{
			return BadRequest(new { message = "Geen TOTP-configuratie gevonden. Start de setup opnieuw." });
		}

		if (!_totpService.ValidateCode(user.TotpSecret, dto.Code))
		{
			return BadRequest(new { message = "Ongeldige 2FA-code." });
		}

		user.IsTotpEnabled = true;
		await Db.SaveChangesAsync();

		return Ok(MapUser(user));
	}

	/// <summary>
	/// Disables TOTP for the authenticated user
	/// </summary>
	[HttpPost("me/totp/disable")]
	[Authorize]
	public async Task<ActionResult<UserResponseDto>> DisableTotp(DisableTotpDto dto)
	{
		var user = await GetCurrentUserAsync();
		if (user is null) return Unauthorized();
		if (user.IsDisabled) return Unauthorized("Account is disabled.");

		if (!user.IsTotpEnabled || string.IsNullOrEmpty(user.TotpSecret))
		{
			return BadRequest(new { message = "Tweestapsverificatie is niet ingeschakeld." });
		}

		if (!_totpService.ValidateCode(user.TotpSecret, dto.Code))
		{
			return BadRequest(new { message = "Ongeldige 2FA-code." });
		}

		user.IsTotpEnabled = false;
		user.TotpSecret = null;
		await Db.SaveChangesAsync();

		return Ok(MapUser(user));
	}

	/// <summary>
	/// Updates a specific user (Admin only)
	/// </summary>
	[HttpPut("{id:int}")]
	[Authorize(Roles = "Admin")]
	public async Task<ActionResult<UserResponseDto>> UpdateUser(int id, AdminUpdateUserDto dto)
	{
		var user = await Db.Users.FindAsync(id);
		if (user is null) return NotFound();

		// Enforce unique email
		var emailExists = await Db.Users.AnyAsync(u => u.Email == dto.Email && u.Id != id);
		if (emailExists)
		{
			return BadRequest(new { message = "Het e-mailadres is al in gebruik." });
		}

		// Ensure role isn't changed
		var currentRole = GetRole(user);
		if (currentRole != dto.Role)
		{
			return BadRequest(new { message = "Het wijzigen van de gebruikersrol is niet mogelijk." });
		}

		user.FullName = dto.FullName;
		user.Email = dto.Email;
		user.IsDisabled = dto.IsDisabled;

		await Db.SaveChangesAsync();
		return Ok(MapUser(user));
	}

	/// <summary>
	/// Forcefully resets a user's password (Admin only)
	/// </summary>
	[HttpPut("{id:int}/password")]
	[Authorize(Roles = "Admin")]
	public async Task<ActionResult> AdminResetPassword(int id, AdminResetPasswordDto dto)
	{
		var user = await Db.Users.FindAsync(id);
		if (user is null) return NotFound();

		var (isValid, errorMessage) = PasswordService.ValidatePasswordRequirements(dto.NewPassword);
		if (!isValid)
		{
			return BadRequest(new { message = errorMessage });
		}

		user.PasswordHash = PasswordService.HashPassword(dto.NewPassword);

		await Db.SaveChangesAsync();

		return Ok(new { message = "Wachtwoord succesvol gewijzigd." });
	}

	/// <summary>
	/// Deletes a user
	/// </summary>
	[HttpDelete("{id:int}")]
	[Authorize(Roles = "Admin")]
	public async Task<ActionResult> Delete(int id)
	{
		var user = await Db.Users.FindAsync(id);
		if (user is null) return NotFound();

		Db.Users.Remove(user);
		await Db.SaveChangesAsync();
		return NoContent();
	}

	private async Task<User?> GetCurrentUserAsync()
	{
		var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
		if (string.IsNullOrWhiteSpace(userIdString)) return null;

		var userId = int.Parse(userIdString);
		return await Db.Users.FindAsync(userId);
	}

	private UserResponseDto MapUser(User user)
	{
		return new UserResponseDto
		{
			Id = user.Id,
			FullName = user.FullName,
			Email = user.Email,
			Role = GetRole(user),
			IsTotpEnabled = user.IsTotpEnabled,
			IsDisabled = user.IsDisabled
		};
	}

	private static UserRole GetRole(User user) => user switch
	{
		Buyer => UserRole.Buyer,
		Supplier => UserRole.Supplier,
		Auctioneer => UserRole.Auctioneer,
		Admin => UserRole.Admin,
		_ => throw new InvalidOperationException($"Onbekend gebruikerstype voor gebruiker {user.Id}")
	};

	/// <summary>
	/// Generates a JWT token for the authenticated user
	/// </summary>
	private string GenerateJwtToken(User user, UserRole role)
	{
		var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
		var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

		var claims = new[]
		{
			new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
			new Claim(JwtRegisteredClaimNames.Email, user.Email),
			new Claim(ClaimTypes.Role, role.ToString())
		};

		var token = new JwtSecurityToken(
			issuer: _config["Jwt:Issuer"],
			audience: _config["Jwt:Audience"],
			claims: claims,
			expires: DateTime.UtcNow.AddHours(2),
			signingCredentials: credentials);

		return new JwtSecurityTokenHandler().WriteToken(token);
	}
}

public class AdminUpdateUserDto
{
	[Required]
	[StringLength(100)]
	public string FullName { get; set; } = string.Empty;

	[Required]
	[EmailAddress]
	[StringLength(255)]
	public string Email { get; set; } = string.Empty;

	[Required]
	public UserRole Role { get; set; }

	public bool IsDisabled { get; set; }
}

public class AdminResetPasswordDto
{
	[Required]
	public string NewPassword { get; set; } = string.Empty;
}