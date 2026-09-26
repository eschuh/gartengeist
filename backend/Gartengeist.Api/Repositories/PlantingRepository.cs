using Gartengeist.Api.Data;
using Gartengeist.Api.Models.Entities;
using Gartengeist.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Gartengeist.Api.Repositories;

public class PlantingRepository(GartengeistDbContext db) : IPlantingRepository
{
    private IQueryable<Planting> WithDetails() => db.Plantings
        .Include(p => p.Area)
        .Include(p => p.Plant)
        .Include(p => p.CreatedBy);

    public async Task<IEnumerable<Planting>> GetAllAsync(Guid? areaId, bool includeEnded)
    {
        var query = WithDetails();
        if (areaId is not null)
            query = query.Where(p => p.AreaId == areaId);
        if (!includeEnded)
            query = query.Where(p => p.EndedOn == null);
        return await query
            .OrderByDescending(p => p.PlantingDate ?? p.SowingDate)
            .ThenByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<Planting?> GetByIdAsync(Guid id) =>
        await WithDetails().FirstOrDefaultAsync(p => p.Id == id);

    public async Task<Planting> CreateAsync(Planting planting)
    {
        planting.Id = Guid.NewGuid();
        planting.CreatedAt = DateTimeOffset.UtcNow;
        planting.UpdatedAt = DateTimeOffset.UtcNow;
        db.Plantings.Add(planting);
        await db.SaveChangesAsync();
        return (await GetByIdAsync(planting.Id))!;
    }

    public async Task<Planting?> UpdateAsync(Planting planting)
    {
        var existing = await db.Plantings.FindAsync(planting.Id);
        if (existing is null) return null;

        existing.AreaId = planting.AreaId;
        existing.PlantId = planting.PlantId;
        existing.Variety = planting.Variety;
        existing.Count = planting.Count;
        existing.Rows = planting.Rows;
        existing.SowingDate = planting.SowingDate;
        existing.PlantingDate = planting.PlantingDate;
        existing.ExpectedHarvest = planting.ExpectedHarvest;
        existing.Notes = planting.Notes;
        existing.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync();
        return await GetByIdAsync(planting.Id);
    }

    public async Task<Planting?> EndAsync(Guid id, DateOnly endedOn)
    {
        var planting = await db.Plantings.FindAsync(id);
        if (planting is null) return null;

        planting.EndedOn = endedOn;
        planting.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    // Teil abräumen: Pflanzen und/oder Reihen der Kultur verringern und den abgeräumten Teil
    // als eigene, beendete Kultur ablegen
    public async Task<Planting?> SplitEndAsync(Guid id, int? count, decimal? rows, DateOnly endedOn)
    {
        var planting = await db.Plantings.FindAsync(id);
        if (planting is null) return null;
        if (count is { } c && (planting.Count is not { } total || c >= total)) return null;
        if (rows is { } r && (planting.Rows is not { } totalRows || r >= totalRows)) return null;

        if (count is { } clearedCount) planting.Count -= clearedCount;
        if (rows is { } clearedRows) planting.Rows -= clearedRows;
        planting.UpdatedAt = DateTimeOffset.UtcNow;

        var ended = new Planting
        {
            Id = Guid.NewGuid(),
            AreaId = planting.AreaId,
            PlantId = planting.PlantId,
            Variety = planting.Variety,
            Count = count,
            Rows = rows,
            SowingDate = planting.SowingDate,
            PlantingDate = planting.PlantingDate,
            ExpectedHarvest = planting.ExpectedHarvest,
            Notes = planting.Notes,
            EndedOn = endedOn,
            CreatedById = planting.CreatedById,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        db.Plantings.Add(ended);
        await db.SaveChangesAsync();
        return await GetByIdAsync(ended.Id);
    }

    // Nur für Fehleinträge. Tagebucheinträge bleiben erhalten, verlieren aber den Bezug zur Kultur.
    public async Task<bool> DeleteAsync(Guid id)
    {
        var planting = await db.Plantings.FindAsync(id);
        if (planting is null) return false;

        await db.JournalEntries
            .Where(e => e.PlantingId == id)
            .ExecuteUpdateAsync(s => s.SetProperty(e => e.PlantingId, (Guid?)null));
        db.Plantings.Remove(planting);
        await db.SaveChangesAsync();
        return true;
    }
}
