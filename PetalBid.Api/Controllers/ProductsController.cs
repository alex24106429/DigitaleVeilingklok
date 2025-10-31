using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetalBid.Api.Data;
using PetalBid.Api.Domain.Entities;

namespace PetalBid.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController(AppDbContext db) : ApiControllerBase(db)
{
	[HttpGet]
	public async Task<ActionResult<List<Product>>> GetAll()
	{
		var products = await Db.Products.AsNoTracking().ToListAsync();
		return Ok(products);
	}

	[HttpGet("{id:int}")]
	public async Task<ActionResult<Product>> GetById(int id)
	{
		var product = await Db.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
		return product is null ? NotFound() : Ok(product);
	}

	[HttpPost]
	public async Task<ActionResult<Product>> Create(Product product)
	{
		Db.Products.Add(product);
		await Db.SaveChangesAsync();
		return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
	}

	[HttpPut("{id:int}")]
	public async Task<ActionResult<Product>> Update(int id, Product updated)
	{
		var existing = await Db.Products.FindAsync(id);
		if (existing is null) return NotFound();

		existing.Name = updated.Name;
		existing.Weight = updated.Weight;
		existing.ImageUrl = updated.ImageUrl;
		existing.Species = updated.Species;
		existing.PotSize = updated.PotSize;
		existing.StemLength = updated.StemLength;
		existing.Stock = updated.Stock;
		existing.AuctionId = updated.AuctionId;

		await Db.SaveChangesAsync();
		return Ok(existing);
	}

	[HttpDelete("{id:int}")]
	public async Task<ActionResult> Delete(int id)
	{
		var product = await Db.Products.FindAsync(id);
		if (product is null) return NotFound();

		Db.Products.Remove(product);
		await Db.SaveChangesAsync();
		return NoContent();
	}
}
