using System.ComponentModel.DataAnnotations;

namespace Gartengeist.Api.Models.DTOs;

public record GardenRequest(
    [Required, MaxLength(200)] string LocationName,
    [MaxLength(10)] string? PostalCode,
    [Range(-90, 90)] decimal Latitude,
    [Range(-180, 180)] decimal Longitude,
    [Range(1, 20)] int HouseholdSize
);

public record GardenResponse(
    string LocationName,
    string? PostalCode,
    decimal Latitude,
    decimal Longitude,
    int HouseholdSize
);

public record PlaceResult(
    string Name,
    string Description,
    string? PostalCode,
    decimal Latitude,
    decimal Longitude
);
