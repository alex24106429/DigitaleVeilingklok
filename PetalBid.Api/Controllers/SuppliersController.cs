using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetalBid.Api.Data;
using PetalBid.Api.Domain.Entities;

namespace PetalBid.Api.Controllers;

[ApiController]
[Route("api/[controller]")]

// Haalt alle suppliers uit de database.
public class SuppliersController(AppDbContext db) : ApiControllerBase(db)
{
	[HttpGet]
	public async Task<ActionResult<List<Supplier>>> GetAll()
	{
		var suppliers = await Db.Suppliers.AsNoTracking().ToListAsync();
		return Ok(suppliers);
	}

	// Haalt een specifieke supplier op basis van de ID.
	[HttpGet("{id:int}")]
	public async Task<ActionResult<Supplier>> GetById(int id)
	{
		var supplier = await Db.Suppliers.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id);
		return supplier is null ? NotFound() : Ok(supplier);
	
	}

	// Maakt een nieuwe supplier aan in de database.
	[HttpPost]
	public async Task<ActionResult<Supplier>> Create(Supplier supplier)
	{
		Db.Suppliers.Add(supplier);
		await Db.SaveChangesAsync();
		return CreatedAtAction(nameof(GetById), new { id = supplier.Id }, supplier);
	}
	
	// Update een bestaande supplier op basis van de ID.
	[HttpPut("{id:int}")]
	public async Task<ActionResult<Supplier>> Update(int id, Supplier updated)
	{
		var existing = await Db.Suppliers.FindAsync(id);
		if (existing is null) return NotFound();

		existing.CompanyName = updated.CompanyName;
		existing.UserId = updated.UserId;

		await Db.SaveChangesAsync();
		return Ok(existing);
	}
}
