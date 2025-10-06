using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetalBid.Api.Data;
using PetalBid.Api.Domain.Entities;

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
}
