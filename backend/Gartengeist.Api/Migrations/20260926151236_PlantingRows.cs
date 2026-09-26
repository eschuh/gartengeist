using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gartengeist.Api.Migrations
{
    /// <inheritdoc />
    public partial class PlantingRows : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "reihen",
                table: "bepflanzung",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "reihen",
                table: "bepflanzung");
        }
    }
}
