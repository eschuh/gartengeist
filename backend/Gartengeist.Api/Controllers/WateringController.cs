using Gartengeist.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Gartengeist.Api.Controllers;

[ApiController]
[Route("api/giessen")]
public class WateringController(WateringService wateringService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetStatus() =>
        Ok(await wateringService.GetStatusAsync(DateOnly.FromDateTime(DateTime.Today)));
}
