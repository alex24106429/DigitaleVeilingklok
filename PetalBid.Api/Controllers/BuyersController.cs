using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetalBid.Api.Data;
using PetalBid.Api.Domain.Entities;

namespace PetalBid.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BuyersController(AppDbContext db) : ApiControllerBase(db)
{
	[HttpGet]
	public async Task<ActionResult<List<Buyer>>> GetAll()
	{
		var buyers = await Db.Buyers.AsNoTracking().ToListAsync();
		return Ok(buyers);
	}

	[HttpGet("{id:int}")]
	public async Task<ActionResult<Buyer>> GetById(int id)
	{
		var buyer = await Db.Buyers.AsNoTracking().FirstOrDefaultAsync(b => b.Id == id);
		return buyer is null ? NotFound() : Ok(buyer);
	}

	[HttpPost]
	public async Task<ActionResult<Buyer>> Create(Buyer buyer)
	{
		Db.Buyers.Add(buyer);
		await Db.SaveChangesAsync();
		return CreatedAtAction(nameof(GetById), new { id = buyer.Id }, buyer);
	}

	[HttpPut("{id:int}")]
	public async Task<ActionResult<Buyer>> Update(int id, Buyer updated)
	{
		var existing = await Db.Buyers.FindAsync(id);
		if (existing is null) return NotFound();

		existing.CompanyName = updated.CompanyName;
		existing.UserId = updated.UserId;

		await Db.SaveChangesAsync();
		return Ok(existing);
	}

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
