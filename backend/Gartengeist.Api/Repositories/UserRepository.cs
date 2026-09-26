using Gartengeist.Api.Data;
using Gartengeist.Api.Models.Entities;
using Gartengeist.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Gartengeist.Api.Repositories;

public class UserRepository(GartengeistDbContext db) : IUserRepository
{
    public async Task<User?> GetByIdAsync(Guid id) =>
        await db.Users.FirstOrDefaultAsync(u => u.Id == id);

    public async Task<User?> GetByEmailAsync(string email) =>
        await db.Users.FirstOrDefaultAsync(u => u.Email == email);

    public Task<int> CountAsync() => db.Users.CountAsync();

    public async Task<User> CreateAsync(User user)
    {
        user.Id = Guid.NewGuid();
        user.CreatedAt = DateTimeOffset.UtcNow;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user;
    }
}
