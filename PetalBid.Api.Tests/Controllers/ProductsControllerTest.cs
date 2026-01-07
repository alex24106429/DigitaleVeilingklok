using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetalBid.Api.Controllers;
using PetalBid.Api.Data;
using PetalBid.Api.Domain.Entities;
using PetalBid.Api.DTOs;
using Xunit;

namespace PetalBid.Api.Tests.Controllers;

public class ProductsControllerTests
{
	private readonly AppDbContext _db;
	private readonly ProductsController _controller;

	public ProductsControllerTests()
	{
		var options = new DbContextOptionsBuilder<AppDbContext>()
			.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
			.Options;
		_db = new AppDbContext(options);
		_controller = new ProductsController(_db);
	}

	private void SetupUser(int userId, string role)
	{
		var claims = new List<Claim>
		{
			new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
			new Claim(ClaimTypes.Role, role)
		};
		var identity = new ClaimsIdentity(claims, "TestAuth");
		var principal = new ClaimsPrincipal(identity);

		_controller.ControllerContext = new ControllerContext
		{
			HttpContext = new DefaultHttpContext { User = principal }
		};
	}

	[Fact]
	public async Task GetAll_ReturnsOnlyOwnProducts_WhenSupplier()
	{
		// Arrange
		var supplierId = 10;
		var otherSupplierId = 20;

		_db.Products.Add(new Product { Id = 1, Name = "My Product", SupplierId = supplierId });
		_db.Products.Add(new Product { Id = 2, Name = "Other Product", SupplierId = otherSupplierId });
		await _db.SaveChangesAsync();

		SetupUser(supplierId, "Supplier");

		// Act
		var result = await _controller.GetAll();

		// Assert
		var actionResult = Assert.IsType<OkObjectResult>(result.Result);
		var products = Assert.IsType<List<Product>>(actionResult.Value);

		Assert.Single(products);
		Assert.Equal("My Product", products[0].Name);
	}

	[Fact]
	public async Task GetAll_ReturnsAllProducts_WhenAdmin()
	{
		// Arrange
		_db.Products.Add(new Product { Id = 1, Name = "P1", SupplierId = 10 });
		_db.Products.Add(new Product { Id = 2, Name = "P2", SupplierId = 20 });
		await _db.SaveChangesAsync();

		SetupUser(999, "Admin");

		// Act
		var result = await _controller.GetAll();

		// Assert
		var actionResult = Assert.IsType<OkObjectResult>(result.Result);
		var products = Assert.IsType<List<Product>>(actionResult.Value);

		Assert.Equal(2, products.Count);
	}

	[Fact]
	public async Task Update_ReturnsForbid_WhenUpdatingOtherSuppliersProduct()
	{
		// Arrange
		var supplierId = 10;
		var product = new Product { Id = 1, Name = "Original", SupplierId = 20 }; // Owned by ID 20
		_db.Products.Add(product);
		await _db.SaveChangesAsync();

		SetupUser(supplierId, "Supplier"); // Logged in as ID 10

		var dto = new ProductDto { Name = "Hacked", Species = "Test" };

		// Act
		var result = await _controller.Update(1, dto);

		// Assert
		Assert.IsType<ForbidResult>(result.Result);
	}

	[Fact]
	public async Task Update_UpdatesSuccessfully_WhenOwner()
	{
		// Arrange
		var supplierId = 10;
		var product = new Product { Id = 1, Name = "Original", SupplierId = supplierId };
		_db.Products.Add(product);
		await _db.SaveChangesAsync();

		SetupUser(supplierId, "Supplier");

		var dto = new ProductDto { Name = "Updated", Species = "New Species" };

		// Act
		var result = await _controller.Update(1, dto);

		// Assert
		var actionResult = Assert.IsType<OkObjectResult>(result.Result);
		var updatedProduct = Assert.IsType<Product>(actionResult.Value);

		Assert.Equal("Updated", updatedProduct.Name);

		var dbProduct = await _db.Products.FindAsync(1);
		Assert.Equal("Updated", dbProduct!.Name);
	}

	[Fact]
	public async Task Delete_Fails_IfProductInAuction()
	{
		// Arrange
		var supplierId = 10;
		var product = new Product { Id = 5, SupplierId = supplierId, AuctionId = 100 }; // Assigned to auction
		_db.Products.Add(product);
		await _db.SaveChangesAsync();

		SetupUser(supplierId, "Supplier");

		// Act
		var result = await _controller.Delete(5);

		// Assert
		var badRequest = Assert.IsType<BadRequestObjectResult>(result);
		Assert.Contains("auction", badRequest.Value!.ToString());
	}
}
