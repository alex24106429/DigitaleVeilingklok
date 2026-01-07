using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using PetalBid.Api.Data;
using PetalBid.Api.Domain.Entities;
using PetalBid.Api.Domain.Enums;
using PetalBid.Api.Hubs;

namespace PetalBid.Api.Services;

public class AuctionState
{
	public int AuctionId { get; set; }
	public Product? CurrentProduct { get; set; }
	public double CurrentPrice { get; set; }
	public bool IsRunning { get; set; }
	public bool IsPaused { get; set; }
}

public class BidResult
{
	public bool Success { get; set; }
	public string Message { get; set; } = string.Empty;
}

public class AuctionClockService(IServiceScopeFactory scopeFactory, IHubContext<AuctionHub> hubContext, ILogger<AuctionClockService> logger)
{
	private readonly IServiceScopeFactory _scopeFactory = scopeFactory;
	private readonly IHubContext<AuctionHub> _hubContext = hubContext;
	private readonly ILogger<AuctionClockService> _logger = logger;

	// Dictionary to hold state for multiple active auctions
	private readonly Dictionary<int, AuctionState> _activeAuctions = [];
	private readonly Dictionary<int, Timer> _timers = [];

	private const double PriceStep = 0.01;
	private const double FloorPrice = 0.10; // Avoid going to 0
	private const int TickRateMs = 250; // Update 4 times a second

	public async Task StartAuctionAsync(int auctionId)
	{
		if (_activeAuctions.ContainsKey(auctionId))
		{
			var existing = _activeAuctions[auctionId];
			if (!existing.IsRunning)
			{
				existing.IsRunning = true;
				existing.IsPaused = false;
				StartTimer(auctionId);
				await BroadcastState(auctionId);
			}
			return;
		}

		// Initialize state
		using var scope = _scopeFactory.CreateScope();
		var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

		var auction = await db.Auctions.FindAsync(auctionId);
		if (auction == null) return;

		// Find first product in this auction
		var firstProduct = await db.Products
			.Where(p => p.AuctionId == auctionId && p.Stock > 0)
			.OrderBy(p => p.Id) // Determine order
			.FirstOrDefaultAsync();

		var state = new AuctionState
		{
			AuctionId = auctionId,
			CurrentProduct = firstProduct,
			CurrentPrice = firstProduct?.MaxPricePerUnit ?? 2.00, // Default start price if not set
			IsRunning = firstProduct != null,
			IsPaused = false
		};

		_activeAuctions[auctionId] = state;

		if (state.IsRunning)
		{
			StartTimer(auctionId);
		}

		await BroadcastState(auctionId);
	}

	public async Task PauseAuctionAsync(int auctionId)
	{
		if (_activeAuctions.TryGetValue(auctionId, out var state))
		{
			state.IsRunning = false;
			state.IsPaused = true;
			StopTimer(auctionId);
			await BroadcastState(auctionId);
		}
	}

	public async Task StopAuctionAsync(int auctionId)
	{
		if (_activeAuctions.ContainsKey(auctionId))
		{
			StopTimer(auctionId);
			_activeAuctions.Remove(auctionId);
			await _hubContext.Clients.Group($"auction-{auctionId}").SendAsync("AuctionEnded");
		}
	}

	public AuctionState? GetAuctionState(int auctionId)
	{
		return _activeAuctions.TryGetValue(auctionId, out var state) ? state : null;
	}

