using System.ComponentModel.DataAnnotations.Schema;

namespace Gartengeist.Api.Models.Entities;

[Table("einkauf")]
public class ShoppingItem
{
    [Column("id")]
    public Guid Id { get; set; }

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    // Freitext, z.B. „2 Säcke“ oder „1 Tüte“
    [Column("menge")]
    public string? Quantity { get; set; }

    // saatgut | pflanzen | duenger | werkzeug | sonstiges
    [Column("kategorie")]
    public string Category { get; set; } = "sonstiges";

    [Column("erledigt")]
    public bool Done { get; set; }

    [Column("hinzugefuegt_von")]
    public Guid AddedById { get; set; }
    public User AddedBy { get; set; } = null!;

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTimeOffset UpdatedAt { get; set; }
}
