using ImageMagick;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
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
/// Controller for all users management via ASP.NET Core Identity
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class UsersController(
	UserManager<User> userManager,
	SignInManager<User> signInManager,
	AppDbContext db,
	IConfiguration config,
	IPwnedPasswordsService pwnedPasswordsService) : ApiControllerBase(db)
{
	private readonly IConfiguration _config = config;
	private readonly IPwnedPasswordsService _pwnedPasswordsService = pwnedPasswordsService;
	private readonly UserManager<User> _userManager = userManager;
	private readonly SignInManager<User> _signInManager = signInManager;

	/// <summary>
	/// Retrieves all users
	/// </summary>
	[HttpGet]
	[Authorize(Roles = "Admin")]
	public async Task<ActionResult<List<UserResponseDto>>> GetAll()
	{
		var users = await _userManager.Users.ToListAsync();
		var dtos = new List<UserResponseDto>();

		foreach (var user in users)
		{
			dtos.Add(await MapUserAsync(user));
		}
		return Ok(dtos);
	}

	/// <summary>
	/// Retrieves a specific user
	/// </summary>
	[HttpGet("{id:int}")]
	[Authorize]
	public async Task<ActionResult<UserResponseDto>> GetById(int id)
	{
		var user = await _userManager.FindByIdAsync(id.ToString());
		if (user is null) return NotFound();

		// Check if accessing user is allowed (Self or Admin)
		var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
		if (user.Id != currentUserId && !User.IsInRole("Admin"))
		{
			return Forbid();
		}

		if (user.IsDisabled) return Unauthorized("Account is disabled.");

		return Ok(await MapUserAsync(user));
	}

	/// <summary>
	/// Registers a new user
	/// </summary>
	[HttpPost("register")]
	public async Task<ActionResult<UserResponseDto>> Register(RegisterUserDto registerDto)
	{
		// Security check: Only Admins can create Admin or Auctioneer accounts
		if (registerDto.Role == UserRole.Admin || registerDto.Role == UserRole.Auctioneer)
		{
			if (User.Identity?.IsAuthenticated != true || !User.IsInRole("Admin"))
			{
				return StatusCode(403, new { message = "Alleen beheerders kunnen Admin- of Veilingmeester-accounts aanmaken." });
			}
		}

		if (await _userManager.FindByEmailAsync(registerDto.Email) != null)
		{
			return BadRequest(new { message = "Uw e-mailadres is al geregistreerd." });
		}

		// Check Pwned Passwords
		if (await _pwnedPasswordsService.IsPasswordPwnedAsync(registerDto.Password))
		{
			return BadRequest(new { message = "Dit wachtwoord komt te vaak voor en is uitgelekt bij datalekken. Kies alstublieft een ander wachtwoord." });
		}

		// Create Entity based on Role
		User user = registerDto.Role switch
		{
			UserRole.Buyer => new Buyer { CompanyName = "Default Company" },
			UserRole.Supplier => new Supplier { CompanyName = "Default Company" },
			UserRole.Auctioneer => new Auctioneer(),
			UserRole.Admin => new Admin(),
			_ => throw new InvalidOperationException("Ongeldige gebruikersrol opgegeven.")
		};

		user.FullName = registerDto.FullName;
		user.UserName = registerDto.Email; // Identity requires UserName
		user.Email = registerDto.Email;
		user.IsDisabled = false;

		// Create User (Identity handles Hashing)
		var result = await _userManager.CreateAsync(user, registerDto.Password);
		if (!result.Succeeded)
		{
			return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });
		}

		// Assign Role
		var roleName = registerDto.Role.ToString();
		await _userManager.AddToRoleAsync(user, roleName);

		return CreatedAtAction(nameof(GetById), new { id = user.Id }, await MapUserAsync(user));
	}

	/// <summary>
	/// Logs in a user and sets an HttpOnly cookie
	/// </summary>
	[HttpPost("login")]
	public async Task<ActionResult<object>> Login(LoginDto loginDto)
	{
		var user = await _userManager.FindByEmailAsync(loginDto.Email);
		if (user == null)
		{
			return Unauthorized(new { message = "Ongeldig e-mailadres of wachtwoord." });
		}

		if (user.IsDisabled)
		{
			return Unauthorized(new { message = "Uw account is uitgeschakeld. Neem contact op met de beheerder." });
		}

		// Check Password
		var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, lockoutOnFailure: true);

		if (result.IsLockedOut)
		{
			return Unauthorized(new { message = "Account is tijdelijk geblokkeerd vanwege te veel inlogpogingen." });
		}

		if (!result.Succeeded)
		{
			return Unauthorized(new { message = "Ongeldig e-mailadres of wachtwoord." });
		}

		// Handle 2FA
		if (user.TwoFactorEnabled)
		{
			var code = loginDto.TwoFactorCode?.Trim().Replace(" ", string.Empty);
			if (string.IsNullOrWhiteSpace(code))
			{
				return Unauthorized(new { message = "Tweestapsverificatie vereist." });
			}

			// Verify TOTP code via UserManager
			var is2faValid = await _userManager.VerifyTwoFactorTokenAsync(user, _userManager.Options.Tokens.AuthenticatorTokenProvider, code);
			if (!is2faValid)
			{
				return Unauthorized(new { message = "Ongeldige 2FA-code." });
			}
		}

		// Generate JWT
		var token = await GenerateJwtTokenAsync(user);
		SetJwtCookie(token);

		return Ok(new { User = await MapUserAsync(user) });
	}

	/// <summary>
	/// Logs out the user by clearing the cookie
	/// </summary>
	[HttpPost("logout")]
	public async Task<ActionResult> Logout()
	{
		await _signInManager.SignOutAsync();

		var cookieOptions = new CookieOptions
		{
			HttpOnly = true,
			Secure = true,
			SameSite = Request.Host.Host.Contains("localhost") ? SameSiteMode.Lax : SameSiteMode.Lax,
			Domain = Request.Host.Host.Contains("localhost") ? null : ".petalbid.bid"
		};

		Response.Cookies.Delete("jwt", cookieOptions);
		return Ok(new { message = "Logged out successfully" });
	}

	/// <summary>
	/// Updates the authenticated user's profile
	/// </summary>
	[HttpPut("me")]
	[Authorize]
	public async Task<ActionResult<UserResponseDto>> UpdateMe(UpdateProfileDto dto)
	{
		var user = await _userManager.GetUserAsync(User);
		if (user is null) return Unauthorized();

		if (user.IsDisabled) return Unauthorized("Account is disabled.");

		if (user.Email != dto.Email)
		{
			var emailExists = await _userManager.FindByEmailAsync(dto.Email);
			if (emailExists != null && emailExists.Id != user.Id)
			{
				return BadRequest(new { message = "Uw e-mailadres is al geregistreerd." });
			}

			await _userManager.SetEmailAsync(user, dto.Email);
			await _userManager.SetUserNameAsync(user, dto.Email);
		}

		// Process image if provided and changed
		if (dto.ImageBase64 != null)
		{
			// If empty string, it means delete image. If content, process it.
			user.ProfileImageBase64 = string.IsNullOrWhiteSpace(dto.ImageBase64)
				? string.Empty
				: ProcessAndEncodeImage(dto.ImageBase64);
		}

		user.FullName = dto.FullName;
		await _userManager.UpdateAsync(user);

		return Ok(await MapUserAsync(user));
	}

	/// <summary>
	/// Changes the authenticated user's password
	/// </summary>
	[HttpPut("me/password")]
	[Authorize]
	public async Task<ActionResult<object>> ChangePassword(ChangePasswordDto dto)
	{
		var user = await _userManager.GetUserAsync(User);
		if (user is null) return Unauthorized();

		// Check Pwned Passwords
		if (await _pwnedPasswordsService.IsPasswordPwnedAsync(dto.NewPassword))
		{
			return BadRequest(new { message = "Dit wachtwoord komt te vaak voor en is uitgelekt bij datalekken." });
		}

		var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);

		if (!result.Succeeded)
		{
			return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });
		}

		return Ok(new { message = "Wachtwoord succesvol gewijzigd." });
	}

	/// <summary>
	/// Starts the TOTP setup for the authenticated user
	/// </summary>
	[HttpPost("me/totp/setup")]
	[Authorize]
	public async Task<ActionResult<TotpSetupResponseDto>> BeginTotpSetup()
	{
		var user = await _userManager.GetUserAsync(User);
		if (user is null) return Unauthorized();

		// Reset/Generate new key
		await _userManager.ResetAuthenticatorKeyAsync(user);
		var unformattedKey = await _userManager.GetAuthenticatorKeyAsync(user);

		var otpauthUrl = GenerateOtpAuthUri(unformattedKey!, user.Email!, "PetalBid");

		return Ok(new TotpSetupResponseDto { Secret = unformattedKey!, OtpauthUrl = otpauthUrl });
	}

	/// <summary>
	/// Confirms the TOTP setup with a code from the authenticator app
	/// </summary>
	[HttpPost("me/totp/verify")]
	[Authorize]
	public async Task<ActionResult<UserResponseDto>> VerifyTotp(VerifyTotpDto dto)
	{
		var user = await _userManager.GetUserAsync(User);
		if (user is null) return Unauthorized();

		var code = dto.Code.Replace(" ", string.Empty).Replace("-", string.Empty);

		var isTokenValid = await _userManager.VerifyTwoFactorTokenAsync(user, _userManager.Options.Tokens.AuthenticatorTokenProvider, code);

		if (!isTokenValid)
		{
			return BadRequest(new { message = "Ongeldige 2FA-code." });
		}

		await _userManager.SetTwoFactorEnabledAsync(user, true);

		return Ok(await MapUserAsync(user));
	}

	/// <summary>
	/// Disables TOTP for the authenticated user
	/// </summary>
	[HttpPost("me/totp/disable")]
	[Authorize]
	public async Task<ActionResult<UserResponseDto>> DisableTotp(DisableTotpDto dto)
	{
		var user = await _userManager.GetUserAsync(User);
		if (user is null) return Unauthorized();

		if (!user.TwoFactorEnabled)
		{
			return BadRequest(new { message = "Tweestapsverificatie is niet ingeschakeld." });
		}

		// Verify code before disabling
		var code = dto.Code.Replace(" ", string.Empty);
		var isTokenValid = await _userManager.VerifyTwoFactorTokenAsync(user, _userManager.Options.Tokens.AuthenticatorTokenProvider, code);

		if (!isTokenValid)
		{
			return BadRequest(new { message = "Ongeldige 2FA-code." });
		}

		await _userManager.SetTwoFactorEnabledAsync(user, false);
		await _userManager.ResetAuthenticatorKeyAsync(user); // Optional: Clear the secret

		return Ok(await MapUserAsync(user));
	}

	/// <summary>
	/// Updates a specific user (Admin only)
	/// </summary>
	[HttpPut("{id:int}")]
	[Authorize(Roles = "Admin")]
	public async Task<ActionResult<UserResponseDto>> UpdateUser(int id, AdminUpdateUserDto dto)
	{
		var user = await _userManager.FindByIdAsync(id.ToString());
		if (user is null) return NotFound();

		// Update Email
		if (user.Email != dto.Email)
		{
			var conflict = await _userManager.FindByEmailAsync(dto.Email);
			if (conflict != null && conflict.Id != id)
			{
				return BadRequest(new { message = "Het e-mailadres is al in gebruik." });
			}
			await _userManager.SetEmailAsync(user, dto.Email);
			await _userManager.SetUserNameAsync(user, dto.Email);
		}

		user.FullName = dto.FullName;
		user.IsDisabled = dto.IsDisabled;

		await _userManager.UpdateAsync(user);
		return Ok(await MapUserAsync(user));
	}

	/// <summary>
	/// Forcefully resets a user's password (Admin only)
	/// </summary>
	[HttpPut("{id:int}/password")]
	[Authorize(Roles = "Admin")]
	public async Task<ActionResult> AdminResetPassword(int id, AdminResetPasswordDto dto)
	{
		var user = await _userManager.FindByIdAsync(id.ToString());
		if (user is null) return NotFound();

		var token = await _userManager.GeneratePasswordResetTokenAsync(user);
		var result = await _userManager.ResetPasswordAsync(user, token, dto.NewPassword);

		if (!result.Succeeded)
		{
			return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });
		}

		return Ok(new { message = "Wachtwoord succesvol gewijzigd." });
	}

	/// <summary>
	/// Deletes a user
	/// </summary>
	[HttpDelete("{id:int}")]
	[Authorize(Roles = "Admin")]
	public async Task<ActionResult> Delete(int id)
	{
		var user = await _userManager.FindByIdAsync(id.ToString());
		if (user is null) return NotFound();

		await _userManager.DeleteAsync(user);
		return NoContent();
	}

	// Helpers

	private async Task<UserResponseDto> MapUserAsync(User user)
	{
		var roles = await _userManager.GetRolesAsync(user);
		var roleString = roles.FirstOrDefault() ?? "Buyer"; // Default fallback
		Enum.TryParse(roleString, out UserRole roleEnum);

		return new UserResponseDto
		{
			Id = user.Id,
			FullName = user.FullName,
			Email = user.Email!,
			Role = roleEnum,
			IsTotpEnabled = user.TwoFactorEnabled,
			IsDisabled = user.IsDisabled,
			ProfileImageBase64 = user.ProfileImageBase64
		};
	}

	private async Task<string> GenerateJwtTokenAsync(User user)
	{
		var roles = await _userManager.GetRolesAsync(user);
		var claims = new List<Claim>
		{
			new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
			new Claim(JwtRegisteredClaimNames.Email, user.Email!),
			new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
		};

		foreach (var role in roles)
		{
			claims.Add(new Claim(ClaimTypes.Role, role));
		}

		var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
		var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

		var token = new JwtSecurityToken(
			issuer: _config["Jwt:Issuer"],
			audience: _config["Jwt:Audience"],
			claims: claims,
			expires: DateTime.UtcNow.AddHours(2),
			signingCredentials: credentials);

		return new JwtSecurityTokenHandler().WriteToken(token);
	}

	private void SetJwtCookie(string token)
	{
		var cookieOptions = new CookieOptions
		{
			HttpOnly = true,
			Secure = true, // Always true for production/HTTPS
			Expires = DateTime.UtcNow.AddHours(2)
		};

		if (Request.Host.Host.Contains("localhost"))
		{
			cookieOptions.SameSite = SameSiteMode.Lax;
		}
		else
		{
			cookieOptions.SameSite = SameSiteMode.Lax;
			cookieOptions.Domain = ".petalbid.bid";
		}

		Response.Cookies.Append("jwt", token, cookieOptions);
	}

	private static string GenerateOtpAuthUri(string secret, string email, string issuer)
	{
		var label = Uri.EscapeDataString($"{issuer}:{email}");
		var issuerEncoded = Uri.EscapeDataString(issuer);
		return $"otpauth://totp/{label}?secret={secret}&issuer={issuerEncoded}&digits=6";
	}

	/// <summary>
	/// Processes the input base64 string:
	/// 1. Decodes base64
	/// 2. Crops to square (center)
	/// 3. Resizes to max 512x512 for profiles
	/// 4. Converts to AVIF at 30% quality
	/// 5. Returns base64 string
	/// </summary>
	private static string ProcessAndEncodeImage(string inputBase64)
	{
		if (string.IsNullOrWhiteSpace(inputBase64)) return string.Empty;

		try
		{
			// Remove data URI prefix if present (e.g. "data:image/png;base64,")
			var commaIndex = inputBase64.IndexOf(',');
			var cleanBase64 = commaIndex != -1 ? inputBase64[(commaIndex + 1)..] : inputBase64;

			var imageBytes = Convert.FromBase64String(cleanBase64);

			using var image = new MagickImage(imageBytes);

			// 1. Crop to square (Center)
			// Explicitly cast to int to avoid long/uint mismatch errors during calculation
			var width = (int)image.Width;
			var height = (int)image.Height;
			var size = Math.Min(width, height);

			if (width != height)
			{
				var x = (width - size) / 2;
				var y = (height - size) / 2;

				// MagickGeometry expects (int x, int y, uint width, uint height)
				image.Crop(new MagickGeometry(x, y, (uint)size, (uint)size));
			}

			// 2. Downscale to max 512x512 for profile pictures
			if (size > 512)
			{
				image.Resize(512, 512);
			}

			// 3. Convert to AVIF with 30% quality
			image.Format = MagickFormat.Avif;
			image.Quality = 30;

			// 4. Return as Base64 Data URI
			return "data:image/avif;base64," + image.ToBase64();
		}
		catch (Exception)
		{
			// Fallback or error handling: return empty to indicate failure to process
			return string.Empty;
		}
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
