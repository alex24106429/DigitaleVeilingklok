using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetalBid.Api.Data;
using PetalBid.Api.Domain.Entities;

namespace PetalBid.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Auctioneer")]
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

	[HttpGet("{id:int}")]
	public async Task<ActionResult<Auction>> GetById(int id)
	{
		var auction = await Db.Auctions
			.AsNoTracking()
			.FirstOrDefaultAsync(a => a.Id == id);

		return auction is null ? NotFound() : Ok(auction);
	}

	[HttpPost]
	public async Task<ActionResult<Auction>> Create(Auction auction)
	{
		Db.Auctions.Add(auction);
		await Db.SaveChangesAsync();

		return CreatedAtAction(nameof(GetById), new { id = auction.Id }, auction);
	}

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

	[HttpDelete("{id:int}")]
	public async Task<ActionResult> Delete(int id)
	{
		var auction = await Db.Auctions.FindAsync(id);
		if (auction is null) return NotFound();

		Db.Auctions.Remove(auction);
		await Db.SaveChangesAsync();
		return NoContent();
	}
}
