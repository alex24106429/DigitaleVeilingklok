using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PetalBid.Api.Data;
using PetalBid.Api.Domain.Entities;
using PetalBid.Api.Domain.Enums;
using PetalBid.Api.DTOs;
using PetalBid.Api.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace PetalBid.Api.Controllers;
/// <summary>
/// Controller for all users
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class UsersController(AppDbContext db, IConfiguration config, IPwnedPasswordsService pwnedPasswordsService) : ApiControllerBase(db)
{
	/// <summary>
	/// Retrieves all users
	/// </summary>
	private readonly IConfiguration _config = config;
	private readonly IPwnedPasswordsService _pwnedPasswordsService = pwnedPasswordsService;

	[HttpGet]
	[Authorize(Roles = "Admin")]
	public async Task<ActionResult<List<UserResponseDto>>> GetAll()
	{
		var users = await Db.Users.AsNoTracking().ToListAsync();
		var responseDtos = users.Select(user =>
		{
			UserRole role;
			if (user is Buyer) role = UserRole.Buyer;
			else if (user is Supplier) role = UserRole.Supplier;
			else if (user is Auctioneer) role = UserRole.Auctioneer;
			else if (user is Admin) role = UserRole.Admin;
			else
			{
				// This case should ideally not be hit if data is consistent
				throw new InvalidOperationException($"Unknown user type found for user ID {user.Id}");
			}

			return new UserResponseDto
			{
				Id = user.Id,
				FullName = user.FullName,
				Email = user.Email,
				Role = role
			};
		}).ToList();

		return Ok(responseDtos);
	}
	/// <summary>
	/// Retrieves a specific user
	/// </summary>
	/// <param name="id"></param>
	/// <returns></returns>
	[HttpGet("{id:int}")]
	[Authorize]
	public async Task<ActionResult<UserResponseDto>> GetById(int id)
	{
		var user = await Db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);
		if (user is null) return NotFound();

		UserRole role;
		if (user is Buyer) role = UserRole.Buyer;
		else if (user is Supplier) role = UserRole.Supplier;
		else if (user is Auctioneer) role = UserRole.Auctioneer;
		else if (user is Admin) role = UserRole.Admin;
		else return StatusCode(500, "Onbekend gebruikerstype.");

		var response = new UserResponseDto
		{
			Id = user.Id,
			FullName = user.FullName,
			Email = user.Email,
			Role = role
		};
		return Ok(response);
	}
	/// <summary>
	/// Registers a new user
	/// </summary>
	/// <param name="registerDto"></param>
	/// <returns></returns>
	[HttpPost("register")]
	public async Task<ActionResult<UserResponseDto>> Register(RegisterUserDto registerDto)
	{

		var existingUser = await Db.Users.FirstOrDefaultAsync(u => u.Email == registerDto.Email);
		if (existingUser != null)
		{
			return BadRequest(new { message = "Uw e-mailadres is al geregistreerd." });
		}

		// Check if the password has been exposed in a data breach
		if (await _pwnedPasswordsService.IsPasswordPwnedAsync(registerDto.Password))
		{
			return BadRequest(new { message = "Dit wachtwoord komt te vaak voor en is uitgelekt bij datalekken. Kies alstublieft een ander wachtwoord." });
		}

		var passwordHash = PasswordService.HashPassword(registerDto.Password);

		User user;
		switch (registerDto.Role)
		{
			case UserRole.Buyer:
				user = new Buyer { CompanyName = "Default Company" };
				break;
			case UserRole.Supplier:
				user = new Supplier { CompanyName = "Default Company" };
				break;
			case UserRole.Auctioneer:
				user = new Auctioneer();
				break;
			case UserRole.Admin:
				user = new Admin();
				break;
			default:
				return BadRequest(new { message = "Ongeldige gebruikersrol opgegeven." });
		}

		user.FullName = registerDto.FullName;
		user.Email = registerDto.Email;
		user.PasswordHash = passwordHash;

		Db.Users.Add(user);
		await Db.SaveChangesAsync();

		// Return user response without password hash
		var response = new UserResponseDto
		{
			Id = user.Id,
			FullName = user.FullName,
			Email = user.Email,
			Role = registerDto.Role
		};

		return CreatedAtAction(nameof(GetById), new { id = user.Id }, response);
	}
	/// <summary>
	/// Logs in a user
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

		// Verify password
		if (!PasswordService.VerifyPassword(user.PasswordHash, loginDto.Password))
		{
			return Unauthorized(new { message = "Ongeldig e-mailadres of wachtwoord." });
		}

		UserRole role;
		if (user is Buyer) role = UserRole.Buyer;
		else if (user is Supplier) role = UserRole.Supplier;
		else if (user is Auctioneer) role = UserRole.Auctioneer;
		else if (user is Admin) role = UserRole.Admin;
		else return StatusCode(500, "Unknown user type during login");

		var token = GenerateJwtToken(user, role);

		var response = new UserResponseDto
		{
			Id = user.Id,
			FullName = user.FullName,
			Email = user.Email,
			Role = role
		};

		return Ok(new { Token = token, User = response });
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

		// Enforce unique email across users (except current)
		var emailExists = await Db.Users.AnyAsync(u => u.Email == dto.Email && u.Id != userId);
		if (emailExists)
		{
			return BadRequest(new { message = "Uw e-mailadres is al geregistreerd." });
		}

		existing.FullName = dto.FullName;
		existing.Email = dto.Email;

		await Db.SaveChangesAsync();

		UserRole role = existing switch
		{
			Buyer => UserRole.Buyer,
			Supplier => UserRole.Supplier,
			Auctioneer => UserRole.Auctioneer,
			Admin => UserRole.Admin,
			_ => throw new InvalidOperationException("Onbekend gebruikerstype.")
		};

		var response = new UserResponseDto
		{
			Id = existing.Id,
			FullName = existing.FullName,
			Email = existing.Email,
			Role = role
		};

		return Ok(response);
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

		if (!PasswordService.VerifyPassword(existing.PasswordHash, dto.CurrentPassword))
		{
			return BadRequest(new { message = "Huidig wachtwoord is onjuist." });
		}

		if (string.IsNullOrWhiteSpace(dto.NewPassword) || dto.NewPassword.Length < 6)
		{
			return BadRequest(new { message = "Nieuw wachtwoord moet minimaal 6 karakters zijn." });
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
			expires: DateTime.Now.AddHours(2),
			signingCredentials: credentials);

		return new JwtSecurityTokenHandler().WriteToken(token);
	}
}
