using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetalBid.Api.Data;
using PetalBid.Api.Domain.Entities;

namespace PetalBid.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminsController(AppDbContext db) : ApiControllerBase(db)
{
	[HttpGet]
	public async Task<ActionResult<List<Admin>>> GetAll()
	{
		var admins = await Db.Admins.AsNoTracking().ToListAsync();
		return Ok(admins);
	}

	[HttpGet("{id:int}")]
	public async Task<ActionResult<Admin>> GetById(int id)
	{
		var admin = await Db.Admins.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id);
		return admin is null ? NotFound() : Ok(admin);
	}

	[HttpPost]
	public async Task<ActionResult<Admin>> Create(Admin admin)
	{
		Db.Admins.Add(admin);
		await Db.SaveChangesAsync();
		return CreatedAtAction(nameof(GetById), new { id = admin.Id }, admin);
	}

	[HttpPut("{id:int}")]
	public async Task<ActionResult<Admin>> Update(int id, Admin updated)
	{
		var existing = await Db.Admins.FindAsync(id);
		if (existing is null) return NotFound();

		existing.FullName = updated.FullName;
		existing.Email = updated.Email;

		await Db.SaveChangesAsync();
		return Ok(existing);
	}

	[HttpDelete("{id:int}")]
	public async Task<ActionResult> Delete(int id)
	{
		var admin = await Db.Admins.FindAsync(id);
		if (admin is null) return NotFound();

		Db.Admins.Remove(admin);
		await Db.SaveChangesAsync();
		return NoContent();
	}
}
