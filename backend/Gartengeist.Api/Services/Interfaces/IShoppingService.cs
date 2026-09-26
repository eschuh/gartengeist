using Gartengeist.Api.Models.DTOs;
using Gartengeist.Api.Models.Entities;

namespace Gartengeist.Api.Services.Interfaces;

public interface IShoppingService
{
    Task<IEnumerable<ShoppingItem>> GetAllAsync();
    Task<ShoppingItem> CreateAsync(ShoppingItemRequest request, Guid userId);
    Task<ShoppingItem?> UpdateAsync(Guid id, ShoppingItemRequest request);
    Task<ShoppingItem?> SetDoneAsync(Guid id, bool done);
    Task<bool> DeleteAsync(Guid id);
    Task<int> DeleteDoneAsync();
}
