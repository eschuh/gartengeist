using Gartengeist.Api.Models.DTOs;

namespace Gartengeist.Api.Services.Interfaces;

public interface IWeatherService
{
    // null, wenn der Garten noch nicht eingerichtet ist
    Task<WeatherForecastResponse?> GetForecastAsync();
}
