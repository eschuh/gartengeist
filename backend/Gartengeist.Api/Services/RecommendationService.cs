using Gartengeist.Api.Models.DTOs;
using Gartengeist.Api.Models.Entities;
using Gartengeist.Api.Repositories.Interfaces;

namespace Gartengeist.Api.Services;

// Nachkultur-Empfehlungen für eine (frei gewordene) Fläche. Regeln:
// - passt jetzt oder in den nächsten 3 Wochen zum Säen bzw. Pflanzen
// - Ernte noch vor dem Frost (frostempfindlich) bzw. vor dem Winter; unter Dach etwas länger
// - Fruchtfolge: keine Pflanzenfamilie, die in den letzten 3 Jahren hier stand (außer im Tomatenhaus)
// - Nährstoffe: nach Starkzehrern lieber Mittel-/Schwachzehrer, nach Hülsenfrüchten gern Starkzehrer
// - keine schlechten Nachbarn zu dem, was noch auf der Fläche steht
public class RecommendationService(
    IAreaRepository areaRepository,
    IGardenRepository gardenRepository,
    IPlantRepository plantRepository,
    IPlantingRepository plantingRepository)
{
    private const int MaxItems = 8;
    private const int RotationYears = 3;
    private const int CoveredExtraDays = 30;
    private const int HardyExtraDays = 45;

    public async Task<AreaRecommendations?> GetForAreaAsync(Guid areaId, DateOnly today)
    {
        var area = await areaRepository.GetByIdAsync(areaId);
        if (area is null) return null;

        var garden = await gardenRepository.GetAsync();
        var plants = await plantRepository.GetAllAsync();
        var history = (await plantingRepository.GetAllAsync(areaId, includeEnded: true)).ToList();
        var active = history.Where(p => p.EndedOn is null).ToList();
        var covered = area.Type is AreaType.Gewaechshaus or AreaType.Tomatenhaus;

        // Saisonende: frostempfindliche Kulturen bis zum frühen ersten Frost, robuste gut einen Monat länger
        var firstFrost = FrostDateService.InYear(garden?.FirstFrostEarly, today.Year) ?? new DateOnly(today.Year, 10, 25);
        var firstFrostMedian = FrostDateService.InYear(garden?.FirstFrostMedian, today.Year) ?? firstFrost;
        var sensitiveEnd = firstFrost.AddDays(covered ? CoveredExtraDays : 0);
        var hardyEnd = firstFrostMedian.AddDays(HardyExtraDays + (covered ? CoveredExtraDays : 0));

        var rotationFamilies = history
            .Where(p => !p.Plant.Perennial)
            .Where(p =>
            {
                var year = (p.PlantingDate ?? p.SowingDate ?? DateOnly.FromDateTime(p.CreatedAt.Date)).Year;
                var isPreviousCrop = p.EndedOn is not null || year < today.Year;
                return isPreviousCrop && year >= today.Year - RotationYears;
            })
            .Select(p => p.Plant.Family)
            .ToHashSet();

        var previous = history.Where(p => p.EndedOn is not null).MaxBy(p => p.EndedOn);
        var months = new[] { today.Month, today.AddDays(21).Month }.Distinct().ToArray();

        var items = new List<NextCropRecommendation>();
        foreach (var plant in plants.Where(p => !p.Perennial))
        {
            string action;
            if (months.Any(m => InWindow(m, plant.DirectSowingFrom, plant.DirectSowingTo))) action = "säen";
            else if (months.Any(m => InWindow(m, plant.PlantingOutFrom, plant.PlantingOutTo))) action = "pflanzen";
            else continue;

            if (area.Type != AreaType.Tomatenhaus && rotationFamilies.Contains(plant.Family)) continue;
            if (active.Any(a => IsBadNeighbor(plant, a.Plant))) continue;

            DateOnly? harvestFrom = plant.DaysToHarvest is { } days ? today.AddDays(days) : null;
            // Robuste Kulturen dürfen überwintern, wenn die Ernte in ihre normale Erntezeit fällt (Feldsalat, Knoblauch)
            var overwinters = harvestFrom is { } hv && !plant.FrostSensitive && hv > hardyEnd
                && InWindow(hv.Month, plant.HarvestFrom, plant.HarvestTo);
            if (harvestFrom is { } harvest)
            {
                var fits = plant.FrostSensitive ? harvest <= sensitiveEnd : harvest <= hardyEnd || overwinters;
                if (!fits) continue;
            }

            var score = 0;
            var reasons = new List<string>
            {
                action == "säen" ? "jetzt direkt säen"
                : plant.Category == "zwiebelgemuese" ? "jetzt stecken"
                : "jetzt Jungpflanzen setzen"
            };
            if (harvestFrom is { } h && plant.Key != "phacelia")
                reasons.Add($"{(plant.Category == "blumen" ? "Blüte" : "Ernte")} ab ca. {h:d.M.}");

            if (previous is not null && previous.Plant.Id != plant.Id)
            {
                var prev = previous.Plant;
                if (prev.Family == "Hülsenfrüchtler" && plant.NutrientDemand == "stark")
                {
                    score += 2;
                    reasons.Add($"nutzt den Stickstoff, den {prev.Name} hinterlassen hat");
                }
                else if (prev.NutrientDemand == "stark" && plant.NutrientDemand != "stark")
                {
                    score += 2;
                    reasons.Add($"schont den Boden nach {prev.Name} (Starkzehrer)");
                }
                else if (prev.NutrientDemand == "stark" && plant.NutrientDemand == "stark")
                {
                    score -= 2;
                    reasons.Add("Starkzehrer nach Starkzehrer – vorher Kompost einarbeiten");
                }
            }

            var goodNeighbors = active
                .Where(a => IsGoodNeighbor(plant, a.Plant))
                .Select(a => a.Plant.Name)
                .Distinct()
                .ToList();
            if (goodNeighbors.Count > 0)
            {
                score += Math.Min(goodNeighbors.Count, 2);
                reasons.Add($"guter Nachbar für {string.Join(", ", goodNeighbors)}");
            }

            if (plant.Key == "phacelia" && today.Month >= 7)
            {
                score += 1;
                reasons.Add("Gründüngung: schützt und belebt den Boden bis zum Frühjahr");
            }
            else if (overwinters)
            {
                score += 1;
                reasons.Add("überwintert im Beet");
            }
            else if (today.Month >= 8 && !plant.FrostSensitive && plant.HarvestFrom > plant.HarvestTo)
            {
                score += 1;
                reasons.Add("wächst bis in den Winter");
            }

            items.Add(new NextCropRecommendation(plant.Id, plant.Name, action, harvestFrom, score, reasons));
        }

        var ordered = items
            .OrderByDescending(i => i.Score)
            .ThenBy(i => i.HarvestFrom ?? DateOnly.MaxValue)
            .Take(MaxItems)
            .ToList();

        string? hint = null;
        if (ordered.Count == 0)
        {
            hint = today.Month is >= 10 or <= 2
                ? "Für neue Kulturen ist es jetzt zu spät. Beet mit Laub oder Mulch abdecken – im Frühjahr geht es weiter."
                : "Gerade passt keine Kultur gut hierher. Mulch oder eine Gründüngung schützen den Boden bis zur nächsten Kultur.";
        }

        return new AreaRecommendations(
            AreaFree: active.Count == 0,
            FreeM2: EstimateFreeSpace(area, active),
            PreviousCrop: previous?.Plant.Name,
            Items: ordered,
            Hint: hint);
    }

    private static decimal? EstimateFreeSpace(Area area, List<Planting> active)
    {
        if (area.Width is not { } width || area.Length is not { } length) return null;
        decimal used = 0;
        foreach (var planting in active)
        {
            if (planting is not { Count: { } count, Plant: { PlantSpacingCm: { } spacing, RowSpacingCm: { } row } }) return null;
            used += count * spacing * row / 10000m;
        }
        return Math.Round(Math.Max(0, width * length - used), 1);
    }

    private static bool IsBadNeighbor(Plant a, Plant b) =>
        a.BadCompanions.Contains(b.Key) || b.BadCompanions.Contains(a.Key);

    private static bool IsGoodNeighbor(Plant a, Plant b) =>
        !IsBadNeighbor(a, b) && (a.GoodCompanions.Contains(b.Key) || b.GoodCompanions.Contains(a.Key));

    // Monatsfenster, von > bis bedeutet über den Jahreswechsel
    private static bool InWindow(int month, int? from, int? to) =>
        from is { } f && to is { } t && (f <= t ? month >= f && month <= t : month >= f || month <= t);
}
