using Gartengeist.Api.Models.DTOs;

namespace Gartengeist.Api.Services.Weather;

// Abstrakte Wetterquelle – heute Open-Meteo/MeteoSchweiz, später auch eine eigene Wetterstation (Phase 7)
public interface IWeatherProvider
{
    Task<IReadOnlyList<WeatherDay>> GetDailyForecastAsync(decimal latitude, decimal longitude, int days);
}
