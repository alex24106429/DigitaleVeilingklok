using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetalBid.Api.Data;
using PetalBid.Api.Domain.Entities;

namespace PetalBid.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SaleItemsController(AppDbContext db) : ApiControllerBase(db)
{
	[HttpGet]
	public async Task<ActionResult<List<SaleItem>>> GetAll()
	{
		var items = await Db.SaleItems.AsNoTracking().ToListAsync();
		return Ok(items);
	}

	[HttpGet("{id:int}")]
	public async Task<ActionResult<SaleItem>> GetById(int id)
	{
		var item = await Db.SaleItems.AsNoTracking().FirstOrDefaultAsync(i => i.Id == id);
		return item is null ? NotFound() : Ok(item);
	}

	[HttpPost]
	public async Task<ActionResult<SaleItem>> Create(SaleItem item)
	{
		Db.SaleItems.Add(item);
		await Db.SaveChangesAsync();
		return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
	}

	[HttpPut("{id:int}")]
	public async Task<ActionResult<SaleItem>> Update(int id, SaleItem updated)
	{
		var existing = await Db.SaleItems.FindAsync(id);
		if (existing is null) return NotFound();

		existing.SaleId = updated.SaleId;
		existing.ProductId = updated.ProductId;
		existing.Quantity = updated.Quantity;
		existing.UnitPrice = updated.UnitPrice;

		await Db.SaveChangesAsync();
		return Ok(existing);
	}

	[HttpDelete("{id:int}")]
	public async Task<ActionResult> Delete(int id)
	{
		var saleItem = await Db.SaleItems.FindAsync(id);
		if (saleItem is null) return NotFound();

		Db.SaleItems.Remove(saleItem);
		await Db.SaveChangesAsync();
		return NoContent();
	}
}
