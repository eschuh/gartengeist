using Gartengeist.Api.Models.DTOs;
using Gartengeist.Api.Models.Entities;
using Gartengeist.Api.Services;
using Gartengeist.Api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Gartengeist.Api.Controllers;

[ApiController]
[Route("api/flaechen")]
public class AreaController(IAreaService areaService, RecommendationService recommendationService) : ControllerBase
{
    // Nachkultur-Empfehlungen: was passt jetzt auf diese Fläche?
    [HttpGet("{id:guid}/empfehlungen")]
    public async Task<IActionResult> Recommendations(Guid id)
    {
        var result = await recommendationService.GetForAreaAsync(id, DateOnly.FromDateTime(DateTime.Today));
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool includeArchived = false)
    {
        var areas = await areaService.GetAllAsync(includeArchived);
        return Ok(areas.Select(ToResponse));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var area = await areaService.GetByIdAsync(id);
        return area is null ? NotFound() : Ok(ToResponse(area));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AreaRequest request)
    {
        var area = await areaService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = area.Id }, ToResponse(area));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] AreaRequest request)
    {
        var area = await areaService.UpdateAsync(id, request);
        return area is null ? NotFound() : Ok(ToResponse(area));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Archive(Guid id)
    {
        var area = await areaService.ArchiveAsync(id);
        return area is null ? NotFound() : NoContent();
    }

    [HttpPatch("{id:guid}/reaktivieren")]
    public async Task<IActionResult> Reactivate(Guid id)
    {
        var area = await areaService.ReactivateAsync(id);
        return area is null ? NotFound() : Ok(ToResponse(area));
    }

    private static AreaResponse ToResponse(Area area) => new(
        area.Id,
        area.Name,
        area.Type.ToString().ToLowerInvariant(),
        area.Width,
        area.Length,
        area.Description,
        area.ArchivedAt,
        area.CreatedAt,
        area.UpdatedAt
    );
}