	public async Task<BidResult> ProcessBidAsync(int auctionId, int userId, string userName, int quantity)
	{
		if (!_activeAuctions.TryGetValue(auctionId, out var state) || state.CurrentProduct == null)
		{
			return new BidResult { Success = false, Message = "Veiling niet actief." };
		}

		// If clock is running, user buys at current price.
		// If paused (side-buy mode), logic might differ, but for now allow buy at last price.

		using var scope = _scopeFactory.CreateScope();
		var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

		var product = await db.Products.FindAsync(state.CurrentProduct.Id);
		if (product == null || product.Stock < quantity)
		{
			return new BidResult { Success = false, Message = "Niet genoeg voorraad." };
		}

		// Lock or check concurrency here in real app
		var price = state.CurrentPrice;

		// Create Sale
		var buyer = await db.Buyers.FindAsync(userId);
		if (buyer == null) return new BidResult { Success = false, Message = "Koper niet gevonden." };

		var sale = new Sale
		{
			AuctionId = auctionId,
			BuyerId = userId,
			OccurredAt = DateTime.UtcNow,
			PaymentReference = $"BID-{Guid.NewGuid().ToString()[..8].ToUpper()}"
		};
		db.Sales.Add(sale);
		await db.SaveChangesAsync();

		var saleItem = new SaleItem
		{
			SaleId = sale.Id,
			ProductId = product.Id,
			Quantity = quantity,
			UnitPrice = (int)(price * 100) // Storing in cents usually, or adapt logic
		};
		db.SaleItems.Add(saleItem);

		// Update stock
		product.Stock -= quantity;
		if (product.Stock == 0)
		{
			// Item sold out
		}

		await db.SaveChangesAsync();

		// Notify clients
		await _hubContext.Clients.Group($"auction-{auctionId}").SendAsync("LotSold", new
		{
			BuyerName = userName,
			Quantity = quantity,
			Price = price,
			ProductId = product.Id,
			RemainingStock = product.Stock
		});

		// Pause clock to allow others to join via "Side Buy" or move to next
		state.IsRunning = false;
		state.IsPaused = true;
		StopTimer(auctionId);

		// Update in-memory product stock
		state.CurrentProduct.Stock = product.Stock;

		await BroadcastState(auctionId);

		return new BidResult { Success = true };
	}

	public async Task MoveToNextLotAsync(int auctionId)
	{
		if (!_activeAuctions.TryGetValue(auctionId, out var state)) return;

		using var scope = _scopeFactory.CreateScope();
		var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

		// If current product has stock left, we might skip it or keep it?
		// Assuming we move to next product in list > current ID
		var nextProduct = await db.Products
			.Where(p => p.AuctionId == auctionId && p.Stock > 0 && (state.CurrentProduct == null || p.Id > state.CurrentProduct.Id))
			.OrderBy(p => p.Id)
			.FirstOrDefaultAsync();

		if (nextProduct == null)
		{
			await StopAuctionAsync(auctionId);
			return;
		}

		state.CurrentProduct = nextProduct;
		state.CurrentPrice = nextProduct.MaxPricePerUnit ?? 2.00;
		state.IsRunning = true;
		state.IsPaused = false;

		StartTimer(auctionId);
		await _hubContext.Clients.Group($"auction-{auctionId}").SendAsync("NextLot", nextProduct);
		await BroadcastState(auctionId);
	}

	private void StartTimer(int auctionId)
	{
		StopTimer(auctionId); // Ensure no dupes

		var timer = new Timer(async _ => await Tick(auctionId), null, TickRateMs, TickRateMs);
		_timers[auctionId] = timer;
	}

	private void StopTimer(int auctionId)
	{
		if (_timers.TryGetValue(auctionId, out var timer))
		{
			timer.Dispose();
			_timers.Remove(auctionId);
		}
	}

	private async Task Tick(int auctionId)
	{
		if (!_activeAuctions.TryGetValue(auctionId, out var state))
		{
			StopTimer(auctionId);
			return;
		}

		if (!state.IsRunning || state.IsPaused) return;

		state.CurrentPrice -= PriceStep;
		if (state.CurrentPrice < FloorPrice)
		{
			state.CurrentPrice = FloorPrice;
			state.IsRunning = false; // Stop at floor
			// Notify "No Sale" or wait for manual action
		}

		// Optimization: Don't await strictly, fire and forget or simple wait
		await _hubContext.Clients.Group($"auction-{auctionId}").SendAsync("PriceUpdate", state.CurrentPrice);
	}

	private async Task BroadcastState(int auctionId)
	{
		if (_activeAuctions.TryGetValue(auctionId, out var state))
		{
			await _hubContext.Clients.Group($"auction-{auctionId}").SendAsync("AuctionState", state);
		}
	}
}
