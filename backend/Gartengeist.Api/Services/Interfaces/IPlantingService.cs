using Gartengeist.Api.Models.DTOs;
using Gartengeist.Api.Models.Entities;

namespace Gartengeist.Api.Services.Interfaces;

public interface IPlantingService
{
    Task<IEnumerable<Planting>> GetAllAsync(Guid? areaId, bool includeEnded);
    Task<Planting?> GetByIdAsync(Guid id);
    Task<Planting> CreateAsync(PlantingRequest request, Guid userId);
    Task<Planting?> UpdateAsync(Guid id, PlantingRequest request);
    Task<Planting?> EndAsync(Guid id, DateOnly? endedOn);
    Task<bool> DeleteAsync(Guid id);
}
