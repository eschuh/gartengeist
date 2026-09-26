using Gartengeist.Api.Models.Entities;

namespace Gartengeist.Api.Repositories.Interfaces;

public interface IAreaRepository
{
    Task<IEnumerable<Area>> GetAllAsync(bool includeArchived = false);
    Task<Area?> GetByIdAsync(Guid id);
    Task<Area> CreateAsync(Area area);
    Task<Area?> UpdateAsync(Area area);
    Task<Area?> ArchiveAsync(Guid id);
    Task<Area?> ReactivateAsync(Guid id);
}
