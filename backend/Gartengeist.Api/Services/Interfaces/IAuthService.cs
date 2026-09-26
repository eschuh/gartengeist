using Gartengeist.Api.Models.DTOs;
using Gartengeist.Api.Models.Entities;

namespace Gartengeist.Api.Services.Interfaces;

public interface IAuthService
{
    Task<RegistrationStatus> GetRegistrationStatusAsync();
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse?> LoginAsync(LoginRequest request);
    Task<User?> GetUserAsync(Guid id);
}
