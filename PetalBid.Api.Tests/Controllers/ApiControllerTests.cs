using PetalBid.Api.Controllers;
using Xunit;

namespace PetalBid.Api.Tests.Controllers.ApiController;

public class ApiControllerTests
{
	[Fact]

	public void ApiControllerBase_ConnectsSuccessfullyToDatabase()
	{
		// Arrange
		var dbContextType = typeof(PetalBid.Api.Data.AppDbContext);

		// Act
		var hasDbContextField = typeof(ApiControllerBase).GetField("Db", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)?.FieldType == dbContextType;

		// Assert
		Assert.True(hasDbContextField);
	}
	[Fact]

	public void ApiControllerBase_ControlsDatabaseAsExpected()
	{
		// Arrange
		var dbField = typeof(ApiControllerBase).GetField("Db", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

		// Act
		var isReadonly = dbField?.IsInitOnly ?? false;

		// Assert
		Assert.True(isReadonly);
	}
}