using Gartengeist.Api.Models.DTOs;
using Gartengeist.Api.Models.Entities;
using Gartengeist.Api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Gartengeist.Api.Controllers;

[ApiController]
[Route("api/vorrat")]
public class InventoryController(IInventoryService inventoryService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok((await inventoryService.GetAllAsync()).Select(ToResponse));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var item = await inventoryService.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(ToResponse(item));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] InventoryItemRequest request)
    {
        try
        {
            var item = await inventoryService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = item.Id }, ToResponse(item));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { fehler = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] InventoryItemRequest request)
    {
        try
        {
            var item = await inventoryService.UpdateAsync(id, request);
            return item is null ? NotFound() : Ok(ToResponse(item));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { fehler = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id) =>
        await inventoryService.DeleteAsync(id) ? NoContent() : NotFound();

    private static InventoryItemResponse ToResponse(InventoryItem item) => new(
        item.Id,
        item.Name,
        item.Quantity,
        item.Category,
        item.PlantId,
        item.Plant?.Name,
        item.UsableUntilYear,
        item.Notes,
        item.UpdatedAt
    );
}
