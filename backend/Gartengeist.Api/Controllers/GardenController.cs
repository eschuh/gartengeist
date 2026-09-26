using Gartengeist.Api.Models.DTOs;
using Gartengeist.Api.Models.Entities;
using Gartengeist.Api.Services;
using Gartengeist.Api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Gartengeist.Api.Controllers;

[ApiController]
[Route("api/garten")]
public class GardenController(
    IGardenService gardenService,
    GeocodingService geocodingService,
    FrostDateService frostDateService) : ControllerBase
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
        await gardenService.SaveAsync(request);
        // Frostdaten gleich berechnen, damit sie sofort angezeigt werden (Fehler sind nicht kritisch)
        await frostDateService.EnsureAsync();
        var garden = await gardenService.GetAsync();
        return Ok(ToResponse(garden!));
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
        garden.HouseholdSize,
        garden.FrostCalculatedAt is null
            ? null
            : new FrostDates(garden.LastFrostMedian, garden.LastFrostSafe, garden.FirstFrostMedian, garden.FirstFrostEarly)
    );
}
