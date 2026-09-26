using Gartengeist.Api.Models.DTOs;

namespace Gartengeist.Api.Services.Weather;

// Abstrakte Wetterquelle – heute Open-Meteo/MeteoSchweiz, später auch eine eigene Wetterstation (Phase 7)
public interface IWeatherProvider
{
    // Enthält zusätzlich die letzten pastDays Tage (für Regen seit dem Gießen, nachgetragene Einträge)
    Task<IReadOnlyList<WeatherDay>> GetDailyForecastAsync(decimal latitude, decimal longitude, int days, int pastDays);

    // Tagesminimum der Lufttemperatur (2 m) aus der Wetterhistorie
    Task<IReadOnlyList<(DateOnly Date, decimal? TempMin)>> GetHistoricalMinTemperaturesAsync(
        decimal latitude, decimal longitude, DateOnly from, DateOnly to);
}
