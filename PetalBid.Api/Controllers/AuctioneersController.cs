using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetalBid.Api.Data;
using PetalBid.Api.Domain.Entities;

namespace PetalBid.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuctioneersController(AppDbContext db) : ApiControllerBase(db)
{
	[HttpGet]
	public async Task<ActionResult<List<Auctioneer>>> GetAll()
	{
		var auctioneers = await Db.Auctioneers.AsNoTracking().ToListAsync();
		return Ok(auctioneers);
	}

	[HttpGet("{id:int}")]
	public async Task<ActionResult<Auctioneer>> GetById(int id)
	{
		var auctioneer = await Db.Auctioneers.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id);
		return auctioneer is null ? NotFound() : Ok(auctioneer);
	}

	[HttpPost]
	public async Task<ActionResult<Auctioneer>> Create(Auctioneer auctioneer)
	{
		Db.Auctioneers.Add(auctioneer);
		await Db.SaveChangesAsync();
		return CreatedAtAction(nameof(GetById), new { id = auctioneer.Id }, auctioneer);
	}

	[HttpPut("{id:int}")]
	public async Task<ActionResult<Auctioneer>> Update(int id, Auctioneer updated)
	{
		var existing = await Db.Auctioneers.FindAsync(id);
		if (existing is null) return NotFound();

		existing.UserId = updated.UserId;

		await Db.SaveChangesAsync();
		return Ok(existing);
	}
}
