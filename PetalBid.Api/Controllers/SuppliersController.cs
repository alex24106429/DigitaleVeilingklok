using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetalBid.Api.Data;
using PetalBid.Api.Domain.Entities;

namespace PetalBid.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SuppliersController(AppDbContext db) : ApiControllerBase(db)
{
	[HttpGet]
	public async Task<ActionResult<List<Supplier>>> GetAll()
	{
		var suppliers = await Db.Suppliers.AsNoTracking().ToListAsync();
		return Ok(suppliers);
	}

	[HttpGet("{id:int}")]
	public async Task<ActionResult<Supplier>> GetById(int id)
	{
		var supplier = await Db.Suppliers.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id);
		return supplier is null ? NotFound() : Ok(supplier);
	}

	[HttpPost]
	public async Task<ActionResult<Supplier>> Create(Supplier supplier)
	{
		Db.Suppliers.Add(supplier);
		await Db.SaveChangesAsync();
		return CreatedAtAction(nameof(GetById), new { id = supplier.Id }, supplier);
	}

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

	[HttpDelete("{id:int}")]
	public async Task<ActionResult> Delete(int id)
	{
		var supplier = await Db.Suppliers.FindAsync(id);
		if (supplier is null) return NotFound();

		Db.Suppliers.Remove(supplier);
		await Db.SaveChangesAsync();
		return NoContent();
	}
}
