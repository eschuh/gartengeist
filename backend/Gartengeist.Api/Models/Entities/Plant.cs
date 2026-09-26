using System.ComponentModel.DataAnnotations.Schema;

namespace Gartengeist.Api.Models.Entities;

// Eintrag im Pflanzen-Katalog. Monatsfenster: 1–12; von > bis bedeutet über den Jahreswechsel (z.B. 10–3).
[Table("pflanze")]
public class Plant
{
    [Column("id")]
    public Guid Id { get; set; }

    // Stabiler Schlüssel aus den Seed-Daten, z.B. "tomate"; Mischkultur verweist darauf
    [Column("schluessel")]
    public string Key { get; set; } = string.Empty;

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("lateinisch")]
    public string? LatinName { get; set; }

    [Column("familie")]
    public string Family { get; set; } = string.Empty;

    [Column("kategorie")]
    public string Category { get; set; } = string.Empty;

    [Column("voranzucht_von")]
    public int? PreCultivationFrom { get; set; }

    [Column("voranzucht_bis")]
    public int? PreCultivationTo { get; set; }

    [Column("direktsaat_von")]
    public int? DirectSowingFrom { get; set; }

    [Column("direktsaat_bis")]
    public int? DirectSowingTo { get; set; }

    [Column("auspflanzen_von")]
    public int? PlantingOutFrom { get; set; }

    [Column("auspflanzen_bis")]
    public int? PlantingOutTo { get; set; }

    [Column("ernte_von")]
    public int? HarvestFrom { get; set; }

    [Column("ernte_bis")]
    public int? HarvestTo { get; set; }

    [Column("voranzucht_wochen")]
    public int? PreCultivationWeeks { get; set; }

    // Ab Auspflanzen (vorgezogene Kulturen) bzw. ab Aussaat (Direktsaat)
    [Column("tage_bis_ernte")]
    public int? DaysToHarvest { get; set; }

    [Column("pflanzabstand_cm")]
    public int? PlantSpacingCm { get; set; }

    [Column("reihenabstand_cm")]
    public int? RowSpacingCm { get; set; }

    // stark | mittel | schwach (Stark-/Mittel-/Schwachzehrer)
    [Column("naehrstoffbedarf")]
    public string NutrientDemand { get; set; } = string.Empty;

    // hoch | mittel | niedrig
    [Column("wasserbedarf")]
    public string WaterDemand { get; set; } = string.Empty;

    [Column("frostempfindlich")]
    public bool FrostSensitive { get; set; }

    [Column("mehrjaehrig")]
    public bool Perennial { get; set; }

    [Column("mischkultur_gut")]
    public string[] GoodCompanions { get; set; } = [];

    [Column("mischkultur_schlecht")]
    public string[] BadCompanions { get; set; } = [];

    [Column("hinweis")]
    public string? Note { get; set; }

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTimeOffset UpdatedAt { get; set; }
}
