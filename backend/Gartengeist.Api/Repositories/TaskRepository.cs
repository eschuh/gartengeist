using Gartengeist.Api.Data;
using Gartengeist.Api.Models.Entities;
using Gartengeist.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Gartengeist.Api.Repositories;

public class TaskRepository(GartengeistDbContext db) : ITaskRepository
{
    private IQueryable<GardenTask> WithDetails() => db.Tasks
        .Include(t => t.Area)
        .Include(t => t.Plant)
        .Include(t => t.DoneBy)
        .Include(t => t.CreatedBy)
        .Where(t => t.DismissedAt == null);

    public async Task<IEnumerable<GardenTask>> GetAllAsync(bool? done, DateOnly? from, DateOnly? to, DateTimeOffset? doneSince)
    {
        var query = WithDetails();
        if (done == true) query = query.Where(t => t.DoneAt != null);
        if (done == false) query = query.Where(t => t.DoneAt == null);
        if (from is { } f) query = query.Where(t => t.DueDate >= f);
        if (to is { } until) query = query.Where(t => t.DueDate <= until);
        if (doneSince is { } since) query = query.Where(t => t.DoneAt >= since);
        return await query.OrderBy(t => t.DueDate).ThenBy(t => t.Title).ToListAsync();
    }

    public async Task<GardenTask?> GetByIdAsync(Guid id) =>
        await WithDetails().FirstOrDefaultAsync(t => t.Id == id);

    public async Task<HashSet<string>> GetExistingKeysAsync(IEnumerable<string> keys)
    {
        var list = keys.ToList();
        // Auch verworfene zählen – sie sollen nicht wieder auftauchen
        return (await db.Tasks.Where(t => t.Key != null && list.Contains(t.Key)).Select(t => t.Key!).ToListAsync())
            .ToHashSet();
    }

    public async Task<GardenTask> CreateAsync(GardenTask task)
    {
        await CreateManyAsync([task]);
        return (await GetByIdAsync(task.Id))!;
    }

    public async Task CreateManyAsync(IEnumerable<GardenTask> tasks)
    {
        var now = DateTimeOffset.UtcNow;
        foreach (var task in tasks)
        {
            task.Id = Guid.NewGuid();
            task.CreatedAt = now;
            task.UpdatedAt = now;
            db.Tasks.Add(task);
        }
        await db.SaveChangesAsync();
    }

    public async Task<GardenTask?> UpdateAsync(GardenTask task)
    {
        var existing = await db.Tasks.FindAsync(task.Id);
        if (existing is null || existing.DismissedAt is not null) return null;

        existing.Title = task.Title;
        existing.Description = task.Description;
        existing.DueDate = task.DueDate;
        existing.IntervalDays = task.IntervalDays;
        existing.AreaId = task.AreaId;
        existing.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync();
        return await GetByIdAsync(task.Id);
    }

    public async Task<GardenTask?> CompleteAsync(Guid id, Guid userId, GardenTask? next)
    {
        var task = await db.Tasks.FindAsync(id);
        if (task is null || task.DismissedAt is not null) return null;
        if (task.DoneAt is not null) return await GetByIdAsync(id);

        task.DoneAt = DateTimeOffset.UtcNow;
        task.DoneById = userId;
        task.UpdatedAt = DateTimeOffset.UtcNow;

        if (next is not null)
        {
            next.Id = Guid.NewGuid();
            next.PreviousId = task.Id;
            next.CreatedAt = DateTimeOffset.UtcNow;
            next.UpdatedAt = DateTimeOffset.UtcNow;
            db.Tasks.Add(next);
        }

        await db.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<GardenTask?> ReopenAsync(Guid id)
    {
        var task = await db.Tasks.FindAsync(id);
        if (task is null || task.DismissedAt is not null) return null;

        task.DoneAt = null;
        task.DoneById = null;
        task.UpdatedAt = DateTimeOffset.UtcNow;

        // Die beim Erledigen erzeugte Folgeaufgabe wieder entfernen, solange sie noch offen ist
        var successors = await db.Tasks.Where(t => t.PreviousId == id && t.DoneAt == null).ToListAsync();
        db.Tasks.RemoveRange(successors);

        await db.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<bool> DeleteOrDismissAsync(Guid id)
    {
        var task = await db.Tasks.FindAsync(id);
        if (task is null || task.DismissedAt is not null) return false;

        if (task.Key is not null) task.DismissedAt = DateTimeOffset.UtcNow;
        else db.Tasks.Remove(task);

        await db.SaveChangesAsync();
        return true;
    }
}
