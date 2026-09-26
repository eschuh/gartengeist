using Gartengeist.Api.Models.DTOs;
using Gartengeist.Api.Repositories.Interfaces;
using Gartengeist.Api.Services.Interfaces;
using Gartengeist.Api.Services.Weather;
using Microsoft.Extensions.Caching.Memory;

namespace Gartengeist.Api.Services;

public class WeatherService(
    IGardenRepository gardenRepository,
    IWeatherProvider weatherProvider,
    IMemoryCache cache) : IWeatherService
{
    private const int ForecastDays = 7;
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(30);

    public async Task<WeatherForecastResponse?> GetForecastAsync()
    {
        var garden = await gardenRepository.GetAsync();
        if (garden is null) return null;

        // Cache-Schlüssel mit Koordinaten, damit ein geänderter Standort sofort neue Daten liefert
        var key = $"forecast:{garden.Latitude}:{garden.Longitude}";
        return await cache.GetOrCreateAsync(key, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = CacheDuration;
            var days = await weatherProvider.GetDailyForecastAsync(garden.Latitude, garden.Longitude, ForecastDays);
            return new WeatherForecastResponse(garden.LocationName, DateTimeOffset.UtcNow, days);
        });
    }
}
