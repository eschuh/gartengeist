using Gartengeist.Api.Models.Entities;

namespace Gartengeist.Api.Repositories.Interfaces;

public interface IShoppingRepository
{
    Task<IEnumerable<ShoppingItem>> GetAllAsync();
    Task<ShoppingItem> CreateAsync(ShoppingItem item);
    Task<ShoppingItem?> UpdateAsync(ShoppingItem item);
    Task<ShoppingItem?> SetDoneAsync(Guid id, bool done);
    Task<bool> DeleteAsync(Guid id);
    Task<int> DeleteDoneAsync();
}
