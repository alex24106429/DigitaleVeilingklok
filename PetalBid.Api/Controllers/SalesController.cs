using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetalBid.Api.Data;
using PetalBid.Api.Domain.Entities;
using System.Security.Claims;

namespace PetalBid.Api.Controllers;

/// <summary>
/// Controller for "Sale" entities and history
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SalesController(AppDbContext db) : ApiControllerBase(db)
{
	/// <summary>
	/// Retrieves Sales based on user role (History).
	/// Returns a simplified DTO structure for the frontend table.
	/// </summary>
	[HttpGet]
	public async Task<ActionResult<List<SaleHistoryDto>>> GetAll()
	{
		var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
		if (userIdString == null) return Unauthorized();
		var userId = int.Parse(userIdString);
		var role = User.FindFirstValue(ClaimTypes.Role);

		// We need to fetch sales and join with SaleItems/Products to give details
		var query = Db.Sales
			.Include(s => s.Buyer)
			.Include(s => s.Auction)
			.AsNoTracking();

		// Flatten the data. A sale might have multiple items, but for "Purchases.tsx"
		// we usually list transactions. One sale = one transaction for simplicity here,
		// or we list SaleItems. The frontend expects rows like "Product Name, Qty, Price".
		// So we should query SaleItems directly.

		var itemsQuery = Db.SaleItems
			.Include(si => si.Sale)
				.ThenInclude(s => s.Buyer)
			.Include(si => si.Product)
				.ThenInclude(p => p.Supplier)
			.AsNoTracking();

		if (role == "Buyer")
		{
			itemsQuery = itemsQuery.Where(si => si.Sale.BuyerId == userId);
		}
		else if (role == "Supplier")
		{
			itemsQuery = itemsQuery.Where(si => si.Product.SupplierId == userId);
		}
		// Admin sees all

		var items = await itemsQuery.OrderByDescending(si => si.Sale.OccurredAt).ToListAsync();

		var history = items.Select(si => new SaleHistoryDto
		{
			Id = si.Id, // Use SaleItem ID as the unique row ID
			ProductName = si.Product.Name,
			Species = si.Product.Species,
			Origin = "Unknown", // Add origin to product entity if needed later
			Quantity = si.Quantity,
			PurchasePrice = (double)si.UnitPrice / 100.0, // Convert cents to eur
			PurchaseDate = si.Sale.OccurredAt,
			BuyerName = si.Sale.Buyer.FullName,
			SideBuy = false // Logic for side buy if stored
		}).ToList();

		return Ok(history);
	}
}

public class SaleHistoryDto
{
	public int Id { get; set; }
	public string ProductName { get; set; } = string.Empty;
	public string Species { get; set; } = string.Empty;
	public string Origin { get; set; } = string.Empty;
	public int Quantity { get; set; }
	public double PurchasePrice { get; set; }
	public DateTime PurchaseDate { get; set; }
	public string BuyerName { get; set; } = string.Empty;
	public bool SideBuy { get; set; }
}
