using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetalBid.Api.Data;
using PetalBid.Api.Domain.Entities;
using PetalBid.Api.Domain.Enums;
using PetalBid.Api.Services;
using Microsoft.Extensions.Logging;

namespace PetalBid.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Relaxed class-level authorization to allow Buyers to view auctions
public class AuctionsController(AppDbContext db, ILogger<AuctionsController> logger, AuctionClockService auctionClockService) : ApiControllerBase(db)
{
	private readonly AuctionClockService _auctionClockService = auctionClockService;

	[HttpGet]
	public async Task<ActionResult<List<Auction>>> GetAll()
	{
		var auctions = await Db.Auctions
			.AsNoTracking()
			.Where(a => a.StartsAt > DateTime.UtcNow.AddDays(-1)) // Show recent
			.ToListAsync();
		return Ok(auctions);
	}

	[HttpGet("auctioneer/{auctioneerId:int}")]
	[Authorize(Roles = "Auctioneer")]
	public async Task<ActionResult<List<Auction>>> GetAuctionsByAuctioneer(int auctioneerId)
	{
		var auctions = await Db.Auctions
			.AsNoTracking()
			.Where(a => a.AuctioneerId == auctioneerId)
			.ToListAsync();
		return Ok(auctions);
	}

	[HttpGet("{id:int}")]
	public async Task<ActionResult<Auction>> GetById(int id)
	{
		var auction = await Db.Auctions.FindAsync(id);
		return auction is null ? NotFound() : Ok(auction);
	}

	[HttpPost]
	[Authorize(Roles = "Admin,Auctioneer")]
	public async Task<ActionResult<Auction>> Create([FromBody] Auction auction)
	{
		auction.Status = AuctionStatus.Pending;
		if (auction.StartsAt.Kind == DateTimeKind.Unspecified)
			auction.StartsAt = DateTime.SpecifyKind(auction.StartsAt, DateTimeKind.Utc);
		else if (auction.StartsAt.Kind == DateTimeKind.Local)
			auction.StartsAt = auction.StartsAt.ToUniversalTime();

		if (auction.Auctioneer != null)
			Db.Entry(auction.Auctioneer).State = EntityState.Unchanged;

		Db.Auctions.Add(auction);
		await Db.SaveChangesAsync();
		return CreatedAtAction(nameof(GetById), new { id = auction.Id }, auction);
	}

	[HttpPut("{id:int}")]
	[Authorize(Roles = "Admin,Auctioneer")]
	public async Task<ActionResult<Auction>> Update(int id, Auction updated)
	{
		var existing = await Db.Auctions.FindAsync(id);
		if (existing is null) return NotFound();

		existing.Description = updated.Description;
		if (updated.StartsAt.Kind != DateTimeKind.Utc)
			existing.StartsAt = updated.StartsAt.ToUniversalTime();
		else
			existing.StartsAt = updated.StartsAt;

		existing.ClockLocation = updated.ClockLocation;
		existing.Status = updated.Status;

		await Db.SaveChangesAsync();
		return Ok(existing);
	}

	[HttpDelete("{id:int}")]
	[Authorize(Roles = "Admin,Auctioneer")]
	public async Task<ActionResult> Delete(int id)
	{
		var auction = await Db.Auctions.FindAsync(id);
		if (auction is null) return NotFound();
		Db.Auctions.Remove(auction);
		await Db.SaveChangesAsync();
		return NoContent();
	}

	// --- Control Endpoints ---

	[HttpPost("{id:int}/start")]
	[Authorize(Roles = "Admin,Auctioneer")]
	public async Task<ActionResult> StartAuction(int id)
	{
		var auction = await Db.Auctions.FindAsync(id);
		if (auction is null) return NotFound();

		if (auction.Status != AuctionStatus.Active)
		{
			auction.Status = AuctionStatus.Active;
			await Db.SaveChangesAsync();
		}

		await _auctionClockService.StartAuctionAsync(id);
		return NoContent();
	}

	[HttpPost("{id:int}/pause")]
	[Authorize(Roles = "Admin,Auctioneer")]
	public async Task<ActionResult> PauseAuction(int id)
	{
		var auction = await Db.Auctions.FindAsync(id);
		if (auction is null) return NotFound();

		auction.Status = AuctionStatus.Paused;
		await Db.SaveChangesAsync();

		await _auctionClockService.PauseAuctionAsync(id);
		return NoContent();
	}

	[HttpPost("{id:int}/end")]
	[Authorize(Roles = "Admin,Auctioneer")]
	public async Task<ActionResult> EndAuction(int id)
	{
		var auction = await Db.Auctions.FindAsync(id);
		if (auction is null) return NotFound();

		auction.Status = AuctionStatus.Ended;
		await Db.SaveChangesAsync();

		await _auctionClockService.StopAuctionAsync(id);
		return NoContent();
	}

	[HttpPost("{id:int}/next")]
	[Authorize(Roles = "Admin,Auctioneer")]
	public async Task<ActionResult> NextLot(int id)
	{
		var auction = await Db.Auctions.FindAsync(id);
		if (auction is null) return NotFound();

		await _auctionClockService.MoveToNextLotAsync(id);
		return NoContent();
	}
}
