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
	// New property to indicate the grace period state
	public bool IsGracePeriod { get; set; }
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

	// Separate timers for the grace period (the 5-second pause)
	private readonly Dictionary<int, Timer> _graceTimers = [];

	private const double PriceStep = 0.01;
	private const int TickRateMs = 250; // Update 4 times a second
	private const int GracePeriodMs = 5000; // 5 Seconds grace period

	public async Task StartAuctionAsync(int auctionId)
	{
		StopGraceTimer(auctionId); // Ensure grace timer is cleared

		if (_activeAuctions.ContainsKey(auctionId))
		{
			var existing = _activeAuctions[auctionId];
			if (!existing.IsRunning)
			{
				existing.IsRunning = true;
				existing.IsPaused = false;
				existing.IsGracePeriod = false;
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
			IsPaused = false,
			IsGracePeriod = false
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
		StopGraceTimer(auctionId);

		if (_activeAuctions.TryGetValue(auctionId, out var state))
		{
			state.IsRunning = false;
			state.IsPaused = true;
			state.IsGracePeriod = false; // Manual pause cancels grace period
			StopTimer(auctionId);
			await BroadcastState(auctionId);
		}
	}

	public async Task StopAuctionAsync(int auctionId)
	{
		StopGraceTimer(auctionId);
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

		// Use a local scope for DB operations
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
			UnitPrice = (int)(price * 100) // Storing in cents
		};
		db.SaleItems.Add(saleItem);

		// Update stock
		product.Stock -= quantity;
		await db.SaveChangesAsync();

		// Update in-memory state stock
		state.CurrentProduct.Stock = product.Stock;

		// Notify clients of the sale
		await _hubContext.Clients.Group($"auction-{auctionId}").SendAsync("LotSold", new
		{
			BuyerName = userName,
			Quantity = quantity,
			Price = price,
			ProductId = product.Id,
			RemainingStock = product.Stock
		});

		// --- LOGIC FOR SIDE BUYS / GRACE PERIOD ---

		if (product.Stock == 0)
		{
			// Sold out: Stop everything
			StopTimer(auctionId);
			StopGraceTimer(auctionId);
			state.IsRunning = false;
			state.IsPaused = true;
			state.IsGracePeriod = false;
			await BroadcastState(auctionId);
		}
		else
		{
			// If clock was running (First Buy), stop it and enter Grace Period
			if (state.IsRunning)
			{
				state.IsRunning = false;
				state.IsPaused = true;
				state.IsGracePeriod = true;
				StopTimer(auctionId);
				StartGraceTimer(auctionId); // Start the 5s timer
				await BroadcastState(auctionId);
			}
			// If already in Grace Period (Side Buy), just reset the timer
			else if (state.IsGracePeriod)
			{
				// Restart the grace timer to give others more time
				StartGraceTimer(auctionId);
				// We don't need to broadcast state change, just the 'LotSold' event is enough for UI updates,
				// but broadcasting ensures sync.
				await BroadcastState(auctionId);
			}
		}

		return new BidResult { Success = true };
	}

	public async Task MoveToNextLotAsync(int auctionId)
	{
		StopGraceTimer(auctionId); // Clear any pending reset

		if (!_activeAuctions.TryGetValue(auctionId, out var state)) return;

		using var scope = _scopeFactory.CreateScope();
		var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

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
		state.IsGracePeriod = false;

		StartTimer(auctionId);
		await _hubContext.Clients.Group($"auction-{auctionId}").SendAsync("NextLot", nextProduct);
		await BroadcastState(auctionId);
	}

	// --- Timer Logic ---

	private void StartTimer(int auctionId)
	{
		StopTimer(auctionId); // Ensure no dupes
		StopGraceTimer(auctionId); // Ensure no conflicting grace timers

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

	private void StartGraceTimer(int auctionId)
	{
		StopGraceTimer(auctionId); // Reset if exists

		// Create a one-off timer that fires after GracePeriodMs
		var timer = new Timer(async _ => await EndGracePeriod(auctionId), null, GracePeriodMs, Timeout.Infinite);
		_graceTimers[auctionId] = timer;
	}

	private void StopGraceTimer(int auctionId)
	{
		if (_graceTimers.TryGetValue(auctionId, out var timer))
		{
			timer.Dispose();
			_graceTimers.Remove(auctionId);
		}
	}

	// Called when Grace Timer expires (no one bought the remainder)
	private async Task EndGracePeriod(int auctionId)
	{
		StopGraceTimer(auctionId); // Cleanup

		if (!_activeAuctions.TryGetValue(auctionId, out var state) || state.CurrentProduct == null) return;

		// Logic: Reset price to max and resume ticking
		state.IsGracePeriod = false;
		state.IsPaused = false;
		state.IsRunning = true;
		state.CurrentPrice = state.CurrentProduct.MaxPricePerUnit ?? 2.00;

		StartTimer(auctionId); // Resume main clock

		await BroadcastState(auctionId);
	}

	private async Task Tick(int auctionId)
	{
		if (!_activeAuctions.TryGetValue(auctionId, out var state))
		{
			StopTimer(auctionId);
			return;
		}

		if (!state.IsRunning || state.IsPaused) return;

		// Check if we have a current product
		if (state.CurrentProduct == null) return;

		// Get the minimum price for the current product
		var minimumPrice = state.CurrentProduct.MinimumPrice;

		// Decrement price
		var newPrice = state.CurrentPrice - PriceStep;

		// Ensure price doesn't go below minimum
		if (newPrice < minimumPrice)
		{
			state.CurrentPrice = minimumPrice;
			state.IsRunning = false; // Pause at minimum price
			state.IsPaused = true;
			StopTimer(auctionId);

			// Broadcast final state at minimum price
			await BroadcastState(auctionId);
			await _hubContext.Clients.Group($"auction-{auctionId}").SendAsync("PriceUpdate", state.CurrentPrice);
			await _hubContext.Clients.Group($"auction-{auctionId}").SendAsync("MinimumPriceReached");
		}
		else
		{
			state.CurrentPrice = newPrice;
			// Optimization: Don't await strictly, fire and forget or simple wait
			await _hubContext.Clients.Group($"auction-{auctionId}").SendAsync("PriceUpdate", state.CurrentPrice);
		}
	}

	private async Task BroadcastState(int auctionId)
	{
		if (_activeAuctions.TryGetValue(auctionId, out var state))
		{
			await _hubContext.Clients.Group($"auction-{auctionId}").SendAsync("AuctionState", state);
		}
	}
}
