using System.ComponentModel.DataAnnotations.Schema;

namespace Gartengeist.Api.Models.Entities;

[Table("vorrat")]
public class InventoryItem
{
    [Column("id")]
    public Guid Id { get; set; }

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    // Freitext, z.B. „halbe Tüte“, „3 kg“
    [Column("menge")]
    public string? Quantity { get; set; }

    // saatgut | duenger | werkzeug | sonstiges
    [Column("kategorie")]
    public string Category { get; set; } = "sonstiges";

    // Bei Saatgut: zugehörige Pflanze im Katalog
    [Column("pflanze_id")]
    public Guid? PlantId { get; set; }
    public Plant? Plant { get; set; }

    // Bei Saatgut: keimfähig bis (Jahr)
    [Column("haltbar_bis")]
    public int? UsableUntilYear { get; set; }

    [Column("notizen")]
    public string? Notes { get; set; }

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTimeOffset UpdatedAt { get; set; }
}
