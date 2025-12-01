using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using PetalBid.Api.Data;
using PetalBid.Api.Domain.Entities;
using Xunit;

namespace PetalBid.Api.Tests.Services;

public class AuditLoggingTests
{
    [Fact]
    public async Task SaveChanges_CreatesAuditLog_ForAddedSupplier()
    {
        var dbFile = Path.Combine(Path.GetTempPath(), $"petalbid_audit_test_{Guid.NewGuid()}.db");
        var connectionString = $"Data Source={dbFile}";

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connectionString)
            .Options;

        // Ensure a fresh database file
        if (File.Exists(dbFile)) File.Delete(dbFile);

        using (var ctx = new AppDbContext(options))
        {
            ctx.Database.EnsureCreated();

            var supplier = new Supplier
            {
                FullName = "Audit Test Supplier",
                Email = "audit@example.test",
                PasswordHash = "hash",
                CompanyName = "AuditCo"
            };

            ctx.Suppliers.Add(supplier);
            await ctx.SaveChangesAsync();

            // Read the audit entries
            var audits = ctx.AuditLogs.OrderBy(a => a.Id).ToList();
            Assert.NotEmpty(audits);

            var audit = audits.Last();

            // Basic assertions
            Assert.Equal("Added", audit.Action);
            Assert.False(string.IsNullOrWhiteSpace(audit.KeyValues));
            Assert.False(string.IsNullOrWhiteSpace(audit.NewValues));

            // Print the audit to test output so you can inspect it
            Console.WriteLine("--- Audit Entry ---");
            Console.WriteLine($"Id: {audit.Id}");
            Console.WriteLine($"Table: {audit.TableName}");
            Console.WriteLine($"Action: {audit.Action}");
            Console.WriteLine($"KeyValues: {audit.KeyValues}");
            Console.WriteLine($"NewValues: {audit.NewValues}");
            Console.WriteLine($"TimestampUtc: {audit.TimestampUtc:O}");
            Console.WriteLine("-------------------");
        }

        // cleanup
        try { if (File.Exists(dbFile)) File.Delete(dbFile); } catch { }
    }
}
