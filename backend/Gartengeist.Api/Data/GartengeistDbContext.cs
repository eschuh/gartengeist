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

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        configurationBuilder.Properties<AreaType>()
            .HaveConversion<AreaTypeConverter>();
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
        });
    }
}

file sealed class AreaTypeConverter()
    : ValueConverter<AreaType, string>(
        v => v.ToString().ToLowerInvariant(),
        v => Enum.Parse<AreaType>(v, true));
