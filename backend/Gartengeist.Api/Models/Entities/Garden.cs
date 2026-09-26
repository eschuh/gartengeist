using System.ComponentModel.DataAnnotations.Schema;

namespace Gartengeist.Api.Models.Entities;

// Einmalig pro Installation, geteilt von beiden Nutzern
[Table("garten")]
public class Garden
{
    [Column("id")]
    public Guid Id { get; set; }

    [Column("standort_name")]
    public string LocationName { get; set; } = string.Empty;

    [Column("plz")]
    public string? PostalCode { get; set; }

    [Column("lat")]
    public decimal Latitude { get; set; }

    [Column("lng")]
    public decimal Longitude { get; set; }

    [Column("haushaltsgroesse")]
    public int HouseholdSize { get; set; }

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTimeOffset UpdatedAt { get; set; }
}
