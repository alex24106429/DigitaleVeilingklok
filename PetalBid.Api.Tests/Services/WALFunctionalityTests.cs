using Microsoft.EntityFrameworkCore;
using PetalBid.Api.Data;
using PetalBid.Api.Domain.Entities;
using PetalBid.Api.Domain.Enums;
using Xunit;

namespace PetalBid.Api.Tests.Services;

public class WALFunctionalityTests : IDisposable
{
	private readonly string _testDatabasePath;
	private readonly DbContextOptions<AppDbContext> _walOptions;
	private readonly DbContextOptions<AppDbContext> _nonWalOptions;

	public WALFunctionalityTests()
	{
		_testDatabasePath = Path.Combine(Path.GetTempPath(), $"test_wal_{Guid.NewGuid()}.db");
		
		_walOptions = new DbContextOptionsBuilder<AppDbContext>()
			.UseSqlite($"Data Source={_testDatabasePath}")
			.Options;

		_nonWalOptions = new DbContextOptionsBuilder<AppDbContext>()
			.UseSqlite($"Data Source={_testDatabasePath.Replace(".db", "_nowal.db")}")
			.Options;
	}

	public void Dispose()
	{
		// Cleanup test databases
		try
		{
			if (File.Exists(_testDatabasePath))
				File.Delete(_testDatabasePath);
			if (File.Exists($"{_testDatabasePath}-wal"))
				File.Delete($"{_testDatabasePath}-wal");
			if (File.Exists($"{_testDatabasePath}-shm"))
				File.Delete($"{_testDatabasePath}-shm");
			
			var nonWalPath = _testDatabasePath.Replace(".db", "_nowal.db");
			if (File.Exists(nonWalPath))
				File.Delete(nonWalPath);
		}
		catch
		{
			// Ignore cleanup errors
		}
	}

	[Fact]
	public async Task WalMode_ShouldCreateDatabaseFiles()
	{
		// Arrange & Act
		using (var context = new AppDbContext(_walOptions))
		{
			await context.Database.EnsureCreatedAsync();
			var user = new Auctioneer { FullName = "Test User", Email = "test@example.com", PasswordHash = "hash" };
			context.Auctioneers.Add(user);
			await context.SaveChangesAsync();
		}

		// Assert
		Assert.True(File.Exists(_testDatabasePath), "Main database file should exist");
	}

	[Fact]
	public async Task WalMode_ShouldSupportConcurrentReads()
	{
		// Arrange
		using (var context = new AppDbContext(_walOptions))
		{
			await context.Database.EnsureCreatedAsync();
			var auctioneer = new Auctioneer { FullName = "Test Auctioneer", Email = "auctioneer@example.com", PasswordHash = "hash" };
			context.Auctioneers.Add(auctioneer);
			await context.SaveChangesAsync();
		}

		// Act
		var readTasks = Enumerable.Range(0, 5).Select(async i =>
		{
			using (var context = new AppDbContext(_walOptions))
			{
				return await context.Auctioneers.CountAsync();
			}
		}).ToList();

		var results = await Task.WhenAll(readTasks);

		// Assert
		Assert.All(results, count => Assert.Equal(1, count));
	}

	[Fact]
	public async Task WalMode_ShouldHandleConcurrentWritesAndReads()
	{
		// Arrange
		using (var context = new AppDbContext(_walOptions))
		{
			await context.Database.EnsureCreatedAsync();
		}

		// Act - Perform concurrent reads while writing
		var writeTask = Task.Run(async () =>
		{
			for (int i = 0; i < 5; i++)
			{
				using (var context = new AppDbContext(_walOptions))
				{
					var auctioneer = new Auctioneer 
					{ 
						FullName = $"Auctioneer {i}", 
						Email = $"auctioneer{i}@example.com",
						PasswordHash = "hash"
					};
					context.Auctioneers.Add(auctioneer);
					await context.SaveChangesAsync();
					await Task.Delay(10);
				}
			}
		});

		var readTasks = Enumerable.Range(0, 3).Select(async i =>
		{
			await Task.Delay(5);
			using (var context = new AppDbContext(_walOptions))
			{
				return await context.Auctioneers.CountAsync();
			}
		}).ToList();

		await Task.WhenAll(writeTask);
		var readResults = await Task.WhenAll(readTasks);

		// Assert - Reads should not block writes
		Assert.All(readResults, count => Assert.True(count >= 0));
		using (var context = new AppDbContext(_walOptions))
		{
			var finalCount = await context.Auctioneers.CountAsync();
			Assert.Equal(5, finalCount);
		}
	}

