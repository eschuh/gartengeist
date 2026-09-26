using System.Globalization;
using System.Text.Json;
using Gartengeist.Api.Models.DTOs;

namespace Gartengeist.Api.Services.Weather;

// Open-Meteo mit dem MeteoSchweiz-Modell ICON-CH1/CH2 (1–2 km, ca. 5 Tage).
// Für spätere Tage füllt das globale Standardmodell (best_match) auf.
public class OpenMeteoWeatherProvider(IHttpClientFactory httpClientFactory) : IWeatherProvider
{
    private const string PrimaryModel = "meteoswiss_icon_seamless";
    private const string FallbackModel = "best_match";
    private static readonly string[] Variables =
    [
        "weather_code", "temperature_2m_min", "temperature_2m_max", "precipitation_sum",
        "precipitation_probability_max", "sunshine_duration", "daylight_duration"
    ];

    public async Task<IReadOnlyList<WeatherDay>> GetDailyForecastAsync(decimal latitude, decimal longitude, int days)
    {
        var client = httpClientFactory.CreateClient("openmeteo");
        var url = string.Create(CultureInfo.InvariantCulture,
            $"v1/forecast?latitude={latitude}&longitude={longitude}&daily={string.Join(',', Variables)}" +
            $"&models={PrimaryModel},{FallbackModel}&forecast_days={days}&timezone=auto");

        using var document = JsonDocument.Parse(await client.GetStringAsync(url));
        var daily = document.RootElement.GetProperty("daily");
        var dates = daily.GetProperty("time").EnumerateArray().Select(d => DateOnly.Parse(d.GetString()!)).ToList();

        decimal? Value(string variable, string model, int index)
        {
            if (!daily.TryGetProperty($"{variable}_{model}", out var values)) return null;
            var element = values[index];
            return element.ValueKind == JsonValueKind.Number ? element.GetDecimal() : null;
        }

        return dates.Select((date, i) =>
        {
            var model = Value("temperature_2m_min", PrimaryModel, i) is null ? FallbackModel : PrimaryModel;
            var sunshineSeconds = Value("sunshine_duration", model, i);
            return new WeatherDay(
                date,
                DailyWeatherCode(
                    (int?)Value("weather_code", model, i),
                    sunshineSeconds,
                    Value("daylight_duration", model, i)),
                Value("temperature_2m_min", model, i),
                Value("temperature_2m_max", model, i),
                Value("precipitation_sum", model, i),
                (int?)(Value("precipitation_probability_max", model, i)
                    ?? Value("precipitation_probability_max", FallbackModel, i)),
                sunshineSeconds is { } s ? Math.Round(s / 3600m, 1) : null,
                model == PrimaryModel ? "meteoschweiz" : "open-meteo");
        }).ToList();
    }

    // Der Tages-Wettercode ist der „schlechteste“ Stundenwert: eine Stunde Schleierwolken macht
    // einen Sonnentag zu „bewölkt“. Für trockene Tage (Code 0–3) daher aus der Sonnenscheindauer
    // ableiten; Nebel, Regen, Schnee und Gewitter bleiben wie vom Modell geliefert.
    private static int? DailyWeatherCode(int? code, decimal? sunshineSeconds, decimal? daylightSeconds)
    {
        if (code is > 3 || sunshineSeconds is null || daylightSeconds is not > 0) return code;

        var sunshineShare = sunshineSeconds.Value / daylightSeconds.Value;
        return sunshineShare switch
        {
            >= 0.75m => 0, // sonnig
            >= 0.45m => 2, // leicht bewölkt
            _ => 3         // bewölkt
        };
    }
}
