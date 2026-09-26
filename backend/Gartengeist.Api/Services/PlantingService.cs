using Gartengeist.Api.Models.DTOs;
using Gartengeist.Api.Models.Entities;
using Gartengeist.Api.Repositories.Interfaces;
using Gartengeist.Api.Services.Interfaces;

namespace Gartengeist.Api.Services;

public class PlantingService(
    IPlantingRepository plantingRepository,
    IPlantRepository plantRepository,
    IAreaRepository areaRepository) : IPlantingService
{
    public Task<IEnumerable<Planting>> GetAllAsync(Guid? areaId, bool includeEnded) =>
        plantingRepository.GetAllAsync(areaId, includeEnded);

    public Task<Planting?> GetByIdAsync(Guid id) =>
        plantingRepository.GetByIdAsync(id);

    public async Task<Planting> CreateAsync(PlantingRequest request, Guid userId)
    {
        var planting = await ToEntityAsync(request);
        planting.CreatedById = userId;
        return await plantingRepository.CreateAsync(planting);
    }

    public async Task<Planting?> UpdateAsync(Guid id, PlantingRequest request)
    {
        var planting = await ToEntityAsync(request);
        planting.Id = id;
        return await plantingRepository.UpdateAsync(planting);
    }

    public Task<Planting?> EndAsync(Guid id, DateOnly? endedOn) =>
        plantingRepository.EndAsync(id, endedOn ?? DateOnly.FromDateTime(DateTime.Today));

    public Task<bool> DeleteAsync(Guid id) =>
        plantingRepository.DeleteAsync(id);

    private async Task<Planting> ToEntityAsync(PlantingRequest request)
    {
        var plant = await plantRepository.GetByIdAsync(request.PlantId)
            ?? throw new ArgumentException("Pflanze nicht im Katalog gefunden.");
        _ = await areaRepository.GetByIdAsync(request.AreaId)
            ?? throw new ArgumentException("Fläche nicht gefunden.");

        return new Planting
        {
            AreaId = request.AreaId,
            PlantId = request.PlantId,
            Variety = string.IsNullOrWhiteSpace(request.Variety) ? null : request.Variety.Trim(),
            Count = request.Count,
            SowingDate = request.SowingDate,
            PlantingDate = request.PlantingDate,
            ExpectedHarvest = EstimateHarvest(plant, request.SowingDate, request.PlantingDate),
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim()
        };
    }

    // Tage bis Ernte zählen ab Auspflanzen (vorgezogene Kulturen) bzw. ab Aussaat (Direktsaat).
    // Ist nur ein Aussaatdatum bekannt und die Pflanze wird üblicherweise nur vorgezogen,
    // kommt die Voranzuchtzeit dazu.
    public static DateOnly? EstimateHarvest(Plant plant, DateOnly? sowingDate, DateOnly? plantingDate)
    {
        if (plant.DaysToHarvest is not { } days) return null;
        if (plantingDate is { } planted) return planted.AddDays(days);
        if (sowingDate is not { } sown) return null;

        var onlyPreCultivated = plant.PreCultivationFrom is not null && plant.DirectSowingFrom is null;
        var preCultivationDays = onlyPreCultivated ? (plant.PreCultivationWeeks ?? 0) * 7 : 0;
        return sown.AddDays(preCultivationDays + days);
    }
}
