using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetalBid.Api.Data;
using PetalBid.Api.Domain.Entities;

namespace PetalBid.Api.Controllers;

[ApiController]
[Route("api/[controller]")]

// Haalt alle auctions uit de database.
public class AuctionsController(AppDbContext db) : ApiControllerBase(db)
{
	[HttpGet]
	public async Task<ActionResult<List<Auction>>> GetAll()
	{
		var auctions = await Db.Auctions
			.AsNoTracking()
			.ToListAsync();

		return Ok(auctions);
	}

	// Haalt een specifieke auction op basis van de ID.

	[HttpGet("{id:int}")]
	public async Task<ActionResult<Auction>> GetById(int id)
	{
		var auction = await Db.Auctions
			.AsNoTracking()
			.FirstOrDefaultAsync(a => a.Id == id);

		return auction is null ? NotFound() : Ok(auction);
	}

	// Maakt een nieuwe auction aan in de database.

	[HttpPost]
	public async Task<ActionResult<Auction>> Create(Auction auction)
	{
		Db.Auctions.Add(auction);
		await Db.SaveChangesAsync();

		return CreatedAtAction(nameof(GetById), new { id = auction.Id }, auction);
	}

	// Update een bestaande auction op basis van de ID.

	[HttpPut("{id:int}")]
	public async Task<ActionResult<Auction>> Update(int id, Auction updated)
	{
		var existing = await Db.Auctions.FindAsync(id);
		if (existing is null) return NotFound();

		existing.Description = updated.Description;
		existing.StartsAt = updated.StartsAt;
		existing.Quantity = updated.Quantity;
		existing.ReservePrice = updated.ReservePrice;
		existing.ClockLocation = updated.ClockLocation;
		existing.AuctioneerId = updated.AuctioneerId;

		await Db.SaveChangesAsync();
		return Ok(existing);
	}
}
