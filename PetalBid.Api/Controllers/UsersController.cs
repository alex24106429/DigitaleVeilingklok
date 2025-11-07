using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetalBid.Api.Data;
using PetalBid.Api.Domain.Entities;
using PetalBid.Api.Domain.Enums;
using PetalBid.Api.DTOs;
using PetalBid.Api.Services;

namespace PetalBid.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController(AppDbContext db) : ApiControllerBase(db)
{
	[HttpGet]
	public async Task<ActionResult<List<User>>> GetAll()
	{
		var users = await Db.Users.AsNoTracking().ToListAsync();
		return Ok(users);
	}

	[HttpGet("{id:int}")]
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

	[HttpPost("register")]
	public async Task<ActionResult<UserResponseDto>> Register(RegisterUserDto registerDto)
	{
		// Check if email already exists
		var existingUser = await Db.Users.FirstOrDefaultAsync(u => u.Email == registerDto.Email);
		if (existingUser != null)
		{
			return BadRequest(new { message = "Email is already registered" });
		}

		// Hash the password
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

	[HttpPost("login")]
	public async Task<ActionResult<UserResponseDto>> Login(LoginDto loginDto)
	{
		// Find user by email
		var user = await Db.Users.FirstOrDefaultAsync(u => u.Email == loginDto.Email);
		if (user == null)
		{
			return BadRequest(new { message = "Invalid email or password" });
		}

		// Verify password
		if (!PasswordService.VerifyPassword(user.PasswordHash, loginDto.Password))
		{
			return BadRequest(new { message = "Invalid email or password" });
		}
		
		UserRole role;
		if (user is Buyer) role = UserRole.Buyer;
		else if (user is Supplier) role = UserRole.Supplier;
		else if (user is Auctioneer) role = UserRole.Auctioneer;
		else if (user is Admin) role = UserRole.Admin;
		else return StatusCode(500, "Unknown user type during login");

		var response = new UserResponseDto
		{
			Id = user.Id,
			FullName = user.FullName,
			Email = user.Email,
			Role = role
		};

		return Ok(response);
	}

	[HttpDelete("{id:int}")]
	public async Task<ActionResult> Delete(int id)
	{
		var user = await Db.Users.FindAsync(id);
		if (user is null) return NotFound();

		Db.Users.Remove(user);
		await Db.SaveChangesAsync();
		return NoContent();
	}
}
