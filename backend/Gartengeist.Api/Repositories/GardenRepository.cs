using Gartengeist.Api.Data;
using Gartengeist.Api.Models.Entities;
using Gartengeist.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Gartengeist.Api.Repositories;

public class GardenRepository(GartengeistDbContext db) : IGardenRepository
{
    public async Task<Garden?> GetAsync() =>
        await db.Gardens.OrderBy(g => g.CreatedAt).FirstOrDefaultAsync();

    // Es gibt genau einen Garten: anlegen, falls noch keiner existiert, sonst aktualisieren
    public async Task<Garden> SaveAsync(Garden garden)
    {
        var existing = await GetAsync();
        if (existing is null)
        {
            garden.Id = Guid.NewGuid();
            garden.CreatedAt = DateTimeOffset.UtcNow;
            garden.UpdatedAt = DateTimeOffset.UtcNow;
            db.Gardens.Add(garden);
            await db.SaveChangesAsync();
            return garden;
        }

        // Neuer Standort → Frostdaten neu berechnen lassen
        if (existing.Latitude != garden.Latitude || existing.Longitude != garden.Longitude)
            existing.FrostCalculatedAt = null;

        existing.LocationName = garden.LocationName;
        existing.PostalCode = garden.PostalCode;
        existing.Latitude = garden.Latitude;
        existing.Longitude = garden.Longitude;
        existing.HouseholdSize = garden.HouseholdSize;
        existing.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync();
        return existing;
    }

    public async Task SaveFrostDatesAsync(Guid gardenId, string? lastMedian, string? lastSafe, string? firstMedian, string? firstEarly)
    {
        var garden = await db.Gardens.FindAsync(gardenId);
        if (garden is null) return;

        garden.LastFrostMedian = lastMedian;
        garden.LastFrostSafe = lastSafe;
        garden.FirstFrostMedian = firstMedian;
        garden.FirstFrostEarly = firstEarly;
        garden.FrostCalculatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
    }
}
