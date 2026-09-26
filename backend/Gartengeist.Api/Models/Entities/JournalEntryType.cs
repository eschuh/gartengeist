namespace Gartengeist.Api.Models.Entities;

public enum JournalEntryType
{
    Notiz,
    Gegossen,
    Geduengt,
    Gejaetet,
    // Wird beim Abräumen einer Kultur automatisch angelegt
    Abgeraeumt,
    Geerntet
}
