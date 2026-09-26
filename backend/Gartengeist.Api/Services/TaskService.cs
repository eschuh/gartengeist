using Gartengeist.Api.Models.DTOs;
using Gartengeist.Api.Models.Entities;
using Gartengeist.Api.Repositories.Interfaces;
using Gartengeist.Api.Services.Interfaces;

namespace Gartengeist.Api.Services;

public class TaskService(ITaskRepository taskRepository, IAreaRepository areaRepository) : ITaskService
{
    public Task<IEnumerable<GardenTask>> GetOpenAsync() =>
        taskRepository.GetAllAsync(done: false, from: null, to: null, doneSince: null);

    public Task<IEnumerable<GardenTask>> GetRecentlyDoneAsync(int days) =>
        taskRepository.GetAllAsync(done: true, from: null, to: null, doneSince: DateTimeOffset.UtcNow.AddDays(-days));

    public Task<IEnumerable<GardenTask>> GetInRangeAsync(DateOnly from, DateOnly to) =>
        taskRepository.GetAllAsync(done: null, from, to, doneSince: null);

    public Task<GardenTask?> GetByIdAsync(Guid id) =>
        taskRepository.GetByIdAsync(id);

    public async Task<GardenTask> CreateAsync(TaskRequest request, Guid userId)
    {
        await ValidateAreaAsync(request.AreaId);
        return await taskRepository.CreateAsync(new GardenTask
        {
            Title = request.Title.Trim(),
            Description = Clean(request.Description),
            DueDate = request.DueDate,
            IntervalDays = request.IntervalDays,
            AreaId = request.AreaId,
            Source = "manuell",
            CreatedById = userId
        });
    }

    public async Task<GardenTask?> UpdateAsync(Guid id, TaskRequest request)
    {
        await ValidateAreaAsync(request.AreaId);
        return await taskRepository.UpdateAsync(new GardenTask
        {
            Id = id,
            Title = request.Title.Trim(),
            Description = Clean(request.Description),
            DueDate = request.DueDate,
            IntervalDays = request.IntervalDays,
            AreaId = request.AreaId
        });
    }

    // Wiederkehrende Aufgaben: die nächste ist ab dem Erledigungstag fällig (nicht ab dem alten Termin),
    // damit sich verspätetes Erledigen nicht aufstaut.
    public async Task<GardenTask?> CompleteAsync(Guid id, Guid userId)
    {
        var task = await taskRepository.GetByIdAsync(id);
        if (task is null) return null;

        GardenTask? next = null;
        if (task is { IntervalDays: { } interval, DoneAt: null })
        {
            next = new GardenTask
            {
                Title = task.Title,
                Description = task.Description,
                DueDate = DateOnly.FromDateTime(DateTime.Today).AddDays(interval),
                IntervalDays = interval,
                Category = task.Category,
                Source = task.Source,
                AreaId = task.AreaId,
                PlantingId = task.PlantingId,
                PlantId = task.PlantId,
                CreatedById = task.CreatedById
            };
        }

        return await taskRepository.CompleteAsync(id, userId, next);
    }

    public Task<GardenTask?> ReopenAsync(Guid id) =>
        taskRepository.ReopenAsync(id);

    public Task<bool> DeleteAsync(Guid id) =>
        taskRepository.DeleteOrDismissAsync(id);

    private async Task ValidateAreaAsync(Guid? areaId)
    {
        if (areaId is { } id && await areaRepository.GetByIdAsync(id) is null)
            throw new ArgumentException("Fläche nicht gefunden.");
    }

    private static string? Clean(string? text) =>
        string.IsNullOrWhiteSpace(text) ? null : text.Trim();
}
