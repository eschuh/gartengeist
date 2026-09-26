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
        ["weather_code", "temperature_2m_min", "temperature_2m_max", "precipitation_sum", "precipitation_probability_max"];

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
            return new WeatherDay(
                date,
                (int?)Value("weather_code", model, i),
                Value("temperature_2m_min", model, i),
                Value("temperature_2m_max", model, i),
                Value("precipitation_sum", model, i),
                (int?)(Value("precipitation_probability_max", model, i)
                    ?? Value("precipitation_probability_max", FallbackModel, i)),
                model == PrimaryModel ? "meteoschweiz" : "open-meteo");
        }).ToList();
    }
}
