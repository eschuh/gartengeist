using System.Security.Claims;
using Gartengeist.Api.Models.DTOs;
using Gartengeist.Api.Models.Entities;
using Gartengeist.Api.Services;
using Gartengeist.Api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Gartengeist.Api.Controllers;

[ApiController]
[Route("api/einkauf")]
public class ShoppingController(IShoppingService shoppingService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok((await shoppingService.GetAllAsync()).Select(ToResponse));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ShoppingItemRequest request)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId)) return Unauthorized();
        return Ok(ToResponse(await shoppingService.CreateAsync(request, userId)));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] ShoppingItemRequest request)
    {
        var item = await shoppingService.UpdateAsync(id, request);
        return item is null ? NotFound() : Ok(ToResponse(item));
    }

    [HttpPatch("{id:guid}/erledigt")]
    public async Task<IActionResult> SetDone(Guid id, [FromQuery] bool wert = true)
    {
        var item = await shoppingService.SetDoneAsync(id, wert);
        return item is null ? NotFound() : Ok(ToResponse(item));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id) =>
        await shoppingService.DeleteAsync(id) ? NoContent() : NotFound();

    [HttpDelete("erledigte")]
    public async Task<IActionResult> DeleteDone() =>
        Ok(new { geloescht = await shoppingService.DeleteDoneAsync() });

    private static ShoppingItemResponse ToResponse(ShoppingItem item) => new(
        item.Id,
        item.Name,
        item.Quantity,
        item.Category,
        item.Done,
        AuthService.ToResponse(item.AddedBy),
        item.CreatedAt
    );
}
