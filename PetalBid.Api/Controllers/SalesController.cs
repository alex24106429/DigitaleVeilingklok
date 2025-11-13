using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetalBid.Api.Data;
using PetalBid.Api.Domain.Entities;

namespace PetalBid.Api.Controllers;

[ApiController]
[Route("api/[controller]")]

// Haalt alle sales uit de database.
public class SalesController(AppDbContext db) : ApiControllerBase(db)
{
	[HttpGet]
	public async Task<ActionResult<List<Sale>>> GetAll()
	{
		var sales = await Db.Sales.AsNoTracking().ToListAsync();
		return Ok(sales);
	}

	// Haalt een specifieke sale op basis van de ID.

	[HttpGet("{id:int}")]
	public async Task<ActionResult<Sale>> GetById(int id)
	{
		var sale = await Db.Sales.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id);
		return sale is null ? NotFound() : Ok(sale);
	}

	// Maakt een nieuwe sale aan in de database.

	[HttpPost]
	public async Task<ActionResult<Sale>> Create(Sale sale)
	{
		Db.Sales.Add(sale);
		await Db.SaveChangesAsync();
		return CreatedAtAction(nameof(GetById), new { id = sale.Id }, sale);
	}
}
