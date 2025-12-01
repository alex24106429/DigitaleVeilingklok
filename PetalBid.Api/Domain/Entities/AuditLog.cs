using System;

namespace PetalBid.Api.Domain.Entities;

public class AuditLog
{
    public int Id { get; set; }
    public string TableName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty; // Added/Modified/Deleted
    public string KeyValues { get; set; } = string.Empty; // JSON object of PK values
    public string? OldValues { get; set; } // JSON
    public string? NewValues { get; set; } // JSON
    public DateTime TimestampUtc { get; set; }
}
