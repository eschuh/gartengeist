using System.Security.Claims;
using Gartengeist.Api.Models.DTOs;
using Gartengeist.Api.Models.Entities;
using Gartengeist.Api.Services;
using Gartengeist.Api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Gartengeist.Api.Controllers;

[ApiController]
[Route("api/aufgaben")]
public class TaskController(ITaskService taskService, TaskGenerator taskGenerator) : ControllerBase
{
    // status=offen (Standard): alle offenen; status=erledigt: erledigt in den letzten 14 Tagen;
    // von/bis: alle Aufgaben mit Fälligkeit im Zeitraum (für den Kalender)
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status, [FromQuery] DateOnly? von, [FromQuery] DateOnly? bis)
    {
        IEnumerable<GardenTask> tasks;
        if (von is { } from && bis is { } to) tasks = await taskService.GetInRangeAsync(from, to);
        else if (status == "erledigt") tasks = await taskService.GetRecentlyDoneAsync(14);
        else tasks = await taskService.GetOpenAsync();
        return Ok(tasks.Select(ToResponse));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var task = await taskService.GetByIdAsync(id);
        return task is null ? NotFound() : Ok(ToResponse(task));
    }

    [HttpGet("voranzucht-plan")]
    public async Task<IActionResult> PreCultivationPlan() =>
        Ok(await taskGenerator.GetPreCultivationPlanAsync(DateOnly.FromDateTime(DateTime.Today)));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TaskRequest request)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        try
        {
            var task = await taskService.CreateAsync(request, userId);
            return CreatedAtAction(nameof(GetById), new { id = task.Id }, ToResponse(task));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { fehler = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] TaskRequest request)
    {
        try
        {
            var task = await taskService.UpdateAsync(id, request);
            return task is null ? NotFound() : Ok(ToResponse(task));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { fehler = ex.Message });
        }
    }

    [HttpPost("{id:guid}/erledigen")]
    public async Task<IActionResult> Complete(Guid id)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        var task = await taskService.CompleteAsync(id, userId);
        return task is null ? NotFound() : Ok(ToResponse(task));
    }

    [HttpPost("{id:guid}/wieder-oeffnen")]
    public async Task<IActionResult> Reopen(Guid id)
    {
        var task = await taskService.ReopenAsync(id);
        return task is null ? NotFound() : Ok(ToResponse(task));
    }

    // Manuelle Aufgaben werden gelöscht, automatische verworfen (damit sie nicht neu entstehen)
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id) =>
        await taskService.DeleteAsync(id) ? NoContent() : NotFound();

    private bool TryGetUserId(out Guid userId) =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out userId);

    private static TaskResponse ToResponse(GardenTask task) => new(
        task.Id,
        task.Title,
        task.Description,
        task.DueDate,
        task.IntervalDays,
        task.Category,
        task.Source,
        task.AreaId,
        task.Area?.Name,
        task.PlantId,
        task.Plant?.Name,
        task.DoneAt,
        task.DoneBy is null ? null : AuthService.ToResponse(task.DoneBy),
        task.CreatedBy is null ? null : AuthService.ToResponse(task.CreatedBy),
        task.CreatedAt
    );
}
