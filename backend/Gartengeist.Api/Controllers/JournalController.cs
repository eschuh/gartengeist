using System.Security.Claims;
using Gartengeist.Api.Models.DTOs;
using Gartengeist.Api.Models.Entities;
using Gartengeist.Api.Repositories.Interfaces;
using Gartengeist.Api.Services;
using Gartengeist.Api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Gartengeist.Api.Controllers;

[ApiController]
[Route("api/tagebuch")]
public class JournalController(IJournalService journalService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] DateOnly? von,
        [FromQuery] DateOnly? bis,
        [FromQuery] Guid? flaecheId,
        [FromQuery] Guid? bepflanzungId,
        [FromQuery] string? typ,
        [FromQuery] int limit = 100)
    {
        JournalEntryType? type = null;
        if (typ is not null)
        {
            if (!Enum.TryParse<JournalEntryType>(typ, true, out var parsed))
                return BadRequest(new { fehler = "Unbekannter Eintragstyp." });
            type = parsed;
        }

        var entries = await journalService.GetAllAsync(
            new JournalFilter(von, bis, flaecheId, bepflanzungId, type, Math.Clamp(limit, 1, 500)));
        return Ok(entries.Select(ToResponse));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var entry = await journalService.GetByIdAsync(id);
        return entry is null ? NotFound() : Ok(ToResponse(entry));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] JournalEntryRequest request)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        try
        {
            var entry = await journalService.CreateAsync(request, userId);
            return CreatedAtAction(nameof(GetById), new { id = entry.Id }, ToResponse(entry));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { fehler = ex.Message });
        }
    }

    [HttpPost("schnell")]
    public async Task<IActionResult> QuickAction([FromBody] QuickActionRequest request)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        try
        {
            var entries = await journalService.CreateQuickActionAsync(request, userId);
            return Ok(entries.Select(ToResponse));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { fehler = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] JournalEntryRequest request)
    {
        try
        {
            var entry = await journalService.UpdateAsync(id, request);
            return entry is null ? NotFound() : Ok(ToResponse(entry));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { fehler = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id) =>
        await journalService.DeleteAsync(id) ? NoContent() : NotFound();

    [HttpPost("{id:guid}/fotos")]
    [RequestSizeLimit(PhotoStorage.MaxFileBytes + 64 * 1024)]
    public async Task<IActionResult> AddPhoto(Guid id, IFormFile datei)
    {
        if (await journalService.GetByIdAsync(id) is null) return NotFound();
        if (datei.Length == 0 || datei.Length > PhotoStorage.MaxFileBytes)
            return BadRequest(new { fehler = "Foto ist leer oder zu groß (max. 15 MB)." });
        if (!PhotoStorage.IsSupported(datei.ContentType))
            return BadRequest(new { fehler = "Nur JPEG-, PNG- oder WebP-Fotos werden unterstützt." });

        try
        {
            await using var stream = datei.OpenReadStream();
            var photo = await journalService.AddPhotoAsync(id, stream, datei.ContentType);
            return Ok(ToResponse(photo));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { fehler = ex.Message });
        }
    }

    [HttpDelete("{id:guid}/fotos/{photoId:guid}")]
    public async Task<IActionResult> DeletePhoto(Guid id, Guid photoId) =>
        await journalService.DeletePhotoAsync(id, photoId) ? NoContent() : NotFound();

    [HttpGet("ernte")]
    public async Task<IActionResult> HarvestSummary([FromQuery] int? jahr) =>
        Ok(await journalService.GetHarvestSummaryAsync(jahr ?? DateTime.Today.Year));

    private bool TryGetUserId(out Guid userId) =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out userId);

    private static JournalPhotoResponse ToResponse(JournalPhoto photo) =>
        new(photo.Id, $"/api/fotos/{photo.FileName}");

    private static JournalEntryResponse ToResponse(JournalEntry entry) => new(
        entry.Id,
        entry.Date,
        entry.Type.ToString().ToLowerInvariant(),
        entry.Text,
        entry.AreaId,
        entry.Area?.Name,
        entry.PlantingId,
        entry.Planting is { } p ? (p.Variety is null ? p.Plant.Name : $"{p.Plant.Name} · {p.Variety}") : null,
        entry.Amount,
        entry.Unit,
        AuthService.ToResponse(entry.User),
        entry.WeatherTempMin is null && entry.WeatherCode is null
            ? null
            : new JournalWeather(entry.WeatherTempMin, entry.WeatherTempMax, entry.WeatherPrecipitationMm, entry.WeatherCode),
        entry.Photos.Select(ToResponse).ToList(),
        entry.CreatedAt,
        entry.UpdatedAt
    );
}
