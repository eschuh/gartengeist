using Gartengeist.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gartengeist.Api.Controllers;

[ApiController]
[Route("api/fotos")]
public class PhotoController(PhotoStorage photoStorage) : ControllerBase
{
    // Ohne Login: <img> kann keinen Token senden. Die Namen sind zufällige GUIDs.
    [AllowAnonymous]
    [HttpGet("{fileName}")]
    public IActionResult Get(string fileName)
    {
        var path = photoStorage.GetPath(fileName);
        if (path is null) return NotFound();

        Response.Headers.CacheControl = "private, max-age=31536000, immutable";
        return PhysicalFile(path, PhotoStorage.ContentTypeFor(fileName));
    }
}
