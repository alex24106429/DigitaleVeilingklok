using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetalBid.Api.Data;
using PetalBid.Api.Domain.Entities;
using PetalBid.Api.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace PetalBid.Api.Controllers;
/// <summary>
/// Controller for all auctions
/// </summary>


[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Auctioneer")]
public class AuctionsController(AppDbContext db, ILogger<AuctionsController> logger) : ApiControllerBase(db)
{
	/// <summary>
	/// Retrieves all auctions from the database
	/// </summary>

	[HttpGet]
	public async Task<ActionResult<List<Auction>>> GetAll()
	{
		try
		{
			var auctions = await Db.Auctions
				.AsNoTracking()
				.Where(a => a.StartsAt > DateTime.UtcNow)
				.ToListAsync();

			return Ok(auctions);
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "An unexpected error occurred while retrieving all auctions.");
			return StatusCode(500, "An unexpected error occurred while retrieving auctions.");
		}
	}

	/// <summary>
	/// Retrieves all auctions for a specific auctioneer from the database
	/// </summary>
	[HttpGet("auctioneer/{auctioneerId:int}")]
	[Authorize(Roles = "Auctioneer")]
	public async Task<ActionResult<List<Auction>>> GetAuctionsByAuctioneer(int auctioneerId)
	{
		try
		{
			var auctions = await Db.Auctions
				.AsNoTracking()
				.Where(a => a.AuctioneerId == auctioneerId && a.StartsAt > DateTime.UtcNow)
				.ToListAsync();

			return Ok(auctions);
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "An unexpected error occurred while retrieving auctions for auctioneer {AuctioneerId}.", auctioneerId);
			return StatusCode(500, "An unexpected error occurred while retrieving auctions for the specified auctioneer.");
		}
	}

	/// <summary>
	/// Retrieves a specific auction
	/// </summary>

	[HttpGet("{id:int}")]
	public async Task<ActionResult<Auction>> GetById(int id)
	{
		var auction = await Db.Auctions
			.AsNoTracking()
			.FirstOrDefaultAsync(a => a.Id == id);

		return auction is null ? NotFound() : Ok(auction);
	}

	/// <summary>
	/// Creates a new auction
	/// </summary>

	[HttpPost]
	public async Task<ActionResult<Auction>> Create([FromBody] Auction auction)
	{
		// Set default status when creating an auction
		auction.Status = AuctionStatus.Pending;

		// Ensure StartsAt has Kind=Utc for PostgreSQL
		if (auction.StartsAt.Kind == DateTimeKind.Unspecified)
		{
			auction.StartsAt = DateTime.SpecifyKind(auction.StartsAt, DateTimeKind.Utc);
		}
		else if (auction.StartsAt.Kind == DateTimeKind.Local)
		{
			auction.StartsAt = auction.StartsAt.ToUniversalTime();
		}

		// Attach the auctioneer to the context to avoid creating a new one
		if (auction.Auctioneer != null)
		{
			Db.Entry(auction.Auctioneer).State = EntityState.Unchanged;
		}

		Db.Auctions.Add(auction);
		await Db.SaveChangesAsync();

		return CreatedAtAction(nameof(GetById), new { id = auction.Id }, auction);
	}
	/// <summary>
	/// Updates an auction
	/// </summary>
	[HttpPut("{id:int}")]
	public async Task<ActionResult<Auction>> Update(int id, Auction updated)
	{
		var existing = await Db.Auctions.FindAsync(id);
		if (existing is null) return NotFound();

		existing.Description = updated.Description;

		// Ensure StartsAt has Kind=Utc for PostgreSQL
		if (updated.StartsAt.Kind == DateTimeKind.Unspecified)
		{
			existing.StartsAt = DateTime.SpecifyKind(updated.StartsAt, DateTimeKind.Utc);
		}
		else if (updated.StartsAt.Kind == DateTimeKind.Local)
		{
			existing.StartsAt = updated.StartsAt.ToUniversalTime();
		}
		else
		{
			existing.StartsAt = updated.StartsAt;
		}

		existing.ClockLocation = updated.ClockLocation;
		existing.AuctioneerId = updated.AuctioneerId;
		existing.Status = updated.Status; // Update status

		await Db.SaveChangesAsync();
		return Ok(existing);
	}

	/// <summary>
	/// Starts an auction
	/// </summary>
	[HttpPost("{id:int}/start")]
	public async Task<ActionResult> StartAuction(int id)
	{
		var auction = await Db.Auctions.FindAsync(id);
		if (auction is null) return NotFound();

		if (auction.Status == AuctionStatus.Pending || auction.Status == AuctionStatus.Paused)
		{
			auction.Status = AuctionStatus.Active;
			await Db.SaveChangesAsync();
			return NoContent();
		}
		return BadRequest("Auction cannot be started from its current state.");
	}

	/// <summary>
	/// Pauses an auction
	/// </summary>
	[HttpPost("{id:int}/pause")]
	public async Task<ActionResult> PauseAuction(int id)
	{
		var auction = await Db.Auctions.FindAsync(id);
		if (auction is null) return NotFound();

		if (auction.Status == AuctionStatus.Active)
		{
			auction.Status = AuctionStatus.Paused;
			await Db.SaveChangesAsync();
			return NoContent();
		}
		return BadRequest("Auction cannot be paused from its current state.");
	}

	/// <summary>
	/// Ends an auction
	/// </summary>
	[HttpPost("{id:int}/end")]
	public async Task<ActionResult> EndAuction(int id)
	{
		var auction = await Db.Auctions.FindAsync(id);
		if (auction is null) return NotFound();

		if (auction.Status == AuctionStatus.Active || auction.Status == AuctionStatus.Paused)
		{
			auction.Status = AuctionStatus.Ended;
			await Db.SaveChangesAsync();
			return NoContent();
		}
		return BadRequest("Auction cannot be ended from its current state.");
	}
	/// <summary>
	/// Deletes an auction
	/// </summary>

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
