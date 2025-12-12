using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PetalBid.Api.Migrations
{
    /// <inheritdoc />
    public partial class UserPFP : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ProfileImageBase64",
                table: "AspNetUsers",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProfileImageBase64",
                table: "AspNetUsers");
        }
    }
}
