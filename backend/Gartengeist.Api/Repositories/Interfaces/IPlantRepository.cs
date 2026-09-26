using Gartengeist.Api.Models.Entities;

namespace Gartengeist.Api.Repositories.Interfaces;

public interface IPlantRepository
{
    Task<IEnumerable<Plant>> GetAllAsync();
    Task<Plant?> GetByIdAsync(Guid id);
}
