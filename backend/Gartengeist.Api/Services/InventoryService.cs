using Gartengeist.Api.Models.DTOs;
using Gartengeist.Api.Models.Entities;
using Gartengeist.Api.Repositories.Interfaces;
using Gartengeist.Api.Services.Interfaces;

namespace Gartengeist.Api.Services;

public class InventoryService(IInventoryRepository inventoryRepository, IPlantRepository plantRepository) : IInventoryService
{
    public Task<IEnumerable<InventoryItem>> GetAllAsync() =>
        inventoryRepository.GetAllAsync();

    public Task<InventoryItem?> GetByIdAsync(Guid id) =>
        inventoryRepository.GetByIdAsync(id);

    public async Task<InventoryItem> CreateAsync(InventoryItemRequest request) =>
        await inventoryRepository.CreateAsync(await ToEntityAsync(request));

    public async Task<InventoryItem?> UpdateAsync(Guid id, InventoryItemRequest request)
    {
        var item = await ToEntityAsync(request);
        item.Id = id;
        return await inventoryRepository.UpdateAsync(item);
    }

    public Task<bool> DeleteAsync(Guid id) =>
        inventoryRepository.DeleteAsync(id);

    private async Task<InventoryItem> ToEntityAsync(InventoryItemRequest request)
    {
        if (request.PlantId is { } plantId && await plantRepository.GetByIdAsync(plantId) is null)
            throw new ArgumentException("Pflanze nicht im Katalog gefunden.");

        // Pflanze und Haltbarkeit gibt es nur bei Saatgut
        var isSeed = request.Category == "saatgut";
        return new InventoryItem
        {
            Name = request.Name.Trim(),
            Quantity = string.IsNullOrWhiteSpace(request.Quantity) ? null : request.Quantity.Trim(),
            Category = request.Category,
            PlantId = isSeed ? request.PlantId : null,
            UsableUntilYear = isSeed ? request.UsableUntilYear : null,
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim()
        };
    }
}
