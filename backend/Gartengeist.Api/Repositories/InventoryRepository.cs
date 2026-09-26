using Gartengeist.Api.Data;
using Gartengeist.Api.Models.Entities;
using Gartengeist.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Gartengeist.Api.Repositories;

public class InventoryRepository(GartengeistDbContext db) : IInventoryRepository
{
    public async Task<IEnumerable<InventoryItem>> GetAllAsync() =>
        await db.InventoryItems.Include(i => i.Plant).OrderBy(i => i.Category).ThenBy(i => i.Name).ToListAsync();

    public async Task<InventoryItem?> GetByIdAsync(Guid id) =>
        await db.InventoryItems.Include(i => i.Plant).FirstOrDefaultAsync(i => i.Id == id);

    public async Task<InventoryItem> CreateAsync(InventoryItem item)
    {
        item.Id = Guid.NewGuid();
        item.CreatedAt = DateTimeOffset.UtcNow;
        item.UpdatedAt = DateTimeOffset.UtcNow;
        db.InventoryItems.Add(item);
        await db.SaveChangesAsync();
        return (await GetByIdAsync(item.Id))!;
    }

    public async Task<InventoryItem?> UpdateAsync(InventoryItem item)
    {
        var existing = await db.InventoryItems.FindAsync(item.Id);
        if (existing is null) return null;

        existing.Name = item.Name;
        existing.Quantity = item.Quantity;
        existing.Category = item.Category;
        existing.PlantId = item.PlantId;
        existing.UsableUntilYear = item.UsableUntilYear;
        existing.Notes = item.Notes;
        existing.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        return await GetByIdAsync(item.Id);
    }

    public async Task<bool> DeleteAsync(Guid id) =>
        await db.InventoryItems.Where(i => i.Id == id).ExecuteDeleteAsync() > 0;
}
