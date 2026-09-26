using Gartengeist.Api.Models.Entities;

namespace Gartengeist.Api.Repositories.Interfaces;

public interface IGardenRepository
{
    Task<Garden?> GetAsync();
    Task<Garden> SaveAsync(Garden garden);
}
