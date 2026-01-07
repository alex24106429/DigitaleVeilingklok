using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using PetalBid.Api.Controllers;
using PetalBid.Api.Data;
using PetalBid.Api.Domain.Entities;
using PetalBid.Api.Domain.Enums;
using PetalBid.Api.Hubs;
using PetalBid.Api.Services;
using Xunit;

namespace PetalBid.Api.Tests.Controllers;

public class AuctionsControllerTests
{
	private readonly AppDbContext _db;
	private readonly AuctionsController _controller;
	private readonly Mock<AuctionClockService> _mockClockService;

	public AuctionsControllerTests()
	{
		// Setup DB
		var options = new DbContextOptionsBuilder<AppDbContext>()
			.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
			.Options;
		_db = new AppDbContext(options);

		// Setup Service Mocks required for AuctionClockService instantiation
		var mockScopeFactory = new Mock<IServiceScopeFactory>();
		var mockScope = new Mock<IServiceScope>();
		var mockServiceProvider = new Mock<IServiceProvider>();

		// Setup the chain: ScopeFactory -> Scope -> ServiceProvider -> DbContext
		mockScopeFactory.Setup(s => s.CreateScope()).Returns(mockScope.Object);
		mockScope.Setup(s => s.ServiceProvider).Returns(mockServiceProvider.Object);
		mockServiceProvider.Setup(s => s.GetService(typeof(AppDbContext))).Returns(_db);

		var mockHubContext = new Mock<IHubContext<AuctionHub>>();
		var mockClients = new Mock<IHubClients>();
		var mockClientProxy = new Mock<IClientProxy>();

		// Setup SignalR chain to prevent null refs if methods call Clients.Group(...)
		mockHubContext.Setup(h => h.Clients).Returns(mockClients.Object);
		mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(mockClientProxy.Object);

		var mockLogger = new Mock<ILogger<AuctionClockService>>();

		// Use real service but with mocked internal dependencies,
		// effectively treating it as part of the integration or a verified dependency
		var clockService = new AuctionClockService(mockScopeFactory.Object, mockHubContext.Object, mockLogger.Object);

		_controller = new AuctionsController(_db, Mock.Of<ILogger<AuctionsController>>(), clockService);
	}

	[Fact]
	public async Task GetAll_ReturnsOnlyRecentAuctions()
	{
		// Arrange
		_db.Auctions.AddRange(new List<Auction>
		{
			new Auction { Id = 1, StartsAt = DateTime.UtcNow.AddDays(1), Description = "Future" },
			new Auction { Id = 2, StartsAt = DateTime.UtcNow.AddDays(-2), Description = "Old" }, // Should be filtered out
			new Auction { Id = 3, StartsAt = DateTime.UtcNow.AddHours(-12), Description = "Recent" }
		});
		await _db.SaveChangesAsync();

		// Act
		var result = await _controller.GetAll();

		// Assert
		var actionResult = Assert.IsType<OkObjectResult>(result.Result);
		var returnedAuctions = Assert.IsType<List<Auction>>(actionResult.Value);

		Assert.Contains(returnedAuctions, a => a.Id == 1);
		Assert.Contains(returnedAuctions, a => a.Id == 3);
		Assert.DoesNotContain(returnedAuctions, a => a.Id == 2);
	}

	[Fact]
	public async Task Create_SetsStatusToPending_AndNormalizesDateToUtc()
	{
		// Arrange
		var localDate = DateTime.Now.AddDays(1); // Local time
		var auction = new Auction
		{
			Description = "Test Auction",
			StartsAt = localDate,
			ClockLocation = ClockLocation.Aalsmeer
		};

		// Act
		var result = await _controller.Create(auction);

		// Assert
		var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
		var createdAuction = Assert.IsType<Auction>(createdResult.Value);

		Assert.Equal(AuctionStatus.Pending, createdAuction.Status);
		Assert.Equal(DateTimeKind.Utc, createdAuction.StartsAt.Kind);

		// Simple verification that it's stored in DB
		var dbAuction = await _db.Auctions.FindAsync(createdAuction.Id);
		Assert.NotNull(dbAuction);
	}

	[Fact]
	public async Task StartAuction_UpdatesStatusToActive()
	{
		// Arrange
		var auction = new Auction { Id = 10, Status = AuctionStatus.Pending, Description = "To Start" };
		_db.Auctions.Add(auction);
		await _db.SaveChangesAsync();

		// Act
		var result = await _controller.StartAuction(10);

		// Assert
		Assert.IsType<NoContentResult>(result);

		var dbAuction = await _db.Auctions.FindAsync(10);
		Assert.Equal(AuctionStatus.Active, dbAuction!.Status);
	}

	[Fact]
	public async Task EndAuction_UpdatesStatusToEnded()
	{
		// Arrange
		var auction = new Auction { Id = 11, Status = AuctionStatus.Active, Description = "To End" };
		_db.Auctions.Add(auction);
		await _db.SaveChangesAsync();

		// Act
		var result = await _controller.EndAuction(11);

		// Assert
		Assert.IsType<NoContentResult>(result);

		var dbAuction = await _db.Auctions.FindAsync(11);
		Assert.Equal(AuctionStatus.Ended, dbAuction!.Status);
	}
}
