using ImageMagick;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetalBid.Api.Data;
using PetalBid.Api.Domain.Entities;
using PetalBid.Api.DTOs;
using System.Data;
using System.Data.Common;
using System.Security.Claims;

namespace PetalBid.Api.Controllers;
/// <summary>
/// Controller "for products"
/// </summary>

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Supplier,Auctioneer,Buyer")]
public class ProductsController(AppDbContext db) : ApiControllerBase(db)
{
	/// <summary>
	/// Retrieves all "products"
	/// </summary>
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
	/// <summary>
	///  Retrieves a specific "product"
	/// </summary>

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

	/// <summary>
	/// Retrieves historical price data for a product.
	/// NOTE: Implemented using Raw SQL for performance reasons as per requirements.
	/// </summary>
	[HttpGet("{id:int}/history")]
	public async Task<ActionResult<ProductHistoryDto>> GetHistory(int id)
	{
		// 1. Get Product Details (Species & SupplierId) using EF for simplicity of the initial lookup
		var productInfo = await Db.Products
			.AsNoTracking()
			.Where(p => p.Id == id)
			.Select(p => new { p.Species, p.SupplierId })
			.FirstOrDefaultAsync();

		if (productInfo is null) return NotFound();

		var result = new ProductHistoryDto { Species = productInfo.Species };

		// 2. Open Raw Connection
		var connection = Db.Database.GetDbConnection();
		await connection.OpenAsync();

		try
		{
			// --- Helper to create command ---
			DbCommand CreateCommand(string sql)
			{
				var cmd = connection.CreateCommand();
				cmd.CommandText = sql;
				return cmd;
			}

			// --- Query A: Average Price & History for THIS Supplier ---
			// Calculate AVG
			using (var cmd = CreateCommand(
				@"SELECT AVG(si.UnitPrice)
                  FROM SaleItems si
                  JOIN Products p ON si.ProductId = p.Id
                  WHERE p.Species = @species AND p.SupplierId = @supplierId"))
			{
				var pSpecies = cmd.CreateParameter(); pSpecies.ParameterName = "@species"; pSpecies.Value = productInfo.Species; cmd.Parameters.Add(pSpecies);
				var pSupplier = cmd.CreateParameter(); pSupplier.ParameterName = "@supplierId"; pSupplier.Value = productInfo.SupplierId; cmd.Parameters.Add(pSupplier);

				var avgObj = await cmd.ExecuteScalarAsync();
				if (avgObj != null && avgObj != DBNull.Value)
				{
					// UnitPrice is stored in cents (int), convert to EUR (double)
					result.SupplierStats.AveragePrice = Convert.ToDouble(avgObj) / 100.0;
				}
			}

			// Get Last 10
			using (var cmd = CreateCommand(
				@"SELECT si.UnitPrice, s.OccurredAt
                  FROM SaleItems si
                  JOIN Products p ON si.ProductId = p.Id
                  JOIN Sales s ON si.SaleId = s.Id
                  WHERE p.Species = @species AND p.SupplierId = @supplierId
                  ORDER BY s.OccurredAt DESC
                  LIMIT 10"))
			{
				var pSpecies = cmd.CreateParameter(); pSpecies.ParameterName = "@species"; pSpecies.Value = productInfo.Species; cmd.Parameters.Add(pSpecies);
				var pSupplier = cmd.CreateParameter(); pSupplier.ParameterName = "@supplierId"; pSupplier.Value = productInfo.SupplierId; cmd.Parameters.Add(pSupplier);

				using var reader = await cmd.ExecuteReaderAsync();
				while (await reader.ReadAsync())
				{
					result.SupplierStats.Last10Sales.Add(new HistoryItemDto
					{
						Price = Convert.ToInt32(reader["UnitPrice"]) / 100.0,
						Date = Convert.ToDateTime(reader["OccurredAt"])
					});
				}
			}

			// --- Query B: Average Price & History for ENTIRE Market (All Suppliers) ---

			// Calculate AVG
			using (var cmd = CreateCommand(
				@"SELECT AVG(si.UnitPrice)
                  FROM SaleItems si
                  JOIN Products p ON si.ProductId = p.Id
                  WHERE p.Species = @species"))
			{
				var pSpecies = cmd.CreateParameter(); pSpecies.ParameterName = "@species"; pSpecies.Value = productInfo.Species; cmd.Parameters.Add(pSpecies);

				var avgObj = await cmd.ExecuteScalarAsync();
				if (avgObj != null && avgObj != DBNull.Value)
				{
					result.MarketStats.AveragePrice = Convert.ToDouble(avgObj) / 100.0;
				}
			}

			// Get Last 10
			using (var cmd = CreateCommand(
				@"SELECT si.UnitPrice, s.OccurredAt
                  FROM SaleItems si
                  JOIN Products p ON si.ProductId = p.Id
                  JOIN Sales s ON si.SaleId = s.Id
                  WHERE p.Species = @species
                  ORDER BY s.OccurredAt DESC
                  LIMIT 10"))
			{
				var pSpecies = cmd.CreateParameter(); pSpecies.ParameterName = "@species"; pSpecies.Value = productInfo.Species; cmd.Parameters.Add(pSpecies);

				using var reader = await cmd.ExecuteReaderAsync();
				while (await reader.ReadAsync())
				{
					result.MarketStats.Last10Sales.Add(new HistoryItemDto
					{
						Price = Convert.ToInt32(reader["UnitPrice"]) / 100.0,
						Date = Convert.ToDateTime(reader["OccurredAt"])
					});
				}
			}
		}
		finally
		{
			await connection.CloseAsync();
		}

		return Ok(result);
	}

	/// <summary>
	/// Creates a new "product"
	/// </summary>

	[HttpPost]
	public async Task<ActionResult<Product>> Create(ProductDto productDto)
	{
		var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
		if (userIdString == null) return Unauthorized();

		var userId = int.Parse(userIdString);
		var userRole = User.FindFirstValue(ClaimTypes.Role);

		// Only Suppliers can create products through this endpoint
		if (userRole != "Supplier") return Forbid();

		var processedImage = ProcessAndEncodeImage(productDto.ImageBase64);

		var product = new Product
		{
			Name = productDto.Name,
			Weight = productDto.Weight,
			ImageBase64 = processedImage,
			Species = productDto.Species,
			PotSize = productDto.PotSize,
			StemLength = productDto.StemLength,
			Stock = productDto.Stock,
			MinimumPrice = productDto.MinimumPrice,
			SaleDate = productDto.SaleDate,
			SupplierId = userId,
			AuctionId = null
		};

		Db.Products.Add(product);
		await Db.SaveChangesAsync();
		return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
	}
	/// <summary>
	/// Updates an existing "product"
	/// </summary>
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

		// Only process image if a new one is provided (simple check if string is not empty)
		if (!string.IsNullOrWhiteSpace(updatedDto.ImageBase64) && updatedDto.ImageBase64 != existing.ImageBase64)
		{
			existing.ImageBase64 = ProcessAndEncodeImage(updatedDto.ImageBase64);
		}

		existing.Name = updatedDto.Name;
		existing.Weight = updatedDto.Weight;
		existing.Species = updatedDto.Species;
		existing.PotSize = updatedDto.PotSize;
		existing.StemLength = updatedDto.StemLength;
		existing.Stock = updatedDto.Stock;
		existing.MinimumPrice = updatedDto.MinimumPrice;
		existing.AuctionId = updatedDto.AuctionId;
		existing.MaxPricePerUnit = updatedDto.MaxPricePerUnit;
		existing.SaleDate = updatedDto.SaleDate;

		await Db.SaveChangesAsync();
		return Ok(existing);
	}
	/// <summary>
	/// Deletes a "product"
	/// </summary>

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

	/// <summary>
	/// Processes the input base64 string:
	/// 1. Decodes base64
	/// 2. Crops to square (center)
	/// 3. Resizes to max 1024x1024
	/// 4. Converts to AVIF at 30% quality
	/// 5. Returns base64 string
	/// </summary>
	private static string ProcessAndEncodeImage(string inputBase64)
	{
		if (string.IsNullOrWhiteSpace(inputBase64)) return string.Empty;

		try
		{
			// Remove data URI prefix if present (e.g. "data:image/png;base64,")
			var commaIndex = inputBase64.IndexOf(',');
			var cleanBase64 = commaIndex != -1 ? inputBase64[(commaIndex + 1)..] : inputBase64;

			var imageBytes = Convert.FromBase64String(cleanBase64);

			using var image = new MagickImage(imageBytes);

			// 1. Crop to square (Center)
			// Explicitly cast to int to avoid long/uint mismatch errors during calculation
			var width = (int)image.Width;
			var height = (int)image.Height;
			var size = Math.Min(width, height);

			if (width != height)
			{
				var x = (width - size) / 2;
				var y = (height - size) / 2;

				// MagickGeometry expects (int x, int y, uint width, uint height)
				image.Crop(new MagickGeometry(x, y, (uint)size, (uint)size));
			}

			// 2. Downscale to max 1024x
			if (size > 1024)
			{
				image.Resize(1024, 1024);
			}

			// 3. Convert to AVIF with 30% quality
			image.Format = MagickFormat.Avif;
			image.Quality = 30;

			// 4. Return as Base64 Data URI
			return "data:image/avif;base64," + image.ToBase64();
		}
		catch (Exception)
		{
			// Fallback or error handling: return empty to indicate failure to process
			return string.Empty;
		}
	}
}
