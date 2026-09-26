using Gartengeist.Api.Models.DTOs;
using Gartengeist.Api.Models.Entities;
using Gartengeist.Api.Services;
using Gartengeist.Api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Gartengeist.Api.Controllers;

[ApiController]
[Route("api/garten")]
public class GardenController(IGardenService gardenService, GeocodingService geocodingService) : ControllerBase
{
    // 404 = Einrichtung noch nicht abgeschlossen
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var garden = await gardenService.GetAsync();
        return garden is null ? NotFound() : Ok(ToResponse(garden));
    }

    [HttpPut]
    public async Task<IActionResult> Save([FromBody] GardenRequest request)
    {
        var garden = await gardenService.SaveAsync(request);
        return Ok(ToResponse(garden));
    }

    [HttpGet("ortssuche")]
    public async Task<IActionResult> SearchPlace([FromQuery] string q)
    {
        try
        {
            return Ok(await geocodingService.SearchAsync(q));
        }
        catch (HttpRequestException)
        {
            return StatusCode(StatusCodes.Status502BadGateway,
                new { fehler = "Ortssuche gerade nicht erreichbar. Bitte später nochmal versuchen." });
        }
    }

    private static GardenResponse ToResponse(Garden garden) => new(
        garden.LocationName,
        garden.PostalCode,
        garden.Latitude,
        garden.Longitude,
        garden.HouseholdSize
    );
}
