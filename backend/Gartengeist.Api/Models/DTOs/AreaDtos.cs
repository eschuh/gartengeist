using System.ComponentModel.DataAnnotations;

namespace Gartengeist.Api.Models.DTOs;

public record AreaRequest(
    [Required, MaxLength(100)] string Name,
    [Required, RegularExpression("freiland|gewaechshaus|tomatenhaus|naturnah",
        ErrorMessage = "Unbekannter Flächentyp.")] string Type,
    [Range(0.1, 1000)] decimal? Width,
    [Range(0.1, 1000)] decimal? Length,
    [MaxLength(2000)] string? Description
);

public record AreaResponse(
    Guid Id,
    string Name,
    string Type,
    decimal? Width,
    decimal? Length,
    string? Description,
    DateTimeOffset? ArchivedAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);
