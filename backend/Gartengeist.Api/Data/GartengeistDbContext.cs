using Gartengeist.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Gartengeist.Api.Data;

public class GartengeistDbContext(DbContextOptions<GartengeistDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Garden> Gardens => Set<Garden>();
    public DbSet<Area> Areas => Set<Area>();

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
    }
}

file sealed class AreaTypeConverter()
    : ValueConverter<AreaType, string>(
        v => v.ToString().ToLowerInvariant(),
        v => Enum.Parse<AreaType>(v, true));
