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

    // Frostdaten aus 10 Jahren Wetterhistorie als „MM-dd“ (siehe FrostDateService)
    [Column("frost_letzter_median")]
    public string? LastFrostMedian { get; set; }

    // In 8 von 10 Jahren war der letzte Frost bis dahin vorbei
    [Column("frost_letzter_sicher")]
    public string? LastFrostSafe { get; set; }

    [Column("frost_erster_median")]
    public string? FirstFrostMedian { get; set; }

    // In 8 von 10 Jahren kam der erste Frost erst danach
    [Column("frost_erster_frueh")]
    public string? FirstFrostEarly { get; set; }

    [Column("frost_berechnet_am")]
    public DateTimeOffset? FrostCalculatedAt { get; set; }

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTimeOffset UpdatedAt { get; set; }
}
