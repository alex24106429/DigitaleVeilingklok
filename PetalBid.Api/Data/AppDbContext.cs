using Microsoft.EntityFrameworkCore;
using PetalBid.Api.Domain.Entities;

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
}
