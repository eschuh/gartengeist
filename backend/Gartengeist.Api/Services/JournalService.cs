using Gartengeist.Api.Models.DTOs;
using Gartengeist.Api.Models.Entities;
using Gartengeist.Api.Repositories.Interfaces;
using Gartengeist.Api.Services.Interfaces;

namespace Gartengeist.Api.Services;

public class JournalService(
    IJournalRepository journalRepository,
    IPlantingRepository plantingRepository,
    IAreaRepository areaRepository,
    IWeatherService weatherService,
    PhotoStorage photoStorage,
    ILogger<JournalService> logger) : IJournalService
{
    public const int MaxPhotosPerEntry = 5;

    public Task<IEnumerable<JournalEntry>> GetAllAsync(JournalFilter filter) =>
        journalRepository.GetAllAsync(filter);

    public Task<JournalEntry?> GetByIdAsync(Guid id) =>
        journalRepository.GetByIdAsync(id);

    public async Task<JournalEntry> CreateAsync(JournalEntryRequest request, Guid userId)
    {
        var entry = await ToEntityAsync(request);
        entry.UserId = userId;
        await ApplyWeatherAsync([entry]);
        return await journalRepository.CreateAsync(entry);
    }

    public async Task<IReadOnlyList<JournalEntry>> CreateQuickActionAsync(QuickActionRequest request, Guid userId)
    {
        var type = Enum.Parse<JournalEntryType>(request.Type, true);
        var date = request.Date ?? DateOnly.FromDateTime(DateTime.Today);

        var entries = new List<JournalEntry>();
        foreach (var areaId in request.AreaIds.Distinct())
        {
            _ = await areaRepository.GetByIdAsync(areaId) ?? throw new ArgumentException("Fläche nicht gefunden.");
            entries.Add(new JournalEntry { Date = date, Type = type, AreaId = areaId, UserId = userId });
        }

        await ApplyWeatherAsync(entries);
        return await journalRepository.CreateManyAsync(entries);
    }

    public async Task<JournalEntry?> UpdateAsync(Guid id, JournalEntryRequest request)
    {
        var entry = await ToEntityAsync(request);
        entry.Id = id;
        return await journalRepository.UpdateAsync(entry);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var deleted = await journalRepository.DeleteAsync(id);
        if (deleted is null) return false;
        foreach (var photo in deleted.Photos) photoStorage.Delete(photo.FileName);
        return true;
    }

    public async Task<JournalPhoto> AddPhotoAsync(Guid entryId, Stream content, string contentType)
    {
        if (await journalRepository.CountPhotosAsync(entryId) >= MaxPhotosPerEntry)
            throw new InvalidOperationException($"Höchstens {MaxPhotosPerEntry} Fotos pro Eintrag.");

        var fileName = await photoStorage.SaveAsync(content, contentType);
        try
        {
            return await journalRepository.AddPhotoAsync(entryId, fileName);
        }
        catch
        {
            photoStorage.Delete(fileName);
            throw;
        }
    }

    public async Task<bool> DeletePhotoAsync(Guid entryId, Guid photoId)
    {
        var photo = await journalRepository.DeletePhotoAsync(entryId, photoId);
        if (photo is null) return false;
        photoStorage.Delete(photo.FileName);
        return true;
    }

    public async Task<IReadOnlyList<HarvestSummaryItem>> GetHarvestSummaryAsync(int year)
    {
        var harvests = await journalRepository.GetAllAsync(new JournalFilter(
            From: new DateOnly(year, 1, 1),
            To: new DateOnly(year, 12, 31),
            Type: JournalEntryType.Geerntet,
            Limit: 10_000));

        return harvests
            .Where(e => e is { Planting: not null, Amount: not null, Unit: not null })
            .Select(e => (Entry: e, Unit: e.Unit == "g" ? "kg" : e.Unit!, Amount: e.Unit == "g" ? e.Amount!.Value / 1000 : e.Amount!.Value))
            .GroupBy(x => (x.Entry.PlantingId!.Value, x.Unit))
            .Select(g =>
            {
                var planting = g.First().Entry.Planting!;
                return new HarvestSummaryItem(
                    planting.Id,
                    planting.Plant.Name,
                    planting.Variety,
                    g.First().Entry.Area?.Name ?? string.Empty,
                    g.Key.Unit,
                    g.Sum(x => x.Amount),
                    g.Count(),
                    g.Max(x => x.Entry.Date));
            })
            .OrderBy(s => s.PlantName)
            .ThenBy(s => s.Variety)
            .ToList();
    }

    private async Task<JournalEntry> ToEntityAsync(JournalEntryRequest request)
    {
        var type = Enum.Parse<JournalEntryType>(request.Type, true);
        var areaId = request.AreaId;

        if (request.PlantingId is { } plantingId)
        {
            var planting = await plantingRepository.GetByIdAsync(plantingId)
                ?? throw new ArgumentException("Bepflanzung nicht gefunden.");
            // Die Fläche ergibt sich aus der Bepflanzung
            areaId = planting.AreaId;
        }
        else if (areaId is { } id)
        {
            _ = await areaRepository.GetByIdAsync(id) ?? throw new ArgumentException("Fläche nicht gefunden.");
        }

        if (type == JournalEntryType.Geerntet)
        {
            if (request.PlantingId is null)
                throw new ArgumentException("Für eine Ernte bitte die Kultur auswählen.");
            if (request.Amount is null || request.Unit is null)
                throw new ArgumentException("Für eine Ernte bitte Menge und Einheit angeben.");
        }

        var isHarvest = type == JournalEntryType.Geerntet;
        return new JournalEntry
        {
            Date = request.Date,
            Type = type,
            Text = string.IsNullOrWhiteSpace(request.Text) ? null : request.Text.Trim(),
            AreaId = areaId,
            PlantingId = request.PlantingId,
            Amount = isHarvest ? request.Amount : null,
            Unit = isHarvest ? request.Unit : null
        };
    }

    // Wetter vom Tag des Eintrags aus der (gecachten) Prognose. Fehler beim Wetter dürfen das Speichern nicht verhindern.
    private async Task ApplyWeatherAsync(IReadOnlyCollection<JournalEntry> entries)
    {
        try
        {
            var forecast = await weatherService.GetForecastAsync();
            if (forecast is null) return;
            foreach (var entry in entries)
            {
                var day = forecast.Days.FirstOrDefault(d => d.Date == entry.Date);
                if (day is null) continue;
                entry.WeatherTempMin = day.TempMin;
                entry.WeatherTempMax = day.TempMax;
                entry.WeatherPrecipitationMm = day.PrecipitationMm;
                entry.WeatherCode = day.WeatherCode;
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Wetter-Snapshot für Tagebucheintrag fehlgeschlagen");
        }
    }
}
