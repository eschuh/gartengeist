using Gartengeist.Api.Models.DTOs;
using Gartengeist.Api.Models.Entities;
using Gartengeist.Api.Repositories.Interfaces;
using Gartengeist.Api.Services.Interfaces;

namespace Gartengeist.Api.Services;

public class GardenService(IGardenRepository gardenRepository) : IGardenService
{
    public Task<Garden?> GetAsync() =>
        gardenRepository.GetAsync();

    public Task<Garden> SaveAsync(GardenRequest request) =>
        gardenRepository.SaveAsync(new Garden
        {
            LocationName = request.LocationName.Trim(),
            PostalCode = string.IsNullOrWhiteSpace(request.PostalCode) ? null : request.PostalCode.Trim(),
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            HouseholdSize = request.HouseholdSize
        });
}
