using Gartengeist.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Gartengeist.Api.Data;

public class GartengeistDbContext(DbContextOptions<GartengeistDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // pgvector für Embeddings (RAG, Phase 5)
        modelBuilder.HasPostgresExtension("vector");

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();
    }
}
