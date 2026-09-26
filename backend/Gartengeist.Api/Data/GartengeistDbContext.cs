using Gartengeist.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Gartengeist.Api.Data;

public class GartengeistDbContext(DbContextOptions<GartengeistDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Garden> Gardens => Set<Garden>();
    public DbSet<Area> Areas => Set<Area>();
    public DbSet<Plant> Plants => Set<Plant>();
    public DbSet<Planting> Plantings => Set<Planting>();
    public DbSet<JournalEntry> JournalEntries => Set<JournalEntry>();
    public DbSet<JournalPhoto> JournalPhotos => Set<JournalPhoto>();
    public DbSet<GardenTask> Tasks => Set<GardenTask>();
    public DbSet<ShoppingItem> ShoppingItems => Set<ShoppingItem>();
    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        configurationBuilder.Properties<AreaType>()
            .HaveConversion<AreaTypeConverter>();

        configurationBuilder.Properties<JournalEntryType>()
            .HaveConversion<JournalEntryTypeConverter>();
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // pgvector für Embeddings (RAG, Phase 5)
        modelBuilder.HasPostgresExtension("vector");

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Garden>(garden =>
        {
            garden.Property(g => g.Latitude).HasPrecision(9, 6);
            garden.Property(g => g.Longitude).HasPrecision(9, 6);
        });

        modelBuilder.Entity<Area>(area =>
        {
            area.Property(a => a.Width).HasPrecision(7, 2);
            area.Property(a => a.Length).HasPrecision(7, 2);
        });

        modelBuilder.Entity<Plant>()
            .HasIndex(p => p.Key)
            .IsUnique();

        modelBuilder.Entity<Planting>(planting =>
        {
            planting.HasOne(p => p.Area).WithMany().HasForeignKey(p => p.AreaId).OnDelete(DeleteBehavior.Restrict);
            planting.HasOne(p => p.Plant).WithMany().HasForeignKey(p => p.PlantId).OnDelete(DeleteBehavior.Restrict);
            planting.HasOne(p => p.CreatedBy).WithMany().HasForeignKey(p => p.CreatedById).OnDelete(DeleteBehavior.Restrict);
            planting.HasIndex(p => new { p.AreaId, p.EndedOn });
            planting.Property(p => p.Rows).HasPrecision(6, 2);
        });

        modelBuilder.Entity<JournalEntry>(entry =>
        {
            entry.HasOne(e => e.Area).WithMany().HasForeignKey(e => e.AreaId).OnDelete(DeleteBehavior.Restrict);
            entry.HasOne(e => e.Planting).WithMany().HasForeignKey(e => e.PlantingId).OnDelete(DeleteBehavior.Restrict);
            entry.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
            entry.HasMany(e => e.Photos).WithOne().HasForeignKey(p => p.EntryId).OnDelete(DeleteBehavior.Cascade);
            entry.Property(e => e.Amount).HasPrecision(9, 3);
            entry.Property(e => e.WeatherTempMin).HasPrecision(4, 1);
            entry.Property(e => e.WeatherTempMax).HasPrecision(4, 1);
            entry.Property(e => e.WeatherPrecipitationMm).HasPrecision(5, 1);
            entry.HasIndex(e => e.Date);
            entry.HasIndex(e => new { e.AreaId, e.Type, e.Date });
            entry.HasIndex(e => e.PlantingId);
        });

        modelBuilder.Entity<GardenTask>(task =>
        {
            task.HasOne(t => t.Area).WithMany().HasForeignKey(t => t.AreaId).OnDelete(DeleteBehavior.Restrict);
            task.HasOne(t => t.Plant).WithMany().HasForeignKey(t => t.PlantId).OnDelete(DeleteBehavior.Restrict);
            task.HasOne<Planting>().WithMany().HasForeignKey(t => t.PlantingId).OnDelete(DeleteBehavior.SetNull);
            task.HasOne(t => t.DoneBy).WithMany().HasForeignKey(t => t.DoneById).OnDelete(DeleteBehavior.Restrict);
            task.HasOne(t => t.CreatedBy).WithMany().HasForeignKey(t => t.CreatedById).OnDelete(DeleteBehavior.Restrict);
            task.HasIndex(t => t.Key).IsUnique();
            task.HasIndex(t => new { t.DoneAt, t.DueDate });
        });

        modelBuilder.Entity<ShoppingItem>()
            .HasOne(s => s.AddedBy).WithMany().HasForeignKey(s => s.AddedById).OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<InventoryItem>()
            .HasOne(i => i.Plant).WithMany().HasForeignKey(i => i.PlantId).OnDelete(DeleteBehavior.SetNull);
    }
}

file sealed class JournalEntryTypeConverter()
    : ValueConverter<JournalEntryType, string>(
        v => v.ToString().ToLowerInvariant(),
        v => Enum.Parse<JournalEntryType>(v, true));

file sealed class AreaTypeConverter()
    : ValueConverter<AreaType, string>(
        v => v.ToString().ToLowerInvariant(),
        v => Enum.Parse<AreaType>(v, true));