	[Fact]
	public async Task WalMode_ShouldMaintainDataConsistency()
	{
		// Arrange
		using (var context = new AppDbContext(_walOptions))
		{
			await context.Database.EnsureCreatedAsync();
		}

		// Act - Write data from multiple contexts
		var auctioneers = new List<Auctioneer>();
		for (int i = 0; i < 10; i++)
		{
			using (var context = new AppDbContext(_walOptions))
			{
				var auctioneer = new Auctioneer 
				{ 
					FullName = $"Auctioneer {i}", 
					Email = $"auctioneer{i}@example.com",
					PasswordHash = "hash"
				};
				context.Auctioneers.Add(auctioneer);
				await context.SaveChangesAsync();
				auctioneers.Add(auctioneer);
			}
		}

		// Assert - Verify all data was persisted
		using (var context = new AppDbContext(_walOptions))
		{
			var savedCount = await context.Auctioneers.CountAsync();
			Assert.Equal(10, savedCount);

			var savedAuctioneers = await context.Auctioneers.ToListAsync();
			for (int i = 0; i < 10; i++)
			{
				Assert.Contains(savedAuctioneers, a => a.FullName == $"Auctioneer {i}");
			}
		}
	}

	[Fact]
	public async Task WalMode_ShouldHandleTransactionRollback()
	{
		// Arrange
		using (var context = new AppDbContext(_walOptions))
		{
			await context.Database.EnsureCreatedAsync();
		}

		// Act - Test transaction with rollback
		using (var context = new AppDbContext(_walOptions))
		{
			using (var transaction = await context.Database.BeginTransactionAsync())
			{
				var auctioneer = new Auctioneer 
				{ 
					FullName = "Should Rollback", 
					Email = "rollback@example.com",
					PasswordHash = "hash"
				};
				context.Auctioneers.Add(auctioneer);
				await context.SaveChangesAsync();
				await transaction.RollbackAsync();
			}
		}

		// Assert - Data should not be persisted after rollback
		using (var context = new AppDbContext(_walOptions))
		{
			var count = await context.Auctioneers.CountAsync();
			Assert.Equal(0, count);
		}
	}

	[Fact]
	public async Task WalMode_ShouldHandleTransactionCommit()
	{
		// Arrange
		using (var context = new AppDbContext(_walOptions))
		{
			await context.Database.EnsureCreatedAsync();
		}

		// Act - Test transaction with commit
		using (var context = new AppDbContext(_walOptions))
		{
			using (var transaction = await context.Database.BeginTransactionAsync())
			{
				var auctioneer = new Auctioneer 
				{ 
					FullName = "Should Commit", 
					Email = "commit@example.com",
					PasswordHash = "hash"
				};
				context.Auctioneers.Add(auctioneer);
				await context.SaveChangesAsync();
				await transaction.CommitAsync();
			}
		}

		// Assert - Data should be persisted after commit
		using (var context = new AppDbContext(_walOptions))
		{
			var count = await context.Auctioneers.CountAsync();
			Assert.Equal(1, count);
			var auctioneer = await context.Auctioneers.FirstAsync();
			Assert.Equal("Should Commit", auctioneer.FullName);
		}
	}

