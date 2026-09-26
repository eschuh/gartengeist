using System.ComponentModel.DataAnnotations;

namespace Gartengeist.Api.Models.DTOs;

public record PlantingRequest(
    [Required] Guid AreaId,
    [Required] Guid PlantId,
    [MaxLength(100)] string? Variety,
    [Range(1, 10000)] int? Count,
    [Range(1, 1000)] int? Rows,
    DateOnly? SowingDate,
    DateOnly? PlantingDate,
    [MaxLength(2000)] string? Notes
);

// Teilweise abräumen: Rows (Reihen) oder Count (Pflanzen) kleiner als bei der Kultur.
// Bei Reihen wird eine bekannte Pflanzenzahl anteilig mit aufgeteilt.
public record EndPlantingRequest(DateOnly? EndedOn, [Range(1, 10000)] int? Count, [Range(1, 1000)] int? Rows);

public record EndPlantingResponse(PlantingResponse Ended, PlantingResponse? Remaining, bool AreaFree);

public record PlantingResponse(
    Guid Id,
    Guid AreaId,
    string AreaName,
    Guid PlantId,
    string PlantName,
    string? Variety,
    int? Count,
    int? Rows,
    DateOnly? SowingDate,
    DateOnly? PlantingDate,
    DateOnly? ExpectedHarvest,
    string? Notes,
    DateOnly? EndedOn,
    UserResponse CreatedBy,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);
