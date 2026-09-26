using Gartengeist.Api.Data;
using Gartengeist.Api.Models.Entities;
using Gartengeist.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Gartengeist.Api.Repositories;

public class JournalRepository(GartengeistDbContext db) : IJournalRepository
{
    private IQueryable<JournalEntry> WithDetails() => db.JournalEntries
        .Include(e => e.Area)
        .Include(e => e.Planting).ThenInclude(p => p!.Plant)
        .Include(e => e.User)
        .Include(e => e.Photos.OrderBy(p => p.CreatedAt));

    public async Task<IEnumerable<JournalEntry>> GetAllAsync(JournalFilter filter)
    {
        var query = WithDetails();
        if (filter.From is { } from) query = query.Where(e => e.Date >= from);
        if (filter.To is { } to) query = query.Where(e => e.Date <= to);
        if (filter.AreaId is { } areaId) query = query.Where(e => e.AreaId == areaId);
        if (filter.PlantingId is { } plantingId) query = query.Where(e => e.PlantingId == plantingId);
        if (filter.Type is { } type) query = query.Where(e => e.Type == type);

        return await query
            .OrderByDescending(e => e.Date)
            .ThenByDescending(e => e.CreatedAt)
            .Take(filter.Limit)
            .AsSplitQuery()
            .ToListAsync();
    }

    public async Task<JournalEntry?> GetByIdAsync(Guid id) =>
        await WithDetails().AsSplitQuery().FirstOrDefaultAsync(e => e.Id == id);

    public async Task<JournalEntry> CreateAsync(JournalEntry entry) =>
        (await CreateManyAsync([entry]))[0];

    public async Task<IReadOnlyList<JournalEntry>> CreateManyAsync(IEnumerable<JournalEntry> entries)
    {
        var list = entries.ToList();
        var now = DateTimeOffset.UtcNow;
        foreach (var entry in list)
        {
            entry.Id = Guid.NewGuid();
            entry.CreatedAt = now;
            entry.UpdatedAt = now;
        }
        db.JournalEntries.AddRange(list);
        await db.SaveChangesAsync();

        var ids = list.Select(e => e.Id).ToList();
        return await WithDetails().AsSplitQuery().Where(e => ids.Contains(e.Id)).ToListAsync();
    }

    public async Task<JournalEntry?> UpdateAsync(JournalEntry entry)
    {
        var existing = await db.JournalEntries.FindAsync(entry.Id);
        if (existing is null) return null;

        existing.Date = entry.Date;
        existing.Type = entry.Type;
        existing.Text = entry.Text;
        existing.AreaId = entry.AreaId;
        existing.PlantingId = entry.PlantingId;
        existing.Amount = entry.Amount;
        existing.Unit = entry.Unit;
        existing.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync();
        return await GetByIdAsync(entry.Id);
    }

    // Gibt den gelöschten Eintrag mit Fotos zurück, damit die Dateien entfernt werden können
    public async Task<JournalEntry?> DeleteAsync(Guid id)
    {
        var entry = await db.JournalEntries.Include(e => e.Photos).FirstOrDefaultAsync(e => e.Id == id);
        if (entry is null) return null;

        db.JournalEntries.Remove(entry);
        await db.SaveChangesAsync();
        return entry;
    }

    public async Task<JournalPhoto> AddPhotoAsync(Guid entryId, string fileName)
    {
        var photo = new JournalPhoto
        {
            Id = Guid.NewGuid(),
            EntryId = entryId,
            FileName = fileName,
            CreatedAt = DateTimeOffset.UtcNow
        };
        db.JournalPhotos.Add(photo);
        await db.SaveChangesAsync();
        return photo;
    }

    public Task<int> CountPhotosAsync(Guid entryId) =>
        db.JournalPhotos.CountAsync(p => p.EntryId == entryId);

    public async Task<JournalPhoto?> DeletePhotoAsync(Guid entryId, Guid photoId)
    {
        var photo = await db.JournalPhotos.FirstOrDefaultAsync(p => p.Id == photoId && p.EntryId == entryId);
        if (photo is null) return null;

        db.JournalPhotos.Remove(photo);
        await db.SaveChangesAsync();
        return photo;
    }
}
