using System.ComponentModel.DataAnnotations;
using PetalBid.Api.ValidationAttributes;
using Xunit;

namespace PetalBid.Api.Tests.ValidationAttributes;

public class FutureDateAttributeTests
{
	private readonly FutureDateAttribute _attribute = new();

	[Fact]
	public void IsValid_ReturnsTrue_ForNullValue()
	{
		// Arrange
		object? value = null;

		// Act
		var result = _attribute.IsValid(value);

		// Assert
		Assert.True(result);
	}

	[Fact]
	public void IsValid_ReturnsTrue_ForFutureDate()
	{
		// Arrange
		var value = DateTime.UtcNow.AddDays(1);

		// Act
		var result = _attribute.IsValid(value);

		// Assert
		Assert.True(result);
	}

	[Fact]
	public void IsValid_ReturnsTrue_ForTodaysDate()
	{
		// Arrange
		// The attribute uses .Date comparison, so exact time today should pass
		var value = DateTime.UtcNow;

		// Act
		var result = _attribute.IsValid(value);

		// Assert
		Assert.True(result);
	}

	[Fact]
	public void IsValid_ReturnsFalse_ForPastDate()
	{
		// Arrange
		var value = DateTime.UtcNow.AddDays(-1);

		// Act
		var result = _attribute.IsValid(value);

		// Assert
		Assert.False(result);
	}

	[Fact]
	public void IsValid_ReturnsFalse_ForNonDateValue()
	{
		// Arrange
		var value = "Not a date";

		// Act
		var result = _attribute.IsValid(value);

		// Assert
		Assert.False(result);
	}
}
