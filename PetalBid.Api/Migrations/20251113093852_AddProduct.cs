using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PetalBid.Api.Migrations
{
	/// <inheritdoc />
	public partial class AddProduct : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			// Drop the old foreign key before altering the column
			migrationBuilder.DropForeignKey(
				name: "FK_Products_Auctions_AuctionId",
				table: "Products");

			// Add the new columns
			migrationBuilder.AddColumn<double>(
				name: "MinimumPrice",
				table: "Products",
				type: "REAL",
				nullable: false,
				defaultValue: 0.0);

			migrationBuilder.AddColumn<int>(
				name: "SupplierId",
				table: "Products",
				type: "INTEGER",
				nullable: false,
				defaultValue: 0);

			// Make the AuctionId column nullable
			migrationBuilder.AlterColumn<int>(
				name: "AuctionId",
				table: "Products",
				type: "INTEGER",
				nullable: true,
				oldClrType: typeof(int),
				oldType: "INTEGER");

			// Add the new index
			migrationBuilder.CreateIndex(
				name: "IX_Products_SupplierId",
				table: "Products",
				column: "SupplierId");

			// Re-add the foreign key for Auction with SetNull on delete
			migrationBuilder.AddForeignKey(
				name: "FK_Products_Auctions_AuctionId",
				table: "Products",
				column: "AuctionId",
				principalTable: "Auctions",
				principalColumn: "Id",
				onDelete: ReferentialAction.SetNull);

			// Add the foreign key for the new SupplierId column
			migrationBuilder.AddForeignKey(
				name: "FK_Products_Suppliers_SupplierId",
				table: "Products",
				column: "SupplierId",
				principalTable: "Suppliers",
				principalColumn: "Id",
				onDelete: ReferentialAction.Cascade);
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			// Reverse all the operations from the Up method
			migrationBuilder.DropForeignKey(
				name: "FK_Products_Auctions_AuctionId",
				table: "Products");

			migrationBuilder.DropForeignKey(
				name: "FK_Products_Suppliers_SupplierId",
				table: "Products");

			migrationBuilder.DropIndex(
				name: "IX_Products_SupplierId",
				table: "Products");

			migrationBuilder.DropColumn(
				name: "MinimumPrice",
				table: "Products");

			migrationBuilder.DropColumn(
				name: "SupplierId",
				table: "Products");

			// Revert AuctionId to be non-nullable
			migrationBuilder.AlterColumn<int>(
				name: "AuctionId",
				table: "Products",
				type: "INTEGER",
				nullable: false,
				defaultValue: 0,
				oldClrType: typeof(int),
				oldType: "INTEGER",
				oldNullable: true);

			// Re-add the original foreign key for Auction with Cascade on delete
			migrationBuilder.AddForeignKey(
				name: "FK_Products_Auctions_AuctionId",
				table: "Products",
				column: "AuctionId",
				principalTable: "Auctions",
				principalColumn: "Id",
				onDelete: ReferentialAction.Cascade);
		}
	}
}
