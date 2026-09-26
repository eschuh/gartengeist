using Gartengeist.Api.Models.DTOs;
using Gartengeist.Api.Models.Entities;

namespace Gartengeist.Api.Services.Interfaces;

public interface IAreaService
{
    Task<IEnumerable<Area>> GetAllAsync(bool includeArchived = false);
    Task<Area?> GetByIdAsync(Guid id);
    Task<Area> CreateAsync(AreaRequest request);
    Task<Area?> UpdateAsync(Guid id, AreaRequest request);
    Task<Area?> ArchiveAsync(Guid id);
    Task<Area?> ReactivateAsync(Guid id);
}
