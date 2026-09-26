using System.ComponentModel.DataAnnotations;

namespace Gartengeist.Api.Models.DTOs;

public record RegisterRequest(
    [Required, MaxLength(100)] string Name,
    [Required, EmailAddress, MaxLength(200)] string Email,
    [Required, MinLength(8), MaxLength(200)] string Password,
    [MaxLength(200)] string? Code = null
);

// Open: noch freie Accounts; CodeRequired: Einladungscode nötig
public record RegistrationStatus(bool Open, bool CodeRequired);

public record LoginRequest(
    [Required] string Email,
    [Required] string Password
);

public record UserResponse(
    Guid Id,
    string Name,
    string Email,
    string Color
);

public record AuthResponse(
    string Token,
    DateTimeOffset ExpiresAt,
    UserResponse User
);
