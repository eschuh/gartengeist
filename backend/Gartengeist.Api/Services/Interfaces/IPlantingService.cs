using Gartengeist.Api.Models.DTOs;
using Gartengeist.Api.Models.Entities;

namespace Gartengeist.Api.Services.Interfaces;

// Ended: der abgeräumte Teil; Remaining: was beim Teil-Abräumen stehen bleibt; AreaFree: nichts mehr auf der Fläche
public record EndPlantingResult(Planting Ended, Planting? Remaining, bool AreaFree);

public interface IPlantingService
{
    Task<IEnumerable<Planting>> GetAllAsync(Guid? areaId, bool includeEnded);
    Task<Planting?> GetByIdAsync(Guid id);
    Task<Planting> CreateAsync(PlantingRequest request, Guid userId);
    Task<Planting?> UpdateAsync(Guid id, PlantingRequest request);
    Task<EndPlantingResult?> EndAsync(Guid id, DateOnly? endedOn, int? count, Guid userId);
    Task<bool> DeleteAsync(Guid id);
}
