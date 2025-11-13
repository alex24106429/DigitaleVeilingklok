using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetalBid.Api.Data;
using PetalBid.Api.Domain.Entities;

namespace PetalBid.Api.Controllers;

[ApiController]
[Route("api/[controller]")]

// Haalt alle buyers uit de database.
public class BuyersController(AppDbContext db) : ApiControllerBase(db)
{
	[HttpGet]
	public async Task<ActionResult<List<Buyer>>> GetAll()
	{
		var buyers = await Db.Buyers.AsNoTracking().ToListAsync();
		return Ok(buyers);
	}

	// Haalt een specifieke buyer op basis van de ID.

	[HttpGet("{id:int}")]
	public async Task<ActionResult<Buyer>> GetById(int id)
	{
		var buyer = await Db.Buyers.AsNoTracking().FirstOrDefaultAsync(b => b.Id == id);
		return buyer is null ? NotFound() : Ok(buyer);
	}

	// Maakt een nieuwe buyer aan in de database.

	[HttpPost]
	public async Task<ActionResult<Buyer>> Create(Buyer buyer)
	{
		Db.Buyers.Add(buyer);
		await Db.SaveChangesAsync();
		return CreatedAtAction(nameof(GetById), new { id = buyer.Id }, buyer);
	}

	// Update een bestaande buyer op basis van de ID.

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
}
