using Gartengeist.Api.Models.Entities;

namespace Gartengeist.Api.Repositories.Interfaces;

public interface ITaskRepository
{
    // Offene Aufgaben (ohne Zeitraum) oder alle im Zeitraum; verworfene nie
    Task<IEnumerable<GardenTask>> GetAllAsync(bool? done, DateOnly? from, DateOnly? to, DateTimeOffset? doneSince);
    Task<GardenTask?> GetByIdAsync(Guid id);
    Task<HashSet<string>> GetExistingKeysAsync(IEnumerable<string> keys);
    Task<GardenTask> CreateAsync(GardenTask task);
    Task CreateManyAsync(IEnumerable<GardenTask> tasks);
    Task<GardenTask?> UpdateAsync(GardenTask task);
    Task<GardenTask?> CompleteAsync(Guid id, Guid userId, GardenTask? next);
    Task<GardenTask?> ReopenAsync(Guid id);
    Task<bool> DeleteOrDismissAsync(Guid id);
    Task CompleteOpenForPlantingAsync(Guid plantingId, Guid userId);
}
