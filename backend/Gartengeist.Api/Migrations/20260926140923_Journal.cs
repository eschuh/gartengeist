using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gartengeist.Api.Migrations
{
    /// <inheritdoc />
    public partial class Journal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tagebuch_eintrag",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    datum = table.Column<DateOnly>(type: "date", nullable: false),
                    typ = table.Column<string>(type: "text", nullable: false),
                    text = table.Column<string>(type: "text", nullable: true),
                    flaeche_id = table.Column<Guid>(type: "uuid", nullable: true),
                    bepflanzung_id = table.Column<Guid>(type: "uuid", nullable: true),
                    menge = table.Column<decimal>(type: "numeric(9,3)", precision: 9, scale: 3, nullable: true),
                    einheit = table.Column<string>(type: "text", nullable: true),
                    nutzer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    wetter_temp_min = table.Column<decimal>(type: "numeric(4,1)", precision: 4, scale: 1, nullable: true),
                    wetter_temp_max = table.Column<decimal>(type: "numeric(4,1)", precision: 4, scale: 1, nullable: true),
                    wetter_niederschlag_mm = table.Column<decimal>(type: "numeric(5,1)", precision: 5, scale: 1, nullable: true),
                    wetter_code = table.Column<int>(type: "integer", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tagebuch_eintrag", x => x.id);
                    table.ForeignKey(
                        name: "FK_tagebuch_eintrag_bepflanzung_bepflanzung_id",
                        column: x => x.bepflanzung_id,
                        principalTable: "bepflanzung",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_tagebuch_eintrag_flaeche_flaeche_id",
                        column: x => x.flaeche_id,
                        principalTable: "flaeche",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_tagebuch_eintrag_nutzer_nutzer_id",
                        column: x => x.nutzer_id,
                        principalTable: "nutzer",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "tagebuch_foto",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    eintrag_id = table.Column<Guid>(type: "uuid", nullable: false),
                    dateiname = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tagebuch_foto", x => x.id);
                    table.ForeignKey(
                        name: "FK_tagebuch_foto_tagebuch_eintrag_eintrag_id",
                        column: x => x.eintrag_id,
                        principalTable: "tagebuch_eintrag",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_tagebuch_eintrag_bepflanzung_id",
                table: "tagebuch_eintrag",
                column: "bepflanzung_id");

            migrationBuilder.CreateIndex(
                name: "IX_tagebuch_eintrag_datum",
                table: "tagebuch_eintrag",
                column: "datum");

            migrationBuilder.CreateIndex(
                name: "IX_tagebuch_eintrag_flaeche_id_typ_datum",
                table: "tagebuch_eintrag",
                columns: new[] { "flaeche_id", "typ", "datum" });

            migrationBuilder.CreateIndex(
                name: "IX_tagebuch_eintrag_nutzer_id",
                table: "tagebuch_eintrag",
                column: "nutzer_id");

            migrationBuilder.CreateIndex(
                name: "IX_tagebuch_foto_eintrag_id",
                table: "tagebuch_foto",
                column: "eintrag_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tagebuch_foto");

            migrationBuilder.DropTable(
                name: "tagebuch_eintrag");
        }
    }
}
