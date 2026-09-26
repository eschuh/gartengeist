using Gartengeist.Api.Models.DTOs;
using Gartengeist.Api.Models.Entities;

namespace Gartengeist.Api.Services.Interfaces;

public interface IInventoryService
{
    Task<IEnumerable<InventoryItem>> GetAllAsync();
    Task<InventoryItem?> GetByIdAsync(Guid id);
    Task<InventoryItem> CreateAsync(InventoryItemRequest request);
    Task<InventoryItem?> UpdateAsync(Guid id, InventoryItemRequest request);
    Task<bool> DeleteAsync(Guid id);
}
