using System.ComponentModel.DataAnnotations.Schema;

namespace Gartengeist.Api.Models.Entities;

[Table("tagebuch_foto")]
public class JournalPhoto
{
    [Column("id")]
    public Guid Id { get; set; }

    [Column("eintrag_id")]
    public Guid EntryId { get; set; }

    // Zufälliger Name (GUID) im Upload-Verzeichnis
    [Column("dateiname")]
    public string FileName { get; set; } = string.Empty;

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }
}
