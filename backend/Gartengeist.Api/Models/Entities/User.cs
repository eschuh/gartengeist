using System.ComponentModel.DataAnnotations.Schema;

namespace Gartengeist.Api.Models.Entities;

[Table("nutzer")]
public class User
{
    [Column("id")]
    public Guid Id { get; set; }

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("email")]
    public string Email { get; set; } = string.Empty;

    [Column("password_hash")]
    public string PasswordHash { get; set; } = string.Empty;

    // Avatar-Farbe, damit man sieht, wer was eingetragen hat
    [Column("farbe")]
    public string Color { get; set; } = string.Empty;

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTimeOffset UpdatedAt { get; set; }
}
