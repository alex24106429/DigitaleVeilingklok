using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PetalBid.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMaxPricePerUnitToProduct : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "MaxPricePerUnit",
                table: "Products",
                type: "REAL",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxPricePerUnit",
                table: "Products");
        }
    }
}
