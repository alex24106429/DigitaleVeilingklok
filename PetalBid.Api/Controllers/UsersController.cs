using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetalBid.Api.Data;
using PetalBid.Api.Domain.Entities;
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
	public async Task<ActionResult<User>> GetById(int id)
	{
		var user = await Db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);
		return user is null ? NotFound() : Ok(user);
	}

	[HttpPost]
	public async Task<ActionResult<User>> Create(User user)
	{
		Db.Users.Add(user);
		await Db.SaveChangesAsync();
		return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
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

		// Create new user
		var user = new User
		{
			FullName = registerDto.FullName,
			Email = registerDto.Email,
			PasswordHash = passwordHash,
			Role = registerDto.Role
		};

		Db.Users.Add(user);
		await Db.SaveChangesAsync();

		// Return user response without password hash
		var response = new UserResponseDto
		{
			Id = user.Id,
			FullName = user.FullName,
			Email = user.Email,
			Role = user.Role
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

		// Return user response without password hash
		var response = new UserResponseDto
		{
			Id = user.Id,
			FullName = user.FullName,
			Email = user.Email,
			Role = user.Role
		};

		return Ok(response);
	}

	[HttpPut("{id:int}")]
	public async Task<ActionResult<User>> Update(int id, User updated)
	{
		var existing = await Db.Users.FindAsync(id);
		if (existing is null) return NotFound();

		existing.FullName = updated.FullName;
		existing.Email = updated.Email;
		existing.PasswordHash = updated.PasswordHash;
		existing.Role = updated.Role;

		await Db.SaveChangesAsync();
		return Ok(existing);
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
