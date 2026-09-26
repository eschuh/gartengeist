using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gartengeist.Api.Migrations
{
    /// <inheritdoc />
    public partial class PlantCatalogAndPlantings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "pflanze",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    schluessel = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    lateinisch = table.Column<string>(type: "text", nullable: true),
                    familie = table.Column<string>(type: "text", nullable: false),
                    kategorie = table.Column<string>(type: "text", nullable: false),
                    voranzucht_von = table.Column<int>(type: "integer", nullable: true),
                    voranzucht_bis = table.Column<int>(type: "integer", nullable: true),
                    direktsaat_von = table.Column<int>(type: "integer", nullable: true),
                    direktsaat_bis = table.Column<int>(type: "integer", nullable: true),
                    auspflanzen_von = table.Column<int>(type: "integer", nullable: true),
                    auspflanzen_bis = table.Column<int>(type: "integer", nullable: true),
                    ernte_von = table.Column<int>(type: "integer", nullable: true),
                    ernte_bis = table.Column<int>(type: "integer", nullable: true),
                    voranzucht_wochen = table.Column<int>(type: "integer", nullable: true),
                    tage_bis_ernte = table.Column<int>(type: "integer", nullable: true),
                    pflanzabstand_cm = table.Column<int>(type: "integer", nullable: true),
                    reihenabstand_cm = table.Column<int>(type: "integer", nullable: true),
                    naehrstoffbedarf = table.Column<string>(type: "text", nullable: false),
                    wasserbedarf = table.Column<string>(type: "text", nullable: false),
                    frostempfindlich = table.Column<bool>(type: "boolean", nullable: false),
                    mehrjaehrig = table.Column<bool>(type: "boolean", nullable: false),
                    mischkultur_gut = table.Column<string[]>(type: "text[]", nullable: false),
                    mischkultur_schlecht = table.Column<string[]>(type: "text[]", nullable: false),
                    hinweis = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pflanze", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "bepflanzung",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    flaeche_id = table.Column<Guid>(type: "uuid", nullable: false),
                    pflanze_id = table.Column<Guid>(type: "uuid", nullable: false),
                    sorte = table.Column<string>(type: "text", nullable: true),
                    anzahl = table.Column<int>(type: "integer", nullable: true),
                    aussaat_datum = table.Column<DateOnly>(type: "date", nullable: true),
                    pflanz_datum = table.Column<DateOnly>(type: "date", nullable: true),
                    voraussichtliche_ernte = table.Column<DateOnly>(type: "date", nullable: true),
                    notizen = table.Column<string>(type: "text", nullable: true),
                    beendet_am = table.Column<DateOnly>(type: "date", nullable: true),
                    angelegt_von = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bepflanzung", x => x.id);
                    table.ForeignKey(
                        name: "FK_bepflanzung_flaeche_flaeche_id",
                        column: x => x.flaeche_id,
                        principalTable: "flaeche",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_bepflanzung_nutzer_angelegt_von",
                        column: x => x.angelegt_von,
                        principalTable: "nutzer",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_bepflanzung_pflanze_pflanze_id",
                        column: x => x.pflanze_id,
                        principalTable: "pflanze",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_bepflanzung_angelegt_von",
                table: "bepflanzung",
                column: "angelegt_von");

            migrationBuilder.CreateIndex(
                name: "IX_bepflanzung_flaeche_id_beendet_am",
                table: "bepflanzung",
                columns: new[] { "flaeche_id", "beendet_am" });

            migrationBuilder.CreateIndex(
                name: "IX_bepflanzung_pflanze_id",
                table: "bepflanzung",
                column: "pflanze_id");

            migrationBuilder.CreateIndex(
                name: "IX_pflanze_schluessel",
                table: "pflanze",
                column: "schluessel",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "bepflanzung");

            migrationBuilder.DropTable(
                name: "pflanze");
        }
    }
}
