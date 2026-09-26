using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gartengeist.Api.Migrations
{
    /// <inheritdoc />
    public partial class TasksListsFrost : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "frost_berechnet_am",
                table: "garten",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "frost_erster_frueh",
                table: "garten",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "frost_erster_median",
                table: "garten",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "frost_letzter_median",
                table: "garten",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "frost_letzter_sicher",
                table: "garten",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "aufgabe",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    titel = table.Column<string>(type: "text", nullable: false),
                    beschreibung = table.Column<string>(type: "text", nullable: true),
                    faellig_am = table.Column<DateOnly>(type: "date", nullable: false),
                    intervall_tage = table.Column<int>(type: "integer", nullable: true),
                    kategorie = table.Column<string>(type: "text", nullable: false),
                    quelle = table.Column<string>(type: "text", nullable: false),
                    schluessel = table.Column<string>(type: "text", nullable: true),
                    flaeche_id = table.Column<Guid>(type: "uuid", nullable: true),
                    bepflanzung_id = table.Column<Guid>(type: "uuid", nullable: true),
                    pflanze_id = table.Column<Guid>(type: "uuid", nullable: true),
                    vorgaenger_id = table.Column<Guid>(type: "uuid", nullable: true),
                    erledigt_am = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    erledigt_von = table.Column<Guid>(type: "uuid", nullable: true),
                    verworfen_am = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    angelegt_von = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_aufgabe", x => x.id);
                    table.ForeignKey(
                        name: "FK_aufgabe_bepflanzung_bepflanzung_id",
                        column: x => x.bepflanzung_id,
                        principalTable: "bepflanzung",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_aufgabe_flaeche_flaeche_id",
                        column: x => x.flaeche_id,
                        principalTable: "flaeche",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_aufgabe_nutzer_angelegt_von",
                        column: x => x.angelegt_von,
                        principalTable: "nutzer",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_aufgabe_nutzer_erledigt_von",
                        column: x => x.erledigt_von,
                        principalTable: "nutzer",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_aufgabe_pflanze_pflanze_id",
                        column: x => x.pflanze_id,
                        principalTable: "pflanze",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "einkauf",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    menge = table.Column<string>(type: "text", nullable: true),
                    kategorie = table.Column<string>(type: "text", nullable: false),
                    erledigt = table.Column<bool>(type: "boolean", nullable: false),
                    hinzugefuegt_von = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_einkauf", x => x.id);
                    table.ForeignKey(
                        name: "FK_einkauf_nutzer_hinzugefuegt_von",
                        column: x => x.hinzugefuegt_von,
                        principalTable: "nutzer",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "vorrat",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    menge = table.Column<string>(type: "text", nullable: true),
                    kategorie = table.Column<string>(type: "text", nullable: false),
                    pflanze_id = table.Column<Guid>(type: "uuid", nullable: true),
                    haltbar_bis = table.Column<int>(type: "integer", nullable: true),
                    notizen = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vorrat", x => x.id);
                    table.ForeignKey(
                        name: "FK_vorrat_pflanze_pflanze_id",
                        column: x => x.pflanze_id,
                        principalTable: "pflanze",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_aufgabe_angelegt_von",
                table: "aufgabe",
                column: "angelegt_von");

            migrationBuilder.CreateIndex(
                name: "IX_aufgabe_bepflanzung_id",
                table: "aufgabe",
                column: "bepflanzung_id");

            migrationBuilder.CreateIndex(
                name: "IX_aufgabe_erledigt_am_faellig_am",
                table: "aufgabe",
                columns: new[] { "erledigt_am", "faellig_am" });

            migrationBuilder.CreateIndex(
                name: "IX_aufgabe_erledigt_von",
                table: "aufgabe",
                column: "erledigt_von");

            migrationBuilder.CreateIndex(
                name: "IX_aufgabe_flaeche_id",
                table: "aufgabe",
                column: "flaeche_id");

            migrationBuilder.CreateIndex(
                name: "IX_aufgabe_pflanze_id",
                table: "aufgabe",
                column: "pflanze_id");

            migrationBuilder.CreateIndex(
                name: "IX_aufgabe_schluessel",
                table: "aufgabe",
                column: "schluessel",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_einkauf_hinzugefuegt_von",
                table: "einkauf",
                column: "hinzugefuegt_von");

            migrationBuilder.CreateIndex(
                name: "IX_vorrat_pflanze_id",
                table: "vorrat",
                column: "pflanze_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "aufgabe");

            migrationBuilder.DropTable(
                name: "einkauf");

            migrationBuilder.DropTable(
                name: "vorrat");

            migrationBuilder.DropColumn(
                name: "frost_berechnet_am",
                table: "garten");

            migrationBuilder.DropColumn(
                name: "frost_erster_frueh",
                table: "garten");

            migrationBuilder.DropColumn(
                name: "frost_erster_median",
                table: "garten");

            migrationBuilder.DropColumn(
                name: "frost_letzter_median",
                table: "garten");

            migrationBuilder.DropColumn(
                name: "frost_letzter_sicher",
                table: "garten");
        }
    }
}
