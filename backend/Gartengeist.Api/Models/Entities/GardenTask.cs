using System.ComponentModel.DataAnnotations.Schema;

namespace Gartengeist.Api.Models.Entities;

[Table("aufgabe")]
public class GardenTask
{
    [Column("id")]
    public Guid Id { get; set; }

    [Column("titel")]
    public string Title { get; set; } = string.Empty;

    [Column("beschreibung")]
    public string? Description { get; set; }

    [Column("faellig_am")]
    public DateOnly DueDate { get; set; }

    // Gesetzt = wiederkehrend; beim Erledigen entsteht die nächste Aufgabe
    [Column("intervall_tage")]
    public int? IntervalDays { get; set; }

    // allgemein | voranzucht | winter
    [Column("kategorie")]
    public string Category { get; set; } = "allgemein";

    // manuell | automatisch | ki | dokument
    [Column("quelle")]
    public string Source { get; set; } = "manuell";

    // Eindeutiger Schlüssel automatisch erzeugter Aufgaben (z.B. „winter:2026:kompost“), verhindert Duplikate
    [Column("schluessel")]
    public string? Key { get; set; }

    [Column("flaeche_id")]
    public Guid? AreaId { get; set; }
    public Area? Area { get; set; }

    [Column("bepflanzung_id")]
    public Guid? PlantingId { get; set; }

    [Column("pflanze_id")]
    public Guid? PlantId { get; set; }
    public Plant? Plant { get; set; }

    // Vorherige Aufgabe einer Wiederholung (zum Zurücknehmen beim Wieder-Öffnen)
    [Column("vorgaenger_id")]
    public Guid? PreviousId { get; set; }

    [Column("erledigt_am")]
    public DateTimeOffset? DoneAt { get; set; }

    [Column("erledigt_von")]
    public Guid? DoneById { get; set; }
    public User? DoneBy { get; set; }

    // Automatische Aufgaben werden nicht gelöscht, sondern verworfen – sonst würden sie neu erzeugt
    [Column("verworfen_am")]
    public DateTimeOffset? DismissedAt { get; set; }

    [Column("angelegt_von")]
    public Guid? CreatedById { get; set; }
    public User? CreatedBy { get; set; }

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTimeOffset UpdatedAt { get; set; }
}
