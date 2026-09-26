using System.Security.Claims;
using Gartengeist.Api.Models.DTOs;
using Gartengeist.Api.Models.Entities;
using Gartengeist.Api.Services;
using Gartengeist.Api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Gartengeist.Api.Controllers;

[ApiController]
[Route("api/bepflanzungen")]
public class PlantingController(IPlantingService plantingService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? flaecheId, [FromQuery] bool includeEnded = false)
    {
        var plantings = await plantingService.GetAllAsync(flaecheId, includeEnded);
        return Ok(plantings.Select(ToResponse));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var planting = await plantingService.GetByIdAsync(id);
        return planting is null ? NotFound() : Ok(ToResponse(planting));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PlantingRequest request)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            return Unauthorized();

        try
        {
            var planting = await plantingService.CreateAsync(request, userId);
            return CreatedAtAction(nameof(GetById), new { id = planting.Id }, ToResponse(planting));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { fehler = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] PlantingRequest request)
    {
        try
        {
            var planting = await plantingService.UpdateAsync(id, request);
            return planting is null ? NotFound() : Ok(ToResponse(planting));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { fehler = ex.Message });
        }
    }

    [HttpPost("{id:guid}/beenden")]
    public async Task<IActionResult> End(Guid id, [FromBody] EndPlantingRequest? request)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId)) return Unauthorized();
        try
        {
            var result = await plantingService.EndAsync(id, request?.EndedOn, request?.Count, userId);
            return result is null
                ? NotFound()
                : Ok(new EndPlantingResponse(
                    ToResponse(result.Ended),
                    result.Remaining is null ? null : ToResponse(result.Remaining),
                    result.AreaFree));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { fehler = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id) =>
        await plantingService.DeleteAsync(id) ? NoContent() : NotFound();

    private static PlantingResponse ToResponse(Planting planting) => new(
        planting.Id,
        planting.AreaId,
        planting.Area.Name,
        planting.PlantId,
        planting.Plant.Name,
        planting.Variety,
        planting.Count,
        planting.SowingDate,
        planting.PlantingDate,
        planting.ExpectedHarvest,
        planting.Notes,
        planting.EndedOn,
        AuthService.ToResponse(planting.CreatedBy),
        planting.CreatedAt,
        planting.UpdatedAt
    );
}
