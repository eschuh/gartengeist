using Gartengeist.Api.Models.DTOs;
using Gartengeist.Api.Models.Entities;

namespace Gartengeist.Api.Services.Interfaces;

public interface ITaskService
{
    Task<IEnumerable<GardenTask>> GetOpenAsync();
    Task<IEnumerable<GardenTask>> GetRecentlyDoneAsync(int days);
    Task<IEnumerable<GardenTask>> GetInRangeAsync(DateOnly from, DateOnly to);
    Task<GardenTask?> GetByIdAsync(Guid id);
    Task<GardenTask> CreateAsync(TaskRequest request, Guid userId);
    Task<GardenTask?> UpdateAsync(Guid id, TaskRequest request);
    Task<GardenTask?> CompleteAsync(Guid id, Guid userId);
    Task<GardenTask?> ReopenAsync(Guid id);
    Task<bool> DeleteAsync(Guid id);
}
