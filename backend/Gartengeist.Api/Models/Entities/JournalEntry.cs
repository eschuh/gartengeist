using System.ComponentModel.DataAnnotations.Schema;

namespace Gartengeist.Api.Models.Entities;

// Tagebucheintrag. Schnell-Aktionen (gegossen/gedüngt) und Ernten sind ebenfalls Einträge,
// damit alles in einer Zeitleiste steht – mit Person, Wetter und Fotos.
[Table("tagebuch_eintrag")]
public class JournalEntry
{
    [Column("id")]
    public Guid Id { get; set; }

    [Column("datum")]
    public DateOnly Date { get; set; }

    [Column("typ")]
    public JournalEntryType Type { get; set; } = JournalEntryType.Notiz;

    [Column("text")]
    public string? Text { get; set; }

    [Column("flaeche_id")]
    public Guid? AreaId { get; set; }
    public Area? Area { get; set; }

    [Column("bepflanzung_id")]
    public Guid? PlantingId { get; set; }
    public Planting? Planting { get; set; }

    // Nur bei Typ „geerntet“
    [Column("menge")]
    public decimal? Amount { get; set; }

    // kg | g | stueck | bund
    [Column("einheit")]
    public string? Unit { get; set; }

    [Column("nutzer_id")]
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    // Wetter-Snapshot vom Tag des Eintrags (Prognose des Tages, sofern verfügbar)
    [Column("wetter_temp_min")]
    public decimal? WeatherTempMin { get; set; }

    [Column("wetter_temp_max")]
    public decimal? WeatherTempMax { get; set; }

    [Column("wetter_niederschlag_mm")]
    public decimal? WeatherPrecipitationMm { get; set; }

    [Column("wetter_code")]
    public int? WeatherCode { get; set; }

    public List<JournalPhoto> Photos { get; set; } = [];

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTimeOffset UpdatedAt { get; set; }
}
