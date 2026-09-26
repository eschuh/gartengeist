using System.ComponentModel.DataAnnotations;

namespace Gartengeist.Api.Models.DTOs;

public record PlantingRequest(
    [Required] Guid AreaId,
    [Required] Guid PlantId,
    [MaxLength(100)] string? Variety,
    [Range(1, 10000)] int? Count,
    DateOnly? SowingDate,
    DateOnly? PlantingDate,
    [MaxLength(2000)] string? Notes
);

// Count gesetzt und kleiner als die Anzahl der Kultur = nur teilweise abräumen
public record EndPlantingRequest(DateOnly? EndedOn, [Range(1, 10000)] int? Count);

public record EndPlantingResponse(PlantingResponse Ended, PlantingResponse? Remaining, bool AreaFree);

public record PlantingResponse(
    Guid Id,
    Guid AreaId,
    string AreaName,
    Guid PlantId,
    string PlantName,
    string? Variety,
    int? Count,
    DateOnly? SowingDate,
    DateOnly? PlantingDate,
    DateOnly? ExpectedHarvest,
    string? Notes,
    DateOnly? EndedOn,
    UserResponse CreatedBy,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);
