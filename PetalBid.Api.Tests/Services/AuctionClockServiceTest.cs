using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using PetalBid.Api.Data;
using PetalBid.Api.Domain.Entities;
using PetalBid.Api.Hubs;
using PetalBid.Api.Services;
using Xunit;

namespace PetalBid.Api.Tests.Services;

public class AuctionClockServiceTests
{
	private readonly Mock<IServiceScopeFactory> _mockScopeFactory;
	private readonly Mock<IServiceScope> _mockScope;
	private readonly Mock<IServiceProvider> _mockServiceProvider;
	private readonly Mock<IHubContext<AuctionHub>> _mockHubContext;
	private readonly Mock<IHubClients> _mockClients;
	private readonly Mock<IClientProxy> _mockClientProxy;
	private readonly AppDbContext _db;

	public AuctionClockServiceTests()
	{
		// Setup InMemory Database
		var options = new DbContextOptionsBuilder<AppDbContext>()
			.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
			.Options;
		_db = new AppDbContext(options);

		// Mock Service Scope Resolution
		_mockScopeFactory = new Mock<IServiceScopeFactory>();
		_mockScope = new Mock<IServiceScope>();
		_mockServiceProvider = new Mock<IServiceProvider>();

		_mockScopeFactory.Setup(s => s.CreateScope()).Returns(_mockScope.Object);
		_mockScope.Setup(s => s.ServiceProvider).Returns(_mockServiceProvider.Object);
		_mockServiceProvider.Setup(s => s.GetService(typeof(AppDbContext))).Returns(_db);

		// Mock SignalR
		_mockHubContext = new Mock<IHubContext<AuctionHub>>();
		_mockClients = new Mock<IHubClients>();
		_mockClientProxy = new Mock<IClientProxy>();

		_mockHubContext.Setup(h => h.Clients).Returns(_mockClients.Object);
		_mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(_mockClientProxy.Object);
	}

	[Fact]
	public async Task StartAuctionAsync_ShouldSetStateAndNotifyClients()
	{
		// Arrange
		var service = new AuctionClockService(_mockScopeFactory.Object, _mockHubContext.Object, Mock.Of<ILogger<AuctionClockService>>());

		var auction = new Auction { Id = 1, Description = "Test Auction" };
		var product = new Product { Id = 10, AuctionId = 1, Stock = 100, MaxPricePerUnit = 2.50 };

		_db.Auctions.Add(auction);
		_db.Products.Add(product);
		await _db.SaveChangesAsync();

		// Act
		await service.StartAuctionAsync(1);

		// Assert
		var state = service.GetAuctionState(1);
		Assert.NotNull(state);
		Assert.True(state!.IsRunning);
		Assert.Equal(10, state.CurrentProduct?.Id);
		Assert.Equal(2.50, state.CurrentPrice);

		_mockClients.Verify(c => c.Group("auction-1"), Times.AtLeastOnce);
		// Verify broadcast of state
		_mockClientProxy.Verify(c => c.SendCoreAsync("AuctionState", It.IsAny<object[]>(), default), Times.AtLeastOnce);
	}

	[Fact]
	public async Task ProcessBidAsync_ShouldProcessSale_UpdateStock_AndNotifyClients()
	{
		// Arrange
		var service = new AuctionClockService(_mockScopeFactory.Object, _mockHubContext.Object, Mock.Of<ILogger<AuctionClockService>>());

		var auction = new Auction { Id = 2 };
		var buyer = new Buyer { Id = 50, FullName = "Test Buyer", CompanyName = "Flowers Inc" };
		var product = new Product { Id = 20, AuctionId = 2, Stock = 100, MaxPricePerUnit = 1.00 };

		_db.Auctions.Add(auction);
		_db.Buyers.Add(buyer);
		_db.Products.Add(product);
		await _db.SaveChangesAsync();

		// Start auction to initialize state in memory
		await service.StartAuctionAsync(2);

		// Act
		// Buyer 50 buys 10 items
		var result = await service.ProcessBidAsync(2, 50, "Test Buyer", 10);

		// Assert
		Assert.True(result.Success);

		// Verify DB updates
		var updatedProduct = await _db.Products.FindAsync(20);
		Assert.Equal(90, updatedProduct!.Stock); // 100 - 10

		var sale = await _db.Sales.Include(s => s.Buyer).FirstOrDefaultAsync(s => s.AuctionId == 2);
		Assert.NotNull(sale);
		Assert.Equal(50, sale!.BuyerId);

		var saleItem = await _db.SaleItems.FirstOrDefaultAsync(s => s.SaleId == sale.Id);
		Assert.NotNull(saleItem);
		Assert.Equal(20, saleItem!.ProductId);
		Assert.Equal(10, saleItem.Quantity);

		// Verify Service State
		var state = service.GetAuctionState(2);
		Assert.False(state!.IsRunning); // Should pause after sale
		Assert.True(state.IsPaused);

		// Verify SignalR Notification ("LotSold")
		_mockClientProxy.Verify(c => c.SendCoreAsync("LotSold", It.IsAny<object[]>(), default), Times.Once);
	}

	[Fact]
	public async Task ProcessBidAsync_ShouldFail_IfStockInsufficient()
	{
		// Arrange
		var service = new AuctionClockService(_mockScopeFactory.Object, _mockHubContext.Object, Mock.Of<ILogger<AuctionClockService>>());

		var auction = new Auction { Id = 3 };
		var buyer = new Buyer { Id = 51 };
		var product = new Product { Id = 30, AuctionId = 3, Stock = 5 };

		_db.Auctions.Add(auction);
		_db.Buyers.Add(buyer);
		_db.Products.Add(product);
		await _db.SaveChangesAsync();

		await service.StartAuctionAsync(3);

		// Act
		var result = await service.ProcessBidAsync(3, 51, "Buyer", 10); // Requesting 10, only 5 available

		// Assert
		Assert.False(result.Success);
		Assert.Contains("Niet genoeg voorraad", result.Message);

		// Stock should remain 5
		Assert.Equal(5, _db.Products.Find(30)!.Stock);
	}
}