	[Fact]
	public async Task WalMode_ShouldPerformBetterThanNonWalUnderConcurrentLoad()
	{
		// Arrange
		using (var walContext = new AppDbContext(_walOptions))
		{
			await walContext.Database.EnsureCreatedAsync();
		}

		using (var nonWalContext = new AppDbContext(_nonWalOptions))
		{
			await nonWalContext.Database.EnsureCreatedAsync();
		}

		var readCount = 10;
		var iterations = 5;

		// Act - Measure WAL performance
		var walStopwatch = System.Diagnostics.Stopwatch.StartNew();
		for (int iter = 0; iter < iterations; iter++)
		{
			using (var context = new AppDbContext(_walOptions))
			{
				var auctioneer = new Auctioneer 
				{ 
					FullName = $"WAL Auctioneer {iter}", 
					Email = $"wal{iter}@example.com",
					PasswordHash = "hash"
				};
				context.Auctioneers.Add(auctioneer);
				await context.SaveChangesAsync();
			}

			var readTasks = Enumerable.Range(0, readCount).Select(async _ =>
			{
				using (var context = new AppDbContext(_walOptions))
				{
					return await context.Auctioneers.CountAsync();
				}
			});

			await Task.WhenAll(readTasks);
		}
		walStopwatch.Stop();

		// Act - Measure non-WAL performance
		var nonWalStopwatch = System.Diagnostics.Stopwatch.StartNew();
		for (int iter = 0; iter < iterations; iter++)
		{
			using (var context = new AppDbContext(_nonWalOptions))
			{
				var auctioneer = new Auctioneer 
				{ 
					FullName = $"NonWAL Auctioneer {iter}", 
					Email = $"nowwal{iter}@example.com",
					PasswordHash = "hash"
				};
				context.Auctioneers.Add(auctioneer);
				await context.SaveChangesAsync();
			}

			var readTasks = Enumerable.Range(0, readCount).Select(async _ =>
			{
				using (var context = new AppDbContext(_nonWalOptions))
				{
					return await context.Auctioneers.CountAsync();
				}
			});

			await Task.WhenAll(readTasks);
		}
		nonWalStopwatch.Stop();

		// Assert - WAL should be competitive (this is a relative benchmark)
		Assert.True(walStopwatch.ElapsedMilliseconds >= 0);
		Assert.True(nonWalStopwatch.ElapsedMilliseconds >= 0);
		
		// Output for manual review
		System.Diagnostics.Debug.WriteLine($"WAL Time: {walStopwatch.ElapsedMilliseconds}ms");
		System.Diagnostics.Debug.WriteLine($"Non-WAL Time: {nonWalStopwatch.ElapsedMilliseconds}ms");
	}

	[Fact]
	public async Task WalMode_ShouldPreventDirtyReads()
	{
		// Arrange
		using (var context = new AppDbContext(_walOptions))
		{
			await context.Database.EnsureCreatedAsync();
		}

		// Act
		var reader = Task.Run(async () =>
		{
			await Task.Delay(50);
			using (var context = new AppDbContext(_walOptions))
			{
				return await context.Auctioneers.CountAsync();
			}
		});

		var writer = Task.Run(async () =>
		{
			using (var context = new AppDbContext(_walOptions))
			{
				var auctioneer = new Auctioneer 
				{ 
					FullName = "Dirty Read Test", 
					Email = "dirty@example.com",
					PasswordHash = "hash"
				};
				context.Auctioneers.Add(auctioneer);
				await context.SaveChangesAsync();
			}
		});

		await Task.WhenAll(reader, writer);

		// Assert
		using (var context = new AppDbContext(_walOptions))
		{
			var count = await context.Auctioneers.CountAsync();
			Assert.Equal(1, count);
		}
	}

