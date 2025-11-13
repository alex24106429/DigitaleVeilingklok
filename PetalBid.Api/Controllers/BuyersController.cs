using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetalBid.Api.Data;
using PetalBid.Api.Domain.Entities;

namespace PetalBid.Api.Controllers;
/// <summary>
/// Controller for "buyer" users
/// Only "buyers" can acces the endpoints
/// </summary>

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class BuyersController(AppDbContext db) : ApiControllerBase(db)
{
	/// <summary>
	/// Retrieves all "Buyers"
	/// </summary>
	
	[HttpGet]
	public async Task<ActionResult<List<Buyer>>> GetAll()
	{
		var buyers = await Db.Buyers.AsNoTracking().ToListAsync();
		return Ok(buyers);
	}
    /// <summary>
	/// Retrieves a specific "buyer"
	/// </summary>

	[HttpGet("{id:int}")]
	public async Task<ActionResult<Buyer>> GetById(int id)
	{
		var buyer = await Db.Buyers.AsNoTracking().FirstOrDefaultAsync(b => b.Id == id);
		return buyer is null ? NotFound() : Ok(buyer);
	}
    /// <summary>
	/// Updates a "buyer"
	/// </summary>
	[HttpPut("{id:int}")]
	public async Task<ActionResult<Buyer>> Update(int id, Buyer updated)
	{
		var existing = await Db.Buyers.FindAsync(id);
		if (existing is null) return NotFound();

		existing.CompanyName = updated.CompanyName;
		existing.FullName = updated.FullName;
		existing.Email = updated.Email;

		await Db.SaveChangesAsync();
		return Ok(existing);
	}
     /// <summary>
     /// Deletes a "buyer"
     /// </summary>

	[HttpDelete("{id:int}")]
	public async Task<ActionResult> Delete(int id)
	{
		var buyer = await Db.Buyers.FindAsync(id);
		if (buyer is null) return NotFound();

		Db.Buyers.Remove(buyer);
		await Db.SaveChangesAsync();
		return NoContent();
	}
}
