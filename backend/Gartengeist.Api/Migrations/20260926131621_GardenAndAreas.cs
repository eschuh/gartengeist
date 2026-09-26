using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gartengeist.Api.Migrations
{
    /// <inheritdoc />
    public partial class GardenAndAreas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "flaeche",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    typ = table.Column<string>(type: "text", nullable: false),
                    breite_m = table.Column<decimal>(type: "numeric(7,2)", precision: 7, scale: 2, nullable: true),
                    laenge_m = table.Column<decimal>(type: "numeric(7,2)", precision: 7, scale: 2, nullable: true),
                    beschreibung = table.Column<string>(type: "text", nullable: true),
                    archived_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_flaeche", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "garten",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    standort_name = table.Column<string>(type: "text", nullable: false),
                    plz = table.Column<string>(type: "text", nullable: true),
                    lat = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: false),
                    lng = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: false),
                    haushaltsgroesse = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_garten", x => x.id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "flaeche");

            migrationBuilder.DropTable(
                name: "garten");
        }
    }
}
