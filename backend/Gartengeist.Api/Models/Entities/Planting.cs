using System.ComponentModel.DataAnnotations.Schema;

namespace Gartengeist.Api.Models.Entities;

// Was steht wo: eine Kultur auf einer Fläche. Beendete Kulturen bleiben für die Fruchtfolge erhalten.
[Table("bepflanzung")]
public class Planting
{
    [Column("id")]
    public Guid Id { get; set; }

    [Column("flaeche_id")]
    public Guid AreaId { get; set; }
    public Area Area { get; set; } = null!;

    [Column("pflanze_id")]
    public Guid PlantId { get; set; }
    public Plant Plant { get; set; } = null!;

    [Column("sorte")]
    public string? Variety { get; set; }

    [Column("anzahl")]
    public int? Count { get; set; }

    // Vor allem bei Direktsaat (Möhren, Radieschen …) zählt man Reihen statt Pflanzen; halbe Reihen möglich
    [Column("reihen")]
    public decimal? Rows { get; set; }

    [Column("aussaat_datum")]
    public DateOnly? SowingDate { get; set; }

    [Column("pflanz_datum")]
    public DateOnly? PlantingDate { get; set; }

    [Column("voraussichtliche_ernte")]
    public DateOnly? ExpectedHarvest { get; set; }

    [Column("notizen")]
    public string? Notes { get; set; }

    // Abgeerntet bzw. abgeräumt
    [Column("beendet_am")]
    public DateOnly? EndedOn { get; set; }

    [Column("angelegt_von")]
    public Guid CreatedById { get; set; }
    public User CreatedBy { get; set; } = null!;

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTimeOffset UpdatedAt { get; set; }
}
