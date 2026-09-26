using System.Text.RegularExpressions;

namespace Gartengeist.Api.Services;

// Fotos im Dateisystem (Uploads:Path, Standard: ./uploads im Content-Root).
// Dateinamen sind zufällige GUIDs – sie werden ohne Login ausgeliefert, weil <img> keinen Token mitsenden kann.
public partial class PhotoStorage
{
    public const long MaxFileBytes = 15 * 1024 * 1024;

    private static readonly Dictionary<string, string> ExtensionsByContentType = new()
    {
        ["image/jpeg"] = ".jpg",
        ["image/png"] = ".png",
        ["image/webp"] = ".webp"
    };

    private readonly string _root;

    public PhotoStorage(IConfiguration configuration, IWebHostEnvironment environment)
    {
        var configured = configuration["Uploads:Path"] ?? "uploads";
        _root = Path.GetFullPath(Path.Combine(environment.ContentRootPath, configured, "fotos"));
        Directory.CreateDirectory(_root);
    }

    public static bool IsSupported(string contentType) => ExtensionsByContentType.ContainsKey(contentType);

    public async Task<string> SaveAsync(Stream content, string contentType)
    {
        var fileName = Guid.NewGuid().ToString("N") + ExtensionsByContentType[contentType];
        await using var file = File.Create(Path.Combine(_root, fileName));
        await content.CopyToAsync(file);
        return fileName;
    }

    // null bei ungültigem Namen (Schutz gegen Pfad-Tricks) oder fehlender Datei
    public string? GetPath(string fileName)
    {
        if (!FileNamePattern().IsMatch(fileName)) return null;
        var path = Path.Combine(_root, fileName);
        return File.Exists(path) ? path : null;
    }

    public void Delete(string fileName)
    {
        if (GetPath(fileName) is { } path) File.Delete(path);
    }

    public static string ContentTypeFor(string fileName) =>
        ExtensionsByContentType.First(kv => fileName.EndsWith(kv.Value)).Key;

    [GeneratedRegex("^[0-9a-f]{32}\\.(jpg|png|webp)$")]
    private static partial Regex FileNamePattern();
}
