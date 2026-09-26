using System.ComponentModel.DataAnnotations;

namespace Gartengeist.Api.Models.DTOs;

public record TaskRequest(
    [Required, MaxLength(200)] string Title,
    [MaxLength(2000)] string? Description,
    [Required] DateOnly DueDate,
    [Range(1, 365)] int? IntervalDays,
    Guid? AreaId
);

public record TaskResponse(
    Guid Id,
    string Title,
    string? Description,
    DateOnly DueDate,
    int? IntervalDays,
    string Category,
    string Source,
    Guid? AreaId,
    string? AreaName,
    Guid? PlantId,
    string? PlantName,
    DateTimeOffset? DoneAt,
    UserResponse? DoneBy,
    UserResponse? CreatedBy,
    DateTimeOffset CreatedAt
);

// Geplante Voranzucht für die nächste Saison (noch keine Aufgabe)
public record PreCultivationPlan(
    Guid PlantId,
    string PlantName,
    DateOnly SowDate,
    DateOnly PlantOutDate,
    int Weeks,
    bool TaskCreated
);

public record WateringStatus(
    Guid AreaId,
    string AreaName,
    string AreaType,
    DateOnly? LastWatered,
    string? LastWateredBy,
    DateOnly? LastRain,
    int? DaysSince,
    int ThresholdDays,
    bool Due,
    string Reason
);
