using Gartengeist.Api.Models.Entities;

namespace Gartengeist.Api.Repositories.Interfaces;

public interface IPlantingRepository
{
    Task<IEnumerable<Planting>> GetAllAsync(Guid? areaId, bool includeEnded);
    Task<Planting?> GetByIdAsync(Guid id);
    Task<Planting> CreateAsync(Planting planting);
    Task<Planting?> UpdateAsync(Planting planting);
    Task<Planting?> EndAsync(Guid id, DateOnly endedOn);
    Task<bool> DeleteAsync(Guid id);
}
