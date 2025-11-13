using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetalBid.Api.Data;
using PetalBid.Api.Domain.Entities;

namespace PetalBid.Api.Controllers;
/// <summary>
/// Controller for "Supplier" users
/// </summary>

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class SuppliersController(AppDbContext db) : ApiControllerBase(db)
{
	/// <summary>
	/// Retrieves all "Suppliers"
	/// </summary>
	
	[HttpGet]
	public async Task<ActionResult<List<Supplier>>> GetAll()
	{
		var suppliers = await Db.Suppliers.AsNoTracking().ToListAsync();
		return Ok(suppliers);
	}
    /// <summary>
	/// Retrieves a specific "Supplier"
	/// </summary>

	[HttpGet("{id:int}")]
	public async Task<ActionResult<Supplier>> GetById(int id)
	{
		var supplier = await Db.Suppliers.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id);
		return supplier is null ? NotFound() : Ok(supplier);
	}
     /// <summary>
	 /// Creates a new "Supplier"	
	 /// </summary>
	
	[HttpPost]
	public async Task<ActionResult<Supplier>> Create(Supplier supplier)
	{
		Db.Suppliers.Add(supplier);
		await Db.SaveChangesAsync();
		return CreatedAtAction(nameof(GetById), new { id = supplier.Id }, supplier);
	}
     /// <summary>
	 /// Updates an existing "Supplier"
	 /// </summary>

	[HttpPut("{id:int}")]
	public async Task<ActionResult<Supplier>> Update(int id, Supplier updated)
	{
		var existing = await Db.Suppliers.FindAsync(id);
		if (existing is null) return NotFound();

		existing.CompanyName = updated.CompanyName;
		existing.FullName = updated.FullName;
		existing.Email = updated.Email;

		await Db.SaveChangesAsync();
		return Ok(existing);
	}
     /// <summary>
	 /// Deletes an existing "Supplier"
	 /// </summary>
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
