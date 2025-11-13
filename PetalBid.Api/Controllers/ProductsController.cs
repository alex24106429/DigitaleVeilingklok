using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetalBid.Api.Data;
using PetalBid.Api.Domain.Entities;

namespace PetalBid.Api.Controllers;

[ApiController]
[Route("api/[controller]")]

// Haalt alle products uit de database.
public class ProductsController(AppDbContext db) : ApiControllerBase(db)
{
	[HttpGet]
	public async Task<ActionResult<List<Product>>> GetAll()
	{
		var products = await Db.Products.AsNoTracking().ToListAsync();
		return Ok(products);
	}

	// Haalt een specifieke product op basis van de ID.

	[HttpGet("{id:int}")]
	public async Task<ActionResult<Product>> GetById(int id)
	{
		var product = await Db.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
		return product is null ? NotFound() : Ok(product);
	}

	// Maakt een nieuwe product aan in de database.

	[HttpPost]
	public async Task<ActionResult<Product>> Create(Product product)
	{
		Db.Products.Add(product);
		await Db.SaveChangesAsync();
		return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
	}

	// Update een bestaande product op basis van de ID.

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
}
