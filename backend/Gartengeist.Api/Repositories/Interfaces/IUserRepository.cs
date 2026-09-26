using Gartengeist.Api.Models.Entities;

namespace Gartengeist.Api.Repositories.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id);
    Task<User?> GetByEmailAsync(string email);
    Task<int> CountAsync();
    Task<User> CreateAsync(User user);
}
