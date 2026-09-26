using Gartengeist.Api.Models.Entities;

namespace Gartengeist.Api.Repositories.Interfaces;

public record JournalFilter(
    DateOnly? From = null,
    DateOnly? To = null,
    Guid? AreaId = null,
    Guid? PlantingId = null,
    JournalEntryType? Type = null,
    int Limit = 100);

public interface IJournalRepository
{
    Task<IEnumerable<JournalEntry>> GetAllAsync(JournalFilter filter);
    Task<JournalEntry?> GetByIdAsync(Guid id);
    Task<JournalEntry> CreateAsync(JournalEntry entry);
    Task<IReadOnlyList<JournalEntry>> CreateManyAsync(IEnumerable<JournalEntry> entries);
    Task<JournalEntry?> UpdateAsync(JournalEntry entry);
    Task<JournalEntry?> DeleteAsync(Guid id);
    Task<JournalPhoto> AddPhotoAsync(Guid entryId, string fileName);
    Task<int> CountPhotosAsync(Guid entryId);
    Task<JournalPhoto?> DeletePhotoAsync(Guid entryId, Guid photoId);
}
