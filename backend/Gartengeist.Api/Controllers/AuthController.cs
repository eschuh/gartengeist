using System.Security.Claims;
using Gartengeist.Api.Models.DTOs;
using Gartengeist.Api.Services;
using Gartengeist.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Gartengeist.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("registrierung")]
    public async Task<IActionResult> RegistrationStatus() =>
        Ok(await authService.GetRegistrationStatusAsync());

    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [HttpPost("registrieren")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            return Ok(await authService.RegisterAsync(request));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { fehler = ex.Message });
        }
    }

    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var response = await authService.LoginAsync(request);
        return response is null
            ? Unauthorized(new { fehler = "E-Mail oder Passwort ist falsch." })
            : Ok(response);
    }

    [HttpGet("ich")]
    public async Task<IActionResult> Me()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(sub, out var userId)) return Unauthorized();

        var user = await authService.GetUserAsync(userId);
        return user is null ? Unauthorized() : Ok(AuthService.ToResponse(user));
    }
}
