using Gartengeist.Api.Data;
using Gartengeist.Api.Models.Entities;
using Gartengeist.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Gartengeist.Api.Repositories;

public class PlantRepository(GartengeistDbContext db) : IPlantRepository
{
    public async Task<IEnumerable<Plant>> GetAllAsync() =>
        await db.Plants.OrderBy(p => p.Name).ToListAsync();

    public async Task<Plant?> GetByIdAsync(Guid id) =>
        await db.Plants.FirstOrDefaultAsync(p => p.Id == id);
}
