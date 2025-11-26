using PetalBid.Api.Services;
using Xunit;

namespace PetalBid.Api.Tests.Services;

public class PasswordServiceTests
{
	[Fact]
	public void HashPassword_ShouldReturnStringWithThreeParts()
	{
		// Arrange
		string password = "TestPassword123!";

		// Act
		string hash = PasswordService.HashPassword(password);

		// Assert
		Assert.NotNull(hash);
		var parts = hash.Split('.');
		Assert.Equal(3, parts.Length); // Iterations.Salt.Key
	}

	[Fact]
	public void VerifyPassword_ShouldReturnTrue_ForCorrectPassword()
	{
		// Arrange
		string password = "MySecretPassword";
		string hash = PasswordService.HashPassword(password);

		// Act
		bool result = PasswordService.VerifyPassword(hash, password);

		// Assert
		Assert.True(result);
	}

	[Fact]
	public void ValidatePasswordRequirements_ShouldFail_WhenPasswordIsTooShort()
	{
		// Arrange
		string weakPassword = "Short1!";

		// Act
		var (isValid, errorMessage) = PasswordService.ValidatePasswordRequirements(weakPassword);

		// Assert
		Assert.False(isValid);
		Assert.Contains("minimaal 8 karakters", errorMessage);
	}

	[Fact]
	public void ValidatePasswordRequirements_ShouldPass_ForStrongPassword()
	{
		// Arrange
		string strongPassword = "StrongPassword123!";

		// Act
		var (isValid, errorMessage) = PasswordService.ValidatePasswordRequirements(strongPassword);

		// Assert
		Assert.True(isValid);
		Assert.Empty(errorMessage);
	}
}
