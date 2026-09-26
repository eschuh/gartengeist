using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Gartengeist.Api.Models.DTOs;
using Gartengeist.Api.Models.Entities;
using Gartengeist.Api.Repositories.Interfaces;
using Gartengeist.Api.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Gartengeist.Api.Services;

public class AuthService(
    IUserRepository userRepository,
    IPasswordHasher<User> passwordHasher,
    IOptions<JwtOptions> jwtOptions,
    IConfiguration configuration) : IAuthService
{
    // Avatar-Farben in Reihenfolge der Registrierung
    private static readonly string[] Colors = ["#65a30d", "#c2410c", "#0e7490", "#7c3aed"];

    public async Task<RegistrationStatus> GetRegistrationStatusAsync()
    {
        var maxUsers = configuration.GetValue("Auth:MaxNutzer", 2);
        var open = await userRepository.CountAsync() < maxUsers;
        return new RegistrationStatus(open, open && RegistrationCode is not null);
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var maxUsers = configuration.GetValue("Auth:MaxNutzer", 2);
        var userCount = await userRepository.CountAsync();
        if (userCount >= maxUsers)
            throw new InvalidOperationException("Es sind bereits alle Nutzer-Accounts vergeben.");

        // Im Internet erreichbar: Registrierung nur mit Einladungscode (Auth:Registrierungscode)
        if (RegistrationCode is { } expected && !CodesMatch(expected, request.Code))
            throw new InvalidOperationException("Der Einladungscode stimmt nicht.");

        var email = NormalizeEmail(request.Email);
        if (await userRepository.GetByEmailAsync(email) is not null)
            throw new InvalidOperationException("Diese E-Mail-Adresse ist bereits registriert.");

        var user = new User
        {
            Name = request.Name.Trim(),
            Email = email,
            Color = Colors[userCount % Colors.Length]
        };
        user.PasswordHash = passwordHasher.HashPassword(user, request.Password);

        await userRepository.CreateAsync(user);
        return CreateAuthResponse(user);
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var user = await userRepository.GetByEmailAsync(NormalizeEmail(request.Email));
        if (user is null) return null;

        var result = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        return result == PasswordVerificationResult.Failed ? null : CreateAuthResponse(user);
    }

    public Task<User?> GetUserAsync(Guid id) =>
        userRepository.GetByIdAsync(id);

    public static UserResponse ToResponse(User user) =>
        new(user.Id, user.Name, user.Email, user.Color);

    private AuthResponse CreateAuthResponse(User user)
    {
        var options = jwtOptions.Value;
        var expiresAt = DateTimeOffset.UtcNow.AddDays(options.GueltigkeitTage);

        var token = new JwtSecurityToken(
            issuer: options.Issuer,
            audience: options.Audience,
            claims:
            [
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Name, user.Name)
            ],
            expires: expiresAt.UtcDateTime,
            signingCredentials: new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(options.Key)),
                SecurityAlgorithms.HmacSha256));

        return new AuthResponse(
            new JwtSecurityTokenHandler().WriteToken(token),
            expiresAt,
            ToResponse(user));
    }

    private string? RegistrationCode =>
        configuration["Auth:Registrierungscode"] is { Length: > 0 } code ? code : null;

    // Vergleich in konstanter Zeit, damit sich der Code nicht über Antwortzeiten erraten lässt
    private static bool CodesMatch(string expected, string? actual) =>
        actual is not null &&
        CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(expected), Encoding.UTF8.GetBytes(actual.Trim()));

    private static string NormalizeEmail(string email) =>
        email.Trim().ToLowerInvariant();
}
