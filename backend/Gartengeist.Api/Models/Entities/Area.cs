using System.ComponentModel.DataAnnotations.Schema;

namespace Gartengeist.Api.Models.Entities;

[Table("flaeche")]
public class Area
{
    [Column("id")]
    public Guid Id { get; set; }

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("typ")]
    public AreaType Type { get; set; } = AreaType.Freiland;

    [Column("breite_m")]
    public decimal? Width { get; set; }

    [Column("laenge_m")]
    public decimal? Length { get; set; }

    [Column("beschreibung")]
    public string? Description { get; set; }

    [Column("archived_at")]
    public DateTimeOffset? ArchivedAt { get; set; }

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTimeOffset UpdatedAt { get; set; }
}
