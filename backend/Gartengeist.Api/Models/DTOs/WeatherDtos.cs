namespace Gartengeist.Api.Models.DTOs;

public record WeatherDay(
    DateOnly Date,
    int? WeatherCode,
    decimal? TempMin,
    decimal? TempMax,
    decimal? PrecipitationMm,
    int? PrecipitationProbability,
    // "meteoschweiz" oder "open-meteo" (Ersatzmodell, wenn MeteoSchweiz nicht so weit reicht)
    string Source
);

public record WeatherForecastResponse(
    string LocationName,
    DateTimeOffset FetchedAt,
    IReadOnlyList<WeatherDay> Days
);
