using System.Globalization;
using System.Text.Json.Serialization;
using Gartengeist.Api.Models.DTOs;

namespace Gartengeist.Api.Services;

// Ortssuche über Nominatim (OpenStreetMap). Nutzungsrichtlinie: max. 1 Anfrage/Sekunde,
// daher sucht das Frontend nur auf Knopfdruck, nicht bei jedem Tastendruck.
public class GeocodingService(IHttpClientFactory httpClientFactory)
{
    private const string CountryCodes = "de,at,ch";

    public async Task<IReadOnlyList<PlaceResult>> SearchAsync(string query)
    {
        query = query.Trim();
        if (query.Length < 2) return [];

        var isPostalCode = query.All(char.IsDigit);
        var parameters = isPostalCode
            ? $"postalcode={Uri.EscapeDataString(query)}"
            : $"q={Uri.EscapeDataString(query)}&featureType=settlement";

        var client = httpClientFactory.CreateClient("nominatim");
        var results = await client.GetFromJsonAsync<List<NominatimResult>>(
            $"search?{parameters}&countrycodes={CountryCodes}&format=jsonv2&addressdetails=1&limit=5&accept-language=de");

        return (results ?? [])
            .Select(ToPlace)
            .Where(p => p is not null)
            .Select(p => p!)
            .ToList();
    }

    private static PlaceResult? ToPlace(NominatimResult result)
    {
        if (!decimal.TryParse(result.Lat, NumberStyles.Float, CultureInfo.InvariantCulture, out var lat) ||
            !decimal.TryParse(result.Lon, NumberStyles.Float, CultureInfo.InvariantCulture, out var lon))
            return null;

        var address = result.Address;
        var name = address?.City ?? address?.Town ?? address?.Village ?? address?.Municipality ?? result.Name;
        if (string.IsNullOrWhiteSpace(name)) return null;

        return new PlaceResult(
            name,
            result.DisplayName,
            address?.Postcode,
            Math.Round(lat, 6),
            Math.Round(lon, 6));
    }

    private sealed record NominatimResult(
        [property: JsonPropertyName("lat")] string Lat,
        [property: JsonPropertyName("lon")] string Lon,
        [property: JsonPropertyName("name")] string? Name,
        [property: JsonPropertyName("display_name")] string DisplayName,
        [property: JsonPropertyName("address")] NominatimAddress? Address);

    private sealed record NominatimAddress(
        [property: JsonPropertyName("city")] string? City,
        [property: JsonPropertyName("town")] string? Town,
        [property: JsonPropertyName("village")] string? Village,
        [property: JsonPropertyName("municipality")] string? Municipality,
        [property: JsonPropertyName("postcode")] string? Postcode);
}
