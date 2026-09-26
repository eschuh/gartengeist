using Gartengeist.Api.Models.Entities;
using Gartengeist.Api.Repositories.Interfaces;
using Gartengeist.Api.Services.Interfaces;

namespace Gartengeist.Api.Services;

public class PlantService(IPlantRepository plantRepository) : IPlantService
{
    public Task<IEnumerable<Plant>> GetAllAsync() =>
        plantRepository.GetAllAsync();

    public Task<Plant?> GetByIdAsync(Guid id) =>
        plantRepository.GetByIdAsync(id);
}
