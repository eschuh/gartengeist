using Gartengeist.Api.Models.DTOs;
using Gartengeist.Api.Models.Entities;
using Gartengeist.Api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Gartengeist.Api.Controllers;

[ApiController]
[Route("api/katalog")]
public class PlantController(IPlantService plantService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var plants = await plantService.GetAllAsync();
        return Ok(plants.Select(ToResponse));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var plant = await plantService.GetByIdAsync(id);
        return plant is null ? NotFound() : Ok(ToResponse(plant));
    }

    private static PlantResponse ToResponse(Plant plant) => new(
        plant.Id,
        plant.Key,
        plant.Name,
        plant.LatinName,
        plant.Family,
        plant.Category,
        Window(plant.PreCultivationFrom, plant.PreCultivationTo),
        Window(plant.DirectSowingFrom, plant.DirectSowingTo),
        Window(plant.PlantingOutFrom, plant.PlantingOutTo),
        Window(plant.HarvestFrom, plant.HarvestTo),
        plant.PreCultivationWeeks,
        plant.DaysToHarvest,
        plant.PlantSpacingCm,
        plant.RowSpacingCm,
        plant is { PlantSpacingCm: { } p, RowSpacingCm: { } r } ? Math.Round(p * r / 10000m, 3) : null,
        plant.NutrientDemand,
        plant.WaterDemand,
        plant.FrostSensitive,
        plant.Perennial,
        plant.GoodCompanions,
        plant.BadCompanions,
        plant.Note
    );

    private static MonthWindow? Window(int? from, int? to) =>
        from is { } f && to is { } t ? new MonthWindow(f, t) : null;
}