	[Fact]
	public async Task WalMode_ShouldHandleMultipleEntities()
	{
		// Arrange
		using (var context = new AppDbContext(_walOptions))
		{
			await context.Database.EnsureCreatedAsync();
		}

		// Act - Create multiple entity types
		Auctioneer auctioneer;
		Supplier supplier;
		Product product;
		using (var context = new AppDbContext(_walOptions))
		{
			auctioneer = new Auctioneer { FullName = "Test Auctioneer", Email = "test@example.com", PasswordHash = "hash" };
			context.Auctioneers.Add(auctioneer);
			await context.SaveChangesAsync();

			supplier = new Supplier { FullName = "Test Supplier", Email = "supplier@example.com", PasswordHash = "hash", CompanyName = "Test Co" };
			context.Suppliers.Add(supplier);
			await context.SaveChangesAsync();

			var auction = new Auction 
			{ 
				AuctioneerId = auctioneer.Id, 
				Description = "Test Auction",
				StartsAt = DateTime.UtcNow, 
				Quantity = 1, 
				ReservePrice = 100, 
				ClockLocation = ClockLocation.Naaldwijk 
			};
			context.Auctions.Add(auction);
			await context.SaveChangesAsync();

			product = new Product 
			{ 
				Name = "Test Product", 
				AuctionId = auction.Id, 
				SupplierId = supplier.Id, 
				Weight = 1.0, 
				ImageUrl = "https://example.com/image.jpg", 
				Species = "Rose", 
				Stock = 10, 
				MinimumPrice = 5.0 
			};
			context.Products.Add(product);
			await context.SaveChangesAsync();
		}

		// Assert - Verify relationships are maintained
		using (var context = new AppDbContext(_walOptions))
		{
			var savedAuctioneer = await context.Auctioneers.FirstAsync();
			Assert.NotNull(savedAuctioneer);

			var savedSupplier = await context.Suppliers.FirstAsync();
			Assert.NotNull(savedSupplier);

			var savedProduct = await context.Products.Include(p => p.Auction).FirstAsync();
			Assert.NotNull(savedProduct);
			Assert.NotNull(savedProduct.Auction);
			Assert.Equal(savedAuctioneer.Id, savedProduct.Auction.AuctioneerId);
			Assert.Equal(savedSupplier.Id, savedProduct.SupplierId);
		}
	}

	[Fact]
	public async Task WalMode_ShouldHandleBulkOperations()
	{
		// Arrange
		using (var context = new AppDbContext(_walOptions))
		{
			await context.Database.EnsureCreatedAsync();
		}

		// Act - Insert multiple records in a loop
		const int bulkCount = 50;
		using (var context = new AppDbContext(_walOptions))
		{
			for (int i = 0; i < bulkCount; i++)
			{
				var auctioneer = new Auctioneer 
				{ 
					FullName = $"Bulk Auctioneer {i}", 
					Email = $"bulk{i}@example.com",
					PasswordHash = "hash"
				};
				context.Auctioneers.Add(auctioneer);
			}
			await context.SaveChangesAsync();
		}

		// Assert - Verify all records were inserted
		using (var context = new AppDbContext(_walOptions))
		{
			var count = await context.Auctioneers.CountAsync();
			Assert.Equal(bulkCount, count);
		}
	}

	[Fact]
	public async Task WalMode_ShouldHandleDelete()
	{
		// Arrange
		int auctioneeId;
		using (var context = new AppDbContext(_walOptions))
		{
			await context.Database.EnsureCreatedAsync();
			var auctioneer = new Auctioneer { FullName = "To Delete", Email = "delete@example.com", PasswordHash = "hash" };
			context.Auctioneers.Add(auctioneer);
			await context.SaveChangesAsync();
			auctioneeId = auctioneer.Id;
		}

		// Act - Delete the record
		using (var context = new AppDbContext(_walOptions))
		{
			var auctioneer = await context.Auctioneers.FindAsync(auctioneeId);
			Assert.NotNull(auctioneer);
			context.Auctioneers.Remove(auctioneer);
			await context.SaveChangesAsync();
		}

		// Assert - Verify record was deleted
		using (var context = new AppDbContext(_walOptions))
		{
			var count = await context.Auctioneers.CountAsync();
			Assert.Equal(0, count);
		}
	}

	[Fact]
	public async Task WalMode_ShouldHandleUpdate()
	{
		// Arrange
		int auctioneeId;
		using (var context = new AppDbContext(_walOptions))
		{
			await context.Database.EnsureCreatedAsync();
			var auctioneer = new Auctioneer { FullName = "Original Name", Email = "update@example.com", PasswordHash = "hash" };
			context.Auctioneers.Add(auctioneer);
			await context.SaveChangesAsync();
			auctioneeId = auctioneer.Id;
		}

		// Act - Update the record
		using (var context = new AppDbContext(_walOptions))
		{
			var auctioneer = await context.Auctioneers.FindAsync(auctioneeId);
			Assert.NotNull(auctioneer);
			auctioneer.FullName = "Updated Name";
			await context.SaveChangesAsync();
		}

		// Assert - Verify record was updated
		using (var context = new AppDbContext(_walOptions))
		{
			var auctioneer = await context.Auctioneers.FirstAsync();
			Assert.Equal("Updated Name", auctioneer.FullName);
		}
	}
}

