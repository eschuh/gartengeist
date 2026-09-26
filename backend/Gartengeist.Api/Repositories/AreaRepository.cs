using Gartengeist.Api.Data;
using Gartengeist.Api.Models.Entities;
using Gartengeist.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Gartengeist.Api.Repositories;

public class AreaRepository(GartengeistDbContext db) : IAreaRepository
{
    public async Task<IEnumerable<Area>> GetAllAsync(bool includeArchived = false)
    {
        var query = db.Areas.AsQueryable();
        if (!includeArchived)
            query = query.Where(a => a.ArchivedAt == null);
        return await query.OrderBy(a => a.CreatedAt).ToListAsync();
    }

    public async Task<Area?> GetByIdAsync(Guid id) =>
        await db.Areas.FirstOrDefaultAsync(a => a.Id == id);

    public async Task<Area> CreateAsync(Area area)
    {
        area.Id = Guid.NewGuid();
        area.CreatedAt = DateTimeOffset.UtcNow;
        area.UpdatedAt = DateTimeOffset.UtcNow;
        db.Areas.Add(area);
        await db.SaveChangesAsync();
        return area;
    }

    public async Task<Area?> UpdateAsync(Area area)
    {
        var existing = await db.Areas.FindAsync(area.Id);
        if (existing is null) return null;

        existing.Name = area.Name;
        existing.Type = area.Type;
        existing.Width = area.Width;
        existing.Length = area.Length;
        existing.Description = area.Description;
        existing.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync();
        return existing;
    }

    public async Task<Area?> ArchiveAsync(Guid id)
    {
        var area = await db.Areas.FindAsync(id);
        if (area is null) return null;

        area.ArchivedAt = DateTimeOffset.UtcNow;
        area.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        return area;
    }

    public async Task<Area?> ReactivateAsync(Guid id)
    {
        var area = await db.Areas.FindAsync(id);
        if (area is null) return null;

        area.ArchivedAt = null;
        area.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        return area;
    }
}
