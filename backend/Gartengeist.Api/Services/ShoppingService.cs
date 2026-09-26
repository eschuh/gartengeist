using Gartengeist.Api.Models.DTOs;
using Gartengeist.Api.Models.Entities;
using Gartengeist.Api.Repositories.Interfaces;
using Gartengeist.Api.Services.Interfaces;

namespace Gartengeist.Api.Services;

public class ShoppingService(IShoppingRepository shoppingRepository) : IShoppingService
{
    public Task<IEnumerable<ShoppingItem>> GetAllAsync() =>
        shoppingRepository.GetAllAsync();

    public Task<ShoppingItem> CreateAsync(ShoppingItemRequest request, Guid userId) =>
        shoppingRepository.CreateAsync(new ShoppingItem
        {
            Name = request.Name.Trim(),
            Quantity = Clean(request.Quantity),
            Category = request.Category ?? "sonstiges",
            AddedById = userId
        });

    public Task<ShoppingItem?> UpdateAsync(Guid id, ShoppingItemRequest request) =>
        shoppingRepository.UpdateAsync(new ShoppingItem
        {
            Id = id,
            Name = request.Name.Trim(),
            Quantity = Clean(request.Quantity),
            Category = request.Category ?? "sonstiges"
        });

    public Task<ShoppingItem?> SetDoneAsync(Guid id, bool done) =>
        shoppingRepository.SetDoneAsync(id, done);

    public Task<bool> DeleteAsync(Guid id) =>
        shoppingRepository.DeleteAsync(id);

    public Task<int> DeleteDoneAsync() =>
        shoppingRepository.DeleteDoneAsync();

    private static string? Clean(string? text) => string.IsNullOrWhiteSpace(text) ? null : text.Trim();
}
