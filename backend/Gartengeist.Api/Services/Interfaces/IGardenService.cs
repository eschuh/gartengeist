using Gartengeist.Api.Models.DTOs;
using Gartengeist.Api.Models.Entities;

namespace Gartengeist.Api.Services.Interfaces;

public interface IGardenService
{
    Task<Garden?> GetAsync();
    Task<Garden> SaveAsync(GardenRequest request);
}
