using Gartengeist.Api.Models.DTOs;
using Gartengeist.Api.Models.Entities;
using Gartengeist.Api.Repositories.Interfaces;
using Gartengeist.Api.Services.Interfaces;

namespace Gartengeist.Api.Services;

public class AreaService(IAreaRepository areaRepository) : IAreaService
{
    public Task<IEnumerable<Area>> GetAllAsync(bool includeArchived = false) =>
        areaRepository.GetAllAsync(includeArchived);

    public Task<Area?> GetByIdAsync(Guid id) =>
        areaRepository.GetByIdAsync(id);

    public Task<Area> CreateAsync(AreaRequest request) =>
        areaRepository.CreateAsync(ToEntity(request));

    public Task<Area?> UpdateAsync(Guid id, AreaRequest request)
    {
        var area = ToEntity(request);
        area.Id = id;
        return areaRepository.UpdateAsync(area);
    }

    public Task<Area?> ArchiveAsync(Guid id) =>
        areaRepository.ArchiveAsync(id);

    public Task<Area?> ReactivateAsync(Guid id) =>
        areaRepository.ReactivateAsync(id);

    private static Area ToEntity(AreaRequest request) => new()
    {
        Name = request.Name.Trim(),
        Type = Enum.Parse<AreaType>(request.Type, true),
        Width = request.Width,
        Length = request.Length,
        Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim()
    };
}
