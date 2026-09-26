using Gartengeist.Api.Data;
using Gartengeist.Api.Models.Entities;
using Gartengeist.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Gartengeist.Api.Repositories;

public class ShoppingRepository(GartengeistDbContext db) : IShoppingRepository
{
    public async Task<IEnumerable<ShoppingItem>> GetAllAsync() =>
        await db.ShoppingItems
            .Include(s => s.AddedBy)
            .OrderBy(s => s.Done)
            .ThenBy(s => s.Category)
            .ThenBy(s => s.CreatedAt)
            .ToListAsync();

    public async Task<ShoppingItem> CreateAsync(ShoppingItem item)
    {
        item.Id = Guid.NewGuid();
        item.CreatedAt = DateTimeOffset.UtcNow;
        item.UpdatedAt = DateTimeOffset.UtcNow;
        db.ShoppingItems.Add(item);
        await db.SaveChangesAsync();
        await db.Entry(item).Reference(s => s.AddedBy).LoadAsync();
        return item;
    }

    public async Task<ShoppingItem?> UpdateAsync(ShoppingItem item)
    {
        var existing = await db.ShoppingItems.Include(s => s.AddedBy).FirstOrDefaultAsync(s => s.Id == item.Id);
        if (existing is null) return null;

        existing.Name = item.Name;
        existing.Quantity = item.Quantity;
        existing.Category = item.Category;
        existing.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        return existing;
    }

    public async Task<ShoppingItem?> SetDoneAsync(Guid id, bool done)
    {
        var item = await db.ShoppingItems.Include(s => s.AddedBy).FirstOrDefaultAsync(s => s.Id == id);
        if (item is null) return null;

        item.Done = done;
        item.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        return item;
    }

    public async Task<bool> DeleteAsync(Guid id) =>
        await db.ShoppingItems.Where(s => s.Id == id).ExecuteDeleteAsync() > 0;

    public Task<int> DeleteDoneAsync() =>
        db.ShoppingItems.Where(s => s.Done).ExecuteDeleteAsync();
}
