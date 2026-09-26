using Gartengeist.Api.Models.DTOs;
using Gartengeist.Api.Models.Entities;
using Gartengeist.Api.Repositories.Interfaces;
using Gartengeist.Api.Services.Interfaces;

namespace Gartengeist.Api.Services;

// Gießprotokoll: Wann wurde zuletzt gegossen (oder hat es ausreichend geregnet) – und ist es wieder Zeit?
// Faustregeln: Gewächshaus/Tomatenhaus alle 2 Tage, Freiland alle 4 Tage; bei Hitze einen Tag früher.
// Regen ab 5 mm zählt im Freiland wie Gießen. Nur April–Oktober und nur Flächen mit laufenden Kulturen.
public class WateringService(
    IAreaRepository areaRepository,
    IPlantingRepository plantingRepository,
    IJournalRepository journalRepository,
    IWeatherService weatherService,
    ILogger<WateringService> logger)
{
    private const decimal RainCountsAsWateringMm = 5;
    private const decimal HotDayTempMax = 27;

    public async Task<IReadOnlyList<WateringStatus>> GetStatusAsync(DateOnly today)
    {
        if (today.Month is < 4 or > 10) return [];

        var areas = (await areaRepository.GetAllAsync()).Where(a => a.Type != AreaType.Naturnah).ToList();
        var plantedAreaIds = (await plantingRepository.GetAllAsync(areaId: null, includeEnded: false))
            .Select(p => p.AreaId).ToHashSet();
        var watered = await journalRepository.GetAllAsync(new JournalFilter(
            From: today.AddDays(-30), Type: JournalEntryType.Gegossen, Limit: 1000));
        var lastWateredByArea = watered
            .Where(e => e.AreaId is not null)
            .GroupBy(e => e.AreaId!.Value)
            .ToDictionary(g => g.Key, g => g.MaxBy(e => e.Date)!);

        IReadOnlyList<WeatherDay> days = [];
        try
        {
            days = (await weatherService.GetForecastAsync())?.Days ?? [];
        }
        catch (HttpRequestException ex)
        {
            logger.LogWarning(ex, "Wetter für Gießprotokoll nicht verfügbar");
        }

        var lastRain = days
            .Where(d => d.Date < today && d.PrecipitationMm >= RainCountsAsWateringMm)
            .Select(d => (DateOnly?)d.Date)
            .Max();
        var recentMax = days.Where(d => d.Date > today.AddDays(-3) && d.Date <= today && d.TempMax is not null).ToList();
        var hot = recentMax.Count > 0 && recentMax.Average(d => d.TempMax!.Value) >= HotDayTempMax;

        var result = new List<WateringStatus>();
        foreach (var area in areas.Where(a => plantedAreaIds.Contains(a.Id)))
        {
            var covered = area.Type is AreaType.Gewaechshaus or AreaType.Tomatenhaus;
            var threshold = (covered ? 2 : 4) - (hot ? 1 : 0);

            lastWateredByArea.TryGetValue(area.Id, out var lastEntry);
            var areaRain = covered ? null : lastRain;
            var effective = new[] { lastEntry?.Date, areaRain }.Max();
            int? daysSince = effective is { } e ? today.DayNumber - e.DayNumber : null;
            var due = daysSince is null || daysSince >= threshold;

            var reasons = new List<string>();
            if (effective is null) reasons.Add("in den letzten Tagen weder gegossen noch Regen");
            else if (areaRain is not null && areaRain == effective && areaRain > lastEntry?.Date)
                reasons.Add($"zuletzt Regen am {areaRain:d.M.}");
            else reasons.Add(daysSince == 0 ? "heute gegossen" : $"zuletzt gegossen vor {daysSince} {(daysSince == 1 ? "Tag" : "Tagen")}");
            reasons.Add(covered ? $"unter Dach alle {threshold} Tage" : $"im Freiland alle {threshold} Tage");
            if (hot) reasons.Add("heiß");

            result.Add(new WateringStatus(
                area.Id, area.Name, area.Type.ToString().ToLowerInvariant(),
                lastEntry?.Date, lastEntry?.User.Name, areaRain, daysSince, threshold, due,
                string.Join(" · ", reasons)));
        }

        return result.OrderByDescending(s => s.Due).ThenByDescending(s => s.DaysSince ?? int.MaxValue).ToList();
    }
}
