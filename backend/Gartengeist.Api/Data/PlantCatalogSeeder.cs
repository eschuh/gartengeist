using System.Text.Json;
using Gartengeist.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Gartengeist.Api.Data;

// Gleicht den Katalog beim Start mit Data/Seed/pflanzen.json ab: neue Einträge anlegen, bestehende aktualisieren.
// Mischkultur-Verweise dürfen "kategorie:<name>" enthalten und werden zu den Schlüsseln der Kategorie aufgelöst.
public static class PlantCatalogSeeder
{
    private const string CategoryPrefix = "kategorie:";

    public static async Task SeedAsync(GartengeistDbContext db, ILogger logger)
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Data", "Seed", "pflanzen.json");
        await using var stream = File.OpenRead(path);
        var seeds = await JsonSerializer.DeserializeAsync<List<SeedPlant>>(stream, JsonSerializerOptions.Web)
            ?? throw new InvalidOperationException("pflanzen.json ist leer.");

        var keys = seeds.Select(s => s.Schluessel).ToHashSet();
        var keysByCategory = seeds
            .GroupBy(s => s.Kategorie)
            .ToDictionary(g => g.Key, g => g.Select(s => s.Schluessel).ToList());

        string[] Resolve(SeedPlant seed, IEnumerable<string> references) => references
            .SelectMany(r => r.StartsWith(CategoryPrefix)
                ? keysByCategory.GetValueOrDefault(r[CategoryPrefix.Length..]) ?? []
                : new List<string> { r })
            .Where(k => k != seed.Schluessel)
            .Distinct()
            .ToArray();

        var existing = await db.Plants.ToDictionaryAsync(p => p.Key);
        var now = DateTimeOffset.UtcNow;

        foreach (var seed in seeds)
        {
            var good = Resolve(seed, seed.Gut);
            var bad = Resolve(seed, seed.Schlecht);
            foreach (var unknown in good.Concat(bad).Where(k => !keys.Contains(k)))
                logger.LogWarning("Pflanzen-Katalog: {Plant} verweist auf unbekannten Schlüssel {Key}", seed.Schluessel, unknown);

            if (!existing.TryGetValue(seed.Schluessel, out var plant))
            {
                plant = new Plant { Id = Guid.NewGuid(), Key = seed.Schluessel, CreatedAt = now };
                db.Plants.Add(plant);
            }

            plant.Name = seed.Name;
            plant.LatinName = seed.Lateinisch;
            plant.Family = seed.Familie;
            plant.Category = seed.Kategorie;
            (plant.PreCultivationFrom, plant.PreCultivationTo) = Window(seed.Voranzucht);
            (plant.DirectSowingFrom, plant.DirectSowingTo) = Window(seed.Direktsaat);
            (plant.PlantingOutFrom, plant.PlantingOutTo) = Window(seed.Auspflanzen);
            (plant.HarvestFrom, plant.HarvestTo) = Window(seed.Ernte);
            plant.PreCultivationWeeks = seed.VoranzuchtWochen;
            plant.DaysToHarvest = seed.TageBisErnte;
            plant.PlantSpacingCm = seed.PflanzabstandCm;
            plant.RowSpacingCm = seed.ReihenabstandCm;
            plant.NutrientDemand = seed.Naehrstoffbedarf;
            plant.WaterDemand = seed.Wasserbedarf;
            plant.FrostSensitive = seed.Frostempfindlich;
            plant.Perennial = seed.Mehrjaehrig;
            plant.GoodCompanions = good;
            plant.BadCompanions = bad;
            plant.Note = seed.Hinweis;
            plant.UpdatedAt = now;
        }

        await db.SaveChangesAsync();
        logger.LogInformation("Pflanzen-Katalog abgeglichen: {Count} Einträge", seeds.Count);
    }

    private static (int?, int?) Window(int[]? months) =>
        months is [var from, var to] ? (from, to) : (null, null);

    private sealed record SeedPlant(
        string Schluessel,
        string Name,
        string? Lateinisch,
        string Familie,
        string Kategorie,
        int[]? Voranzucht,
        int[]? Direktsaat,
        int[]? Auspflanzen,
        int[]? Ernte,
        int? VoranzuchtWochen,
        int? TageBisErnte,
        int? PflanzabstandCm,
        int? ReihenabstandCm,
        string Naehrstoffbedarf,
        string Wasserbedarf,
        bool Frostempfindlich,
        bool Mehrjaehrig,
        string[] Gut,
        string[] Schlecht,
        string? Hinweis);
}
