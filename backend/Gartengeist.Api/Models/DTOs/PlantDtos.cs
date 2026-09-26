namespace Gartengeist.Api.Models.DTOs;

public record MonthWindow(int From, int To);

public record PlantResponse(
    Guid Id,
    string Key,
    string Name,
    string? LatinName,
    string Family,
    string Category,
    MonthWindow? PreCultivation,
    MonthWindow? DirectSowing,
    MonthWindow? PlantingOut,
    MonthWindow? Harvest,
    int? PreCultivationWeeks,
    int? DaysToHarvest,
    int? PlantSpacingCm,
    int? RowSpacingCm,
    decimal? SpacePerPlantM2,
    string NutrientDemand,
    string WaterDemand,
    bool FrostSensitive,
    bool Perennial,
    string[] GoodCompanions,
    string[] BadCompanions,
    string? Note
);
