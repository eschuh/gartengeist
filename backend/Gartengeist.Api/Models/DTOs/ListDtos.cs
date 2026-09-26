using System.ComponentModel.DataAnnotations;

namespace Gartengeist.Api.Models.DTOs;

public record ShoppingItemRequest(
    [Required, MaxLength(200)] string Name,
    [MaxLength(100)] string? Quantity,
    [RegularExpression("saatgut|pflanzen|duenger|werkzeug|sonstiges", ErrorMessage = "Unbekannte Kategorie.")]
    string? Category
);

public record ShoppingItemResponse(
    Guid Id,
    string Name,
    string? Quantity,
    string Category,
    bool Done,
    UserResponse AddedBy,
    DateTimeOffset CreatedAt
);

public record InventoryItemRequest(
    [Required, MaxLength(200)] string Name,
    [MaxLength(100)] string? Quantity,
    [Required, RegularExpression("saatgut|duenger|werkzeug|sonstiges", ErrorMessage = "Unbekannte Kategorie.")]
    string Category,
    Guid? PlantId,
    [Range(2000, 2100)] int? UsableUntilYear,
    [MaxLength(2000)] string? Notes
);

public record InventoryItemResponse(
    Guid Id,
    string Name,
    string? Quantity,
    string Category,
    Guid? PlantId,
    string? PlantName,
    int? UsableUntilYear,
    string? Notes,
    DateTimeOffset UpdatedAt
);
