using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetalBid.Api.Data;
using PetalBid.Api.Domain.Entities;
using PetalBid.Api.DTOs;
using System.Security.Claims;

namespace PetalBid.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Supplier")]
public class ProductsController(AppDbContext db) : ApiControllerBase(db)
{
	[HttpGet]
	public async Task<ActionResult<List<Product>>> GetAll()
	{
		var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
		var userRole = User.FindFirstValue(ClaimTypes.Role);

		IQueryable<Product> query = Db.Products.AsNoTracking();

		if (userRole == "Supplier")
		{
			query = query.Where(p => p.SupplierId == userId);
		}
		// Admin sees all, which is the default query state

		var products = await query.ToListAsync();
		return Ok(products);
	}

	[HttpGet("{id:int}")]
	public async Task<ActionResult<Product>> GetById(int id)
	{
		var product = await Db.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
		if (product is null) return NotFound();

		var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
		var userRole = User.FindFirstValue(ClaimTypes.Role);

		if (userRole == "Supplier" && product.SupplierId != userId)
		{
			return Forbid();
		}

		return Ok(product);
	}

	[HttpPost]
	public async Task<ActionResult<Product>> Create(ProductDto productDto)
	{
		var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
		if (userIdString == null) return Unauthorized();

		var userId = int.Parse(userIdString);
		var userRole = User.FindFirstValue(ClaimTypes.Role);

		// Only Suppliers can create products through this endpoint
		if (userRole != "Supplier") return Forbid();

		var product = new Product
		{
			Name = productDto.Name,
			Weight = productDto.Weight,
			ImageUrl = productDto.ImageUrl,
			Species = productDto.Species,
			PotSize = productDto.PotSize,
			StemLength = productDto.StemLength,
			Stock = productDto.Stock,
			MinimumPrice = productDto.MinimumPrice,
			SupplierId = userId,
			AuctionId = null
		};

		Db.Products.Add(product);
		await Db.SaveChangesAsync();
		return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
	}

	[HttpPut("{id:int}")]
	public async Task<ActionResult<Product>> Update(int id, ProductDto updatedDto)
	{
		var existing = await Db.Products.FindAsync(id);
		if (existing is null) return NotFound();

		var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
		if (userIdString == null) return Unauthorized();

		var userId = int.Parse(userIdString);
		var userRole = User.FindFirstValue(ClaimTypes.Role);

		// A supplier can only update their own products. An Admin can update any.
		if (userRole == "Supplier" && existing.SupplierId != userId)
		{
			return Forbid();
		}

		existing.Name = updatedDto.Name;
		existing.Weight = updatedDto.Weight;
		existing.ImageUrl = updatedDto.ImageUrl;
		existing.Species = updatedDto.Species;
		existing.PotSize = updatedDto.PotSize;
		existing.StemLength = updatedDto.StemLength;
		existing.Stock = updatedDto.Stock;
		existing.MinimumPrice = updatedDto.MinimumPrice;

		await Db.SaveChangesAsync();
		return Ok(existing);
	}

	[HttpDelete("{id:int}")]
	public async Task<ActionResult> Delete(int id)
	{
		var product = await Db.Products.FindAsync(id);
		if (product is null) return NotFound();

		var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
		var userRole = User.FindFirstValue(ClaimTypes.Role);

		if (userRole == "Supplier" && product.SupplierId != userId)
		{
			return Forbid();
		}

		// Prevent deletion if product is currently in an auction
		if (product.AuctionId.HasValue)
		{
			return BadRequest(new { message = "Cannot delete a product that is assigned to an auction." });
		}

		Db.Products.Remove(product);
		await Db.SaveChangesAsync();
		return NoContent();
	}
}
