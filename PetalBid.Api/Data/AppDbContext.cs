using Microsoft.EntityFrameworkCore;
using PetalBid.Api.Domain.Entities;
using System.Text.Json;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace PetalBid.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
	public DbSet<User> Users { get; set; } = null!;
	public DbSet<Auctioneer> Auctioneers { get; set; } = null!;
	public DbSet<Buyer> Buyers { get; set; } = null!;
	public DbSet<Supplier> Suppliers { get; set; } = null!;
	public DbSet<Admin> Admins { get; set; } = null!;
	public DbSet<Auction> Auctions { get; set; } = null!;
	public DbSet<Product> Products { get; set; } = null!;
	public DbSet<Sale> Sales { get; set; } = null!;
	public DbSet<SaleItem> SaleItems { get; set; } = null!;
	public DbSet<AuditLog> AuditLogs { get; set; } = null!;

	protected override void OnModelCreating(ModelBuilder model)
	{
		base.OnModelCreating(model);

		model.Entity<User>().UseTptMappingStrategy();

		model.Entity<Sale>()
			.HasOne(s => s.Buyer)
			.WithMany()
			.HasForeignKey(s => s.BuyerId)
			.OnDelete(DeleteBehavior.Restrict);

		model.Entity<Auction>()
			.HasOne(a => a.Auctioneer)
			.WithMany()
			.HasForeignKey(a => a.AuctioneerId)
			.OnDelete(DeleteBehavior.Cascade);

		model.Entity<Sale>()
			.HasOne(s => s.Auction)
			.WithMany()
			.HasForeignKey(s => s.AuctionId)
			.OnDelete(DeleteBehavior.Restrict);

		model.Entity<Product>()
			.HasOne(p => p.Auction)
			.WithMany()
			.HasForeignKey(p => p.AuctionId)
			.OnDelete(DeleteBehavior.SetNull);

		model.Entity<Product>()
			.HasOne(p => p.Supplier)
			.WithMany()
			.HasForeignKey(p => p.SupplierId)
			.OnDelete(DeleteBehavior.Cascade);

		model.Entity<SaleItem>()
			.HasOne(i => i.Sale)
			.WithMany()
			.HasForeignKey(i => i.SaleId)
			.OnDelete(DeleteBehavior.Cascade);

		model.Entity<SaleItem>()
			.HasOne(i => i.Product)
			.WithMany()
			.HasForeignKey(i => i.ProductId)
			.OnDelete(DeleteBehavior.Cascade);
	}

	private void AddAuditEntries()
	{
		var entries = ChangeTracker.Entries()
			.Where(e => (e.State == EntityState.Added || e.State == EntityState.Modified || e.State == EntityState.Deleted))
			.Where(e => !(e.Entity is AuditLog))
			.ToList();

		if (!entries.Any())
			return;

		var now = DateTime.UtcNow;

		foreach (var entry in entries)
		{
			var pk = entry.Properties.Where(p => p.Metadata.IsPrimaryKey()).ToDictionary(p => p.Metadata.Name, p => p.CurrentValue);

			var audit = new AuditLog
			{
				TableName = entry.Metadata.GetTableName() ?? entry.Entity.GetType().Name,
				Action = entry.State.ToString(),
				TimestampUtc = now,
				KeyValues = JsonSerializer.Serialize(pk)
			};

			if (entry.State == EntityState.Added)
			{
				audit.NewValues = JsonSerializer.Serialize(entry.Properties.ToDictionary(p => p.Metadata.Name, p => p.CurrentValue));
			}
			else if (entry.State == EntityState.Modified)
			{
				audit.OldValues = JsonSerializer.Serialize(entry.Properties.ToDictionary(p => p.Metadata.Name, p => p.OriginalValue));
				audit.NewValues = JsonSerializer.Serialize(entry.Properties.ToDictionary(p => p.Metadata.Name, p => p.CurrentValue));
			}
			else if (entry.State == EntityState.Deleted)
			{
				audit.OldValues = JsonSerializer.Serialize(entry.Properties.ToDictionary(p => p.Metadata.Name, p => p.OriginalValue));
			}

			// Add audit entry to context so it's saved in the same transaction
			Entry(audit).State = EntityState.Added;
		}
	}

	public override int SaveChanges()
	{
		AddAuditEntries();
		return base.SaveChanges();
	}

	public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
	{
		AddAuditEntries();
		return base.SaveChangesAsync(cancellationToken);
	}
}
