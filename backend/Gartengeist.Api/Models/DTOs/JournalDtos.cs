using System.ComponentModel.DataAnnotations;

namespace Gartengeist.Api.Models.DTOs;

public record JournalEntryRequest(
    [Required] DateOnly Date,
    [Required, RegularExpression("notiz|gegossen|geduengt|geerntet", ErrorMessage = "Unbekannter Eintragstyp.")]
    string Type,
    [MaxLength(5000)] string? Text,
    Guid? AreaId,
    Guid? PlantingId,
    [Range(0.001, 100000)] decimal? Amount,
    [RegularExpression("kg|g|stueck|bund", ErrorMessage = "Unbekannte Einheit.")] string? Unit
);

// Schnell-Aktion: ein Eintrag pro Fläche mit einem Tipp
public record QuickActionRequest(
    [Required, RegularExpression("gegossen|geduengt", ErrorMessage = "Unbekannte Schnell-Aktion.")] string Type,
    [Required, MinLength(1)] Guid[] AreaIds,
    DateOnly? Date
);

public record JournalPhotoResponse(Guid Id, string Url);

public record JournalWeather(decimal? TempMin, decimal? TempMax, decimal? PrecipitationMm, int? WeatherCode);

public record JournalEntryResponse(
    Guid Id,
    DateOnly Date,
    string Type,
    string? Text,
    Guid? AreaId,
    string? AreaName,
    Guid? PlantingId,
    string? PlantingName,
    decimal? Amount,
    string? Unit,
    UserResponse User,
    JournalWeather? Weather,
    IReadOnlyList<JournalPhotoResponse> Photos,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);

// Saison-Summe pro Kultur; Gramm werden zu Kilogramm zusammengefasst
public record HarvestSummaryItem(
    Guid PlantingId,
    string PlantName,
    string? Variety,
    string AreaName,
    string Unit,
    decimal Total,
    int HarvestCount,
    DateOnly LastHarvest
);
