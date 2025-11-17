using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PetalBid.Api.Migrations
{
	/// <inheritdoc />
	public partial class AddTwoFactorToUsers : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AddColumn<bool>(
				name: "IsTotpEnabled",
				table: "Users",
				type: "INTEGER",
				nullable: false,
				defaultValue: false);

			migrationBuilder.AddColumn<string>(
				name: "TotpSecret",
				table: "Users",
				type: "TEXT",
				nullable: true);
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropColumn(
				name: "IsTotpEnabled",
				table: "Users");

			migrationBuilder.DropColumn(
				name: "TotpSecret",
				table: "Users");
		}
	}
}