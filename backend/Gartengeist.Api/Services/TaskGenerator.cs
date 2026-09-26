using Gartengeist.Api.Models.DTOs;
using Gartengeist.Api.Models.Entities;
using Gartengeist.Api.Repositories.Interfaces;

namespace Gartengeist.Api.Services;

// Erzeugt automatische Aufgaben (idempotent über den Schlüssel):
// - Voranzucht-Erinnerungen für Pflanzen, die ihr im laufenden oder letzten Jahr angebaut habt
// - Wintervorbereitung im Herbst, abgestimmt auf den typischen ersten Frost
public class TaskGenerator(
    ITaskRepository taskRepository,
    IGardenRepository gardenRepository,
    IPlantingRepository plantingRepository,
    IAreaRepository areaRepository,
    ILogger<TaskGenerator> logger)
{
    // So viele Tage vor dem Termin erscheint die Aufgabe in der Liste
    private const int PreCultivationLeadDays = 21;
    private const int WinterLeadDays = 45;

    public async Task<IReadOnlyList<PreCultivationPlan>> GetPreCultivationPlanAsync(DateOnly today)
    {
        var garden = await gardenRepository.GetAsync();
        if (garden?.LastFrostSafe is null || garden.LastFrostMedian is null) return [];

        var plantings = await plantingRepository.GetAllAsync(areaId: null, includeEnded: true);
        var plants = plantings
            .Where(p => (p.PlantingDate ?? p.SowingDate ?? DateOnly.FromDateTime(p.CreatedAt.Date)).Year >= today.Year - 1)
            .Select(p => p.Plant)
            .Where(p => p is { PreCultivationFrom: not null, PreCultivationTo: not null, PreCultivationWeeks: not null })
            .DistinctBy(p => p.Id)
            .ToList();

        var plans = new List<(Plant Plant, int Year, DateOnly Sow, DateOnly PlantOut)>();
        foreach (var plant in plants)
        {
            var plan = Plan(garden, plant, today.Year);
            // Diese Saison schon vorbei → nächstes Jahr
            if (plan is { } p && p.Sow < today.AddDays(-14)) plan = Plan(garden, plant, today.Year + 1);
            if (plan is { } result) plans.Add((plant, result.Sow.Year, result.Sow, result.PlantOut));
        }

        var existingKeys = await taskRepository.GetExistingKeysAsync(plans.Select(p => PreCultivationKey(p.Year, p.Plant)));
        return plans
            .OrderBy(p => p.Sow)
            .Select(p => new PreCultivationPlan(
                p.Plant.Id, p.Plant.Name, p.Sow, p.PlantOut, p.Plant.PreCultivationWeeks!.Value,
                existingKeys.Contains(PreCultivationKey(p.Year, p.Plant))))
            .ToList();
    }

    public async Task GenerateAsync(DateOnly today)
    {
        var garden = await gardenRepository.GetAsync();
        if (garden is null) return;

        var candidates = new List<GardenTask>();
        candidates.AddRange(await PreCultivationTasksAsync(garden, today));
        candidates.AddRange(await WinterTasksAsync(garden, today));

        var existing = await taskRepository.GetExistingKeysAsync(candidates.Select(t => t.Key!));
        var created = candidates.Where(t => !existing.Contains(t.Key!)).DistinctBy(t => t.Key).ToList();
        if (created.Count == 0) return;

        await taskRepository.CreateManyAsync(created);
        logger.LogInformation("{Count} automatische Aufgaben angelegt: {Titles}", created.Count, string.Join(", ", created.Select(t => t.Title)));
    }

    private async Task<IEnumerable<GardenTask>> PreCultivationTasksAsync(Garden garden, DateOnly today)
    {
        var plans = await GetPreCultivationPlanAsync(today);
        var lastSafe = FrostDateService.InYear(garden.LastFrostSafe, today.Year);
        var lastMedian = FrostDateService.InYear(garden.LastFrostMedian, today.Year);

        return plans
            .Where(p => !p.TaskCreated && p.SowDate.AddDays(-PreCultivationLeadDays) <= today)
            .Select(p => new GardenTask
            {
                Title = $"{p.PlantName} vorziehen",
                Description =
                    $"Im Haus aussäen, ca. {p.Weeks} Wochen vor dem Auspflanzen. Auspflanzen ab ca. {p.PlantOutDate:d.M.} " +
                    (p.PlantOutDate > (lastMedian ?? p.PlantOutDate)
                        ? $"– nach der Frostgrenze (in 8 von 10 Jahren kein Frost mehr nach dem {lastSafe:d.M.}); im Gewächshaus früher möglich."
                        : $"– verträgt leichten Frost, daher ab dem typischen letzten Frost (um den {lastMedian:d.M.})."),
                DueDate = p.SowDate,
                Category = "voranzucht",
                Source = "automatisch",
                Key = $"voranzucht:{p.SowDate.Year}:{p.PlantId}",
                PlantId = p.PlantId
            });
    }

    private async Task<IEnumerable<GardenTask>> WinterTasksAsync(Garden garden, DateOnly today)
    {
        if (today.Month < 8) return [];

        var year = today.Year;
        var firstFrost = FrostDateService.InYear(garden.FirstFrostEarly, year) ?? new DateOnly(year, 10, 25);
        var beforeFrost = firstFrost.AddDays(-7);
        var areas = (await areaRepository.GetAllAsync()).ToList();
        var activePlantings = (await plantingRepository.GetAllAsync(areaId: null, includeEnded: false)).ToList();

        var tasks = new List<GardenTask>();
        void Add(string key, string title, string description, DateOnly due, Guid? areaId = null, Guid? plantingId = null, Guid? plantId = null) =>
            tasks.Add(new GardenTask
            {
                Title = title,
                Description = description,
                DueDate = due,
                Category = "winter",
                Source = "automatisch",
                Key = $"winter:{year}:{key}",
                AreaId = areaId,
                PlantingId = plantingId,
                PlantId = plantId
            });

        foreach (var planting in activePlantings.Where(p => p.Plant is { FrostSensitive: true, Perennial: false }))
        {
            var tip = planting.Plant.Key == "tomate"
                ? " Grüne Tomaten reifen im Haus bei Zimmertemperatur nach."
                : string.Empty;
            Add($"ernte:{planting.Id}", $"{planting.Plant.Name} fertig abernten ({planting.Area.Name})",
                $"Frostempfindlich: vor dem ersten Frost (frühestens um den {firstFrost:d.M.}) alles ernten, dann die Pflanzen entfernen. " +
                $"Gesunde Reste auf den Kompost, kranke (z.B. Krautfäule) in den Hausmüll.{tip}",
                beforeFrost, planting.AreaId, planting.Id, planting.PlantId);
        }

        foreach (var planting in activePlantings.Where(p => p.Plant is { FrostSensitive: true, Perennial: true }))
        {
            Add($"schutz:{planting.Id}", $"{planting.Plant.Name} vor Frost schützen ({planting.Area.Name})",
                "Nur bedingt winterhart: im Topf hell und kühl überwintern oder am Platz mit Vlies und Laub schützen.",
                beforeFrost, planting.AreaId, planting.Id, planting.PlantId);
        }

        Add("wasser", "Wasser winterfest machen",
            "Regentonnen leeren, Schläuche einräumen, Außenhähne und Leitungen entleeren – bevor der erste Frost kommt.",
            beforeFrost);

        Add("mulch", "Beete für den Winter abdecken",
            "Abgeerntete Beete nicht nackt lassen: mit Laub, Stroh oder Grasschnitt mulchen. " +
            "Nicht umgraben – so bleibt das Bodenleben intakt und der Boden ist im Frühjahr locker.",
            new DateOnly(year, 10, 20));

        Add("kompost", "Kompost umsetzen und abdecken",
            "Reifen Kompost absieben und auf die Beete verteilen, den Rest umsetzen und gegen Auswaschung abdecken.",
            new DateOnly(year, 11, 1));

        foreach (var area in areas.Where(a => a.Type is AreaType.Gewaechshaus or AreaType.Tomatenhaus))
        {
            Add($"reinigen:{area.Id}", $"{area.Name} ausräumen und reinigen",
                "Pflanzenreste vollständig entfernen (Pilzsporen, z.B. Kraut- und Braunfäule), Scheiben und Gestell reinigen, " +
                "Boden mit Kompost versorgen. Feldsalat oder Winterportulak können als Winterkultur hinein.",
                new DateOnly(year, 11, 15), area.Id);
        }

        if (areas.FirstOrDefault(a => a.Type == AreaType.Naturnah) is { } natural)
        {
            Add("naturnah", $"{natural.Name} über den Winter stehen lassen",
                "Nicht aufräumen: hohle Stängel, Samenstände und Laubhaufen sind Winterquartier für Wildbienen, " +
                "Marienkäfer und Igel. Erst im Frühling zurückschneiden.",
                new DateOnly(year, 10, 15), natural.Id);
        }

        Add("werkzeug", "Werkzeug reinigen und pflegen",
            "Werkzeug reinigen, Klingen schärfen, Holzstiele ölen und trocken lagern.",
            new DateOnly(year, 11, 30));

        Add("saatgut", "Saatgut-Inventur",
            "Saatgutvorrat durchsehen: Keimfähigkeit prüfen, Abgelaufenes aussortieren, Fehlendes für nächstes Jahr auf die Einkaufsliste setzen.",
            new DateOnly(year, 12, 10));

        // Nur was bald ansteht und nicht schon lange vorbei ist
        return tasks.Where(t => t.DueDate.AddDays(-WinterLeadDays) <= today && t.DueDate >= today.AddDays(-7));
    }

    // Auspflanzen: frostempfindliche Pflanzen eine Woche nach der sicheren Frostgrenze,
    // robuste ab dem typischen letzten Frost. Aussaat = Auspflanzen minus Voranzuchtzeit, begrenzt auf das Voranzucht-Fenster.
    private static (DateOnly Sow, DateOnly PlantOut)? Plan(Garden garden, Plant plant, int year)
    {
        var lastSafe = FrostDateService.InYear(garden.LastFrostSafe, year);
        var lastMedian = FrostDateService.InYear(garden.LastFrostMedian, year);
        if (lastSafe is null || lastMedian is null) return null;

        var weeks = plant.PreCultivationWeeks!.Value;
        var plantOut = plant.FrostSensitive ? lastSafe.Value.AddDays(7) : lastMedian.Value;
        var sow = plantOut.AddDays(-weeks * 7);

        var from = plant.PreCultivationFrom!.Value;
        var to = plant.PreCultivationTo!.Value;
        if (from <= to)
        {
            var windowStart = new DateOnly(year, from, 1);
            var windowEnd = new DateOnly(year, to, DateTime.DaysInMonth(year, to));
            if (sow < windowStart) sow = windowStart;
            if (sow > windowEnd) sow = windowEnd;
            plantOut = sow.AddDays(weeks * 7);
        }

        return (sow, plantOut);
    }

    private static string PreCultivationKey(int year, Plant plant) => $"voranzucht:{year}:{plant.Id}";
}
