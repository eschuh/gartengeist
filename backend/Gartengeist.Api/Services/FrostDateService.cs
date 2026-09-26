using Gartengeist.Api.Repositories.Interfaces;
using Gartengeist.Api.Services.Weather;

namespace Gartengeist.Api.Services;

// Berechnet typische Frostdaten für den Gartenstandort aus 10 Jahren Wetterhistorie:
// letzter Frost im Frühling (Jan–Jun) und erster im Herbst (Jul–Dez), jeweils Tagesminimum ≤ 0 °C in 2 m Höhe.
// Neben dem Median gibt es eine vorsichtige Planungsgrenze (8 von 10 Jahren).
public class FrostDateService(
    IGardenRepository gardenRepository,
    IWeatherProvider weatherProvider,
    ILogger<FrostDateService> logger)
{
    private const int Years = 10;
    private static readonly TimeSpan RecalculateAfter = TimeSpan.FromDays(180);

    public async Task EnsureAsync()
    {
        var garden = await gardenRepository.GetAsync();
        if (garden is null) return;
        if (garden.FrostCalculatedAt is { } calculated && DateTimeOffset.UtcNow - calculated < RecalculateAfter) return;

        try
        {
            var lastYear = DateTime.Today.Year - 1;
            var temperatures = await weatherProvider.GetHistoricalMinTemperaturesAsync(
                garden.Latitude, garden.Longitude,
                new DateOnly(lastYear - Years + 1, 1, 1), new DateOnly(lastYear, 12, 31));

            var lastSpringFrost = new List<DateOnly>();
            var firstAutumnFrost = new List<DateOnly>();
            foreach (var year in temperatures.GroupBy(t => t.Date.Year))
            {
                var frostDays = year.Where(t => t.TempMin <= 0).Select(t => t.Date).ToList();
                var spring = frostDays.Where(d => d.Month <= 6).ToList();
                var autumn = frostDays.Where(d => d.Month >= 7).ToList();
                if (spring.Count > 0) lastSpringFrost.Add(spring.Max());
                if (autumn.Count > 0) firstAutumnFrost.Add(autumn.Min());
            }

            // Auf „Tag im Jahr“ ohne Jahreszahl vergleichen
            static List<DateOnly> Normalize(List<DateOnly> dates) =>
                dates.Select(d => new DateOnly(2001, d.Month, d.Day)).Order().ToList();
            var last = Normalize(lastSpringFrost);
            var first = Normalize(firstAutumnFrost);

            await gardenRepository.SaveFrostDatesAsync(
                garden.Id,
                Format(Pick(last, 0.5)),
                Format(Pick(last, 0.8)),
                Format(Pick(first, 0.5)),
                Format(Pick(first, 0.2)));

            logger.LogInformation("Frostdaten berechnet: letzter Frost {Median} (sicher {Safe}), erster Frost {First} (früh {Early})",
                Format(Pick(last, 0.5)), Format(Pick(last, 0.8)), Format(Pick(first, 0.5)), Format(Pick(first, 0.2)));
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            logger.LogWarning(ex, "Frostdaten konnten nicht berechnet werden");
        }
    }

    // Einfaches Quantil über die sortierte Liste
    private static DateOnly? Pick(List<DateOnly> sorted, double quantile) =>
        sorted.Count == 0 ? null : sorted[(int)Math.Round((sorted.Count - 1) * quantile)];

    private static string? Format(DateOnly? date) => date?.ToString("MM-dd");

    // „MM-dd“ im gegebenen Jahr
    public static DateOnly? InYear(string? monthDay, int year) =>
        monthDay is { Length: 5 } && int.TryParse(monthDay[..2], out var m) && int.TryParse(monthDay[3..], out var d)
            ? new DateOnly(year, m, d)
            : null;
}
