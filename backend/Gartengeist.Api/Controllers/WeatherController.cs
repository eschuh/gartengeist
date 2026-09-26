using Gartengeist.Api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Gartengeist.Api.Controllers;

[ApiController]
[Route("api/wetter")]
public class WeatherController(IWeatherService weatherService) : ControllerBase
{
    [HttpGet("prognose")]
    public async Task<IActionResult> GetForecast()
    {
        try
        {
            var forecast = await weatherService.GetForecastAsync();
            return forecast is null ? NotFound(new { fehler = "Garten ist noch nicht eingerichtet." }) : Ok(forecast);
        }
        catch (HttpRequestException)
        {
            return StatusCode(StatusCodes.Status502BadGateway,
                new { fehler = "Wetterdienst gerade nicht erreichbar." });
        }
    }
}
