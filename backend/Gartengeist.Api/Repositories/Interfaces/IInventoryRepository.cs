using Gartengeist.Api.Models.Entities;

namespace Gartengeist.Api.Repositories.Interfaces;

public interface IInventoryRepository
{
    Task<IEnumerable<InventoryItem>> GetAllAsync();
    Task<InventoryItem?> GetByIdAsync(Guid id);
    Task<InventoryItem> CreateAsync(InventoryItem item);
    Task<InventoryItem?> UpdateAsync(InventoryItem item);
    Task<bool> DeleteAsync(Guid id);
}
