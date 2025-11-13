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
public class UsersController(AppDbContext db, IConfiguration config) : ApiControllerBase(db)
{ 
	/// <summary>
	/// Retrieves all users
	/// </summary>
	private readonly IConfiguration _config = config;

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
		else return StatusCode(500, "Unknown user type");

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
			return BadRequest(new { message = "Email is already registered" });
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
				return BadRequest(new { message = "Invalid user role specified" });
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
			return Unauthorized(new { message = "Invalid email or password" });
		}

		// Verify password
		if (!PasswordService.VerifyPassword(user.PasswordHash, loginDto.Password))
		{
			return Unauthorized(new { message = "Invalid email or password" });
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
