using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetalBid.Api.Data;
using PetalBid.Api.Domain.Entities;

namespace PetalBid.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SalesController(AppDbContext db) : ApiControllerBase(db)
{
	[HttpGet]
	public async Task<ActionResult<List<Sale>>> GetAll()
	{
		var sales = await Db.Sales.AsNoTracking().ToListAsync();
		return Ok(sales);
	}

	[HttpGet("{id:int}")]
	public async Task<ActionResult<Sale>> GetById(int id)
	{
		var sale = await Db.Sales.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id);
		return sale is null ? NotFound() : Ok(sale);
	}

	[HttpPost]
	public async Task<ActionResult<Sale>> Create(Sale sale)
	{
		Db.Sales.Add(sale);
		await Db.SaveChangesAsync();
		return CreatedAtAction(nameof(GetById), new { id = sale.Id }, sale);
	}

	[HttpDelete("{id:int}")]
	public async Task<ActionResult> Delete(int id)
	{
		var sale = await Db.Sales.FindAsync(id);
		if (sale is null) return NotFound();

		Db.Sales.Remove(sale);
		await Db.SaveChangesAsync();
		return NoContent();
	}
}
