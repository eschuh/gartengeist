using Gartengeist.Api.Models.DTOs;
using Gartengeist.Api.Models.Entities;
using Gartengeist.Api.Repositories.Interfaces;
using Gartengeist.Api.Services.Interfaces;

namespace Gartengeist.Api.Services;

public class PlantingService(
    IPlantingRepository plantingRepository,
    IPlantRepository plantRepository,
    IAreaRepository areaRepository,
    IJournalRepository journalRepository,
    ITaskRepository taskRepository) : IPlantingService
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

    // Abräumen – ganz oder nur ein Teil der Pflanzen. Beim Teil-Abräumen wird die Kultur aufgeteilt:
    // der abgeräumte Teil wird als beendete Kultur gespeichert (Verlauf/Fruchtfolge), der Rest bleibt stehen.
    public async Task<EndPlantingResult?> EndAsync(Guid id, DateOnly? endedOn, int? count, Guid userId)
    {
        var planting = await plantingRepository.GetByIdAsync(id);
        if (planting is null) return null;
        if (planting.EndedOn is not null) throw new ArgumentException("Diese Kultur ist bereits abgeräumt.");

        var date = endedOn ?? DateOnly.FromDateTime(DateTime.Today);
        // Vor dem Aufteilen merken – das Repository ändert dieselbe (getrackte) Instanz
        var totalBefore = planting.Count;
        var partial = count is { } c && planting.Count is { } total && c < total;
        if (count is not null && planting.Count is null)
            throw new ArgumentException("Für teilweises Abräumen bitte zuerst die Anzahl der Pflanzen eintragen.");

        var ended = partial
            ? await plantingRepository.SplitEndAsync(id, count!.Value, date)
            : await plantingRepository.EndAsync(id, date);
        var remaining = partial ? await plantingRepository.GetByIdAsync(id) : null;
        if (!partial) await taskRepository.CompleteOpenForPlantingAsync(id, userId);

        await journalRepository.CreateAsync(new JournalEntry
        {
            Date = date,
            Type = JournalEntryType.Abgeraeumt,
            AreaId = planting.AreaId,
            PlantingId = ended!.Id,
            UserId = userId,
            Text = partial ? $"{count} von {totalBefore} Pflanzen" : null
        });

        var areaFree = !(await plantingRepository.GetAllAsync(planting.AreaId, includeEnded: false)).Any();
        return new EndPlantingResult(ended, remaining, areaFree);
    }

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
