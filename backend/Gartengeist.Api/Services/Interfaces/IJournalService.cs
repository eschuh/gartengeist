using Gartengeist.Api.Models.DTOs;
using Gartengeist.Api.Models.Entities;
using Gartengeist.Api.Repositories.Interfaces;

namespace Gartengeist.Api.Services.Interfaces;

public interface IJournalService
{
    Task<IEnumerable<JournalEntry>> GetAllAsync(JournalFilter filter);
    Task<JournalEntry?> GetByIdAsync(Guid id);
    Task<JournalEntry> CreateAsync(JournalEntryRequest request, Guid userId);
    Task<IReadOnlyList<JournalEntry>> CreateQuickActionAsync(QuickActionRequest request, Guid userId);
    Task<JournalEntry?> UpdateAsync(Guid id, JournalEntryRequest request);
    Task<bool> DeleteAsync(Guid id);
    Task<JournalPhoto> AddPhotoAsync(Guid entryId, Stream content, string contentType);
    Task<bool> DeletePhotoAsync(Guid entryId, Guid photoId);
    Task<IReadOnlyList<HarvestSummaryItem>> GetHarvestSummaryAsync(int year);
}
