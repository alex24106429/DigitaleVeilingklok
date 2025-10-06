using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PetalBid.Api.Migrations
{
	/// <inheritdoc />
	public partial class InitialCreate : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.CreateTable(
				name: "Users",
				columns: table => new
				{
					Id = table.Column<int>(type: "INTEGER", nullable: false)
						.Annotation("Sqlite:Autoincrement", true),
					FullName = table.Column<string>(type: "TEXT", nullable: false),
					Email = table.Column<string>(type: "TEXT", nullable: false),
					PasswordHash = table.Column<string>(type: "TEXT", nullable: false),
					Role = table.Column<int>(type: "INTEGER", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_Users", x => x.Id);
				});

			migrationBuilder.CreateTable(
				name: "Auctioneers",
				columns: table => new
				{
					Id = table.Column<int>(type: "INTEGER", nullable: false)
						.Annotation("Sqlite:Autoincrement", true),
					UserId = table.Column<int>(type: "INTEGER", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_Auctioneers", x => x.Id);
					table.ForeignKey(
						name: "FK_Auctioneers_Users_UserId",
						column: x => x.UserId,
						principalTable: "Users",
						principalColumn: "Id",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateTable(
				name: "Buyers",
				columns: table => new
				{
					Id = table.Column<int>(type: "INTEGER", nullable: false)
						.Annotation("Sqlite:Autoincrement", true),
					CompanyName = table.Column<string>(type: "TEXT", nullable: false),
					UserId = table.Column<int>(type: "INTEGER", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_Buyers", x => x.Id);
					table.ForeignKey(
						name: "FK_Buyers_Users_UserId",
						column: x => x.UserId,
						principalTable: "Users",
						principalColumn: "Id",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateTable(
				name: "Suppliers",
				columns: table => new
				{
					Id = table.Column<int>(type: "INTEGER", nullable: false)
						.Annotation("Sqlite:Autoincrement", true),
					CompanyName = table.Column<string>(type: "TEXT", nullable: false),
					UserId = table.Column<int>(type: "INTEGER", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_Suppliers", x => x.Id);
					table.ForeignKey(
						name: "FK_Suppliers_Users_UserId",
						column: x => x.UserId,
						principalTable: "Users",
						principalColumn: "Id",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateTable(
				name: "Auctions",
				columns: table => new
				{
					Id = table.Column<int>(type: "INTEGER", nullable: false)
						.Annotation("Sqlite:Autoincrement", true),
					Description = table.Column<string>(type: "TEXT", nullable: false),
					StartsAt = table.Column<DateTime>(type: "TEXT", nullable: false),
					Quantity = table.Column<int>(type: "INTEGER", nullable: false),
					ReservePrice = table.Column<int>(type: "INTEGER", nullable: false),
					ClockLocation = table.Column<int>(type: "INTEGER", nullable: false),
					AuctioneerId = table.Column<int>(type: "INTEGER", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_Auctions", x => x.Id);
					table.ForeignKey(
						name: "FK_Auctions_Auctioneers_AuctioneerId",
						column: x => x.AuctioneerId,
						principalTable: "Auctioneers",
						principalColumn: "Id",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateTable(
				name: "Products",
				columns: table => new
				{
					Id = table.Column<int>(type: "INTEGER", nullable: false)
						.Annotation("Sqlite:Autoincrement", true),
					Name = table.Column<string>(type: "TEXT", nullable: false),
					Weight = table.Column<double>(type: "REAL", nullable: false),
					ImageUrl = table.Column<string>(type: "TEXT", nullable: false),
					Species = table.Column<string>(type: "TEXT", nullable: false),
					PotSize = table.Column<double>(type: "REAL", nullable: true),
					StemLength = table.Column<double>(type: "REAL", nullable: true),
					Stock = table.Column<int>(type: "INTEGER", nullable: false),
					AuctionId = table.Column<int>(type: "INTEGER", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_Products", x => x.Id);
					table.ForeignKey(
						name: "FK_Products_Auctions_AuctionId",
						column: x => x.AuctionId,
						principalTable: "Auctions",
						principalColumn: "Id",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateTable(
				name: "Sales",
				columns: table => new
				{
					Id = table.Column<int>(type: "INTEGER", nullable: false)
						.Annotation("Sqlite:Autoincrement", true),
					AuctionId = table.Column<int>(type: "INTEGER", nullable: false),
					BuyerId = table.Column<int>(type: "INTEGER", nullable: false),
					OccurredAt = table.Column<DateTime>(type: "TEXT", nullable: false),
					PaymentReference = table.Column<string>(type: "TEXT", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_Sales", x => x.Id);
					table.ForeignKey(
						name: "FK_Sales_Auctions_AuctionId",
						column: x => x.AuctionId,
						principalTable: "Auctions",
						principalColumn: "Id",
						onDelete: ReferentialAction.Restrict);
					table.ForeignKey(
						name: "FK_Sales_Buyers_BuyerId",
						column: x => x.BuyerId,
						principalTable: "Buyers",
						principalColumn: "Id",
						onDelete: ReferentialAction.Restrict);
				});

			migrationBuilder.CreateTable(
				name: "SaleItems",
				columns: table => new
				{
					Id = table.Column<int>(type: "INTEGER", nullable: false)
						.Annotation("Sqlite:Autoincrement", true),
					SaleId = table.Column<int>(type: "INTEGER", nullable: false),
					ProductId = table.Column<int>(type: "INTEGER", nullable: false),
					Quantity = table.Column<int>(type: "INTEGER", nullable: false),
					UnitPrice = table.Column<int>(type: "INTEGER", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_SaleItems", x => x.Id);
					table.ForeignKey(
						name: "FK_SaleItems_Products_ProductId",
						column: x => x.ProductId,
						principalTable: "Products",
						principalColumn: "Id",
						onDelete: ReferentialAction.Cascade);
					table.ForeignKey(
						name: "FK_SaleItems_Sales_SaleId",
						column: x => x.SaleId,
						principalTable: "Sales",
						principalColumn: "Id",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateIndex(
				name: "IX_Auctioneers_UserId",
				table: "Auctioneers",
				column: "UserId");

			migrationBuilder.CreateIndex(
				name: "IX_Auctions_AuctioneerId",
				table: "Auctions",
				column: "AuctioneerId");

			migrationBuilder.CreateIndex(
				name: "IX_Buyers_UserId",
				table: "Buyers",
				column: "UserId");

			migrationBuilder.CreateIndex(
				name: "IX_Products_AuctionId",
				table: "Products",
				column: "AuctionId");

			migrationBuilder.CreateIndex(
				name: "IX_SaleItems_ProductId",
				table: "SaleItems",
				column: "ProductId");

			migrationBuilder.CreateIndex(
				name: "IX_SaleItems_SaleId",
				table: "SaleItems",
				column: "SaleId");

			migrationBuilder.CreateIndex(
				name: "IX_Sales_AuctionId",
				table: "Sales",
				column: "AuctionId");

			migrationBuilder.CreateIndex(
				name: "IX_Sales_BuyerId",
				table: "Sales",
				column: "BuyerId");

			migrationBuilder.CreateIndex(
				name: "IX_Suppliers_UserId",
				table: "Suppliers",
				column: "UserId");
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropTable(
				name: "SaleItems");

			migrationBuilder.DropTable(
				name: "Suppliers");

			migrationBuilder.DropTable(
				name: "Products");

			migrationBuilder.DropTable(
				name: "Sales");

			migrationBuilder.DropTable(
				name: "Auctions");

			migrationBuilder.DropTable(
				name: "Buyers");

			migrationBuilder.DropTable(
				name: "Auctioneers");

			migrationBuilder.DropTable(
				name: "Users");
		}
	}
}
