namespace Gartengeist.Api.Models.DTOs;

public record NextCropRecommendation(
    Guid PlantId,
    string PlantName,
    // „säen“ (Direktsaat) oder „pflanzen“ (Jungpflanzen setzen)
    string Action,
    DateOnly? HarvestFrom,
    int Score,
    IReadOnlyList<string> Reasons
);

public record AreaRecommendations(
    bool AreaFree,
    // Geschätzt aus Flächengröße und Platzbedarf der laufenden Kulturen; null, wenn nicht berechenbar
    decimal? FreeM2,
    string? PreviousCrop,
    IReadOnlyList<NextCropRecommendation> Items,
    // Allgemeiner Hinweis, z.B. wenn die Saison für Neues vorbei ist
    string? Hint
);
