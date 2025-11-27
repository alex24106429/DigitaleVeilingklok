using System.ComponentModel.DataAnnotations;
using PetalBid.Api.DTOs;
using Xunit;

namespace PetalBid.Api.DTOs.Tests;

public class ChangePasswordDtoTests
{
    [Fact]
    public void ChangePasswordDto_ShouldHaveRequiredAttributes()
    {
        // Arrange
        var dtoType = typeof(ChangePasswordDto);

        // Act
        var currentPasswordProp = dtoType.GetProperty("CurrentPassword");
        var newPasswordProp = dtoType.GetProperty("NewPassword");

        // Assert
        Assert.NotNull(currentPasswordProp);
        Assert.NotNull(newPasswordProp);

        var currentPasswordAttrs = currentPasswordProp.GetCustomAttributes(typeof(System.ComponentModel.DataAnnotations.RequiredAttribute), false);
        var newPasswordAttrs = newPasswordProp.GetCustomAttributes(typeof(System.ComponentModel.DataAnnotations.RequiredAttribute), false);

        Assert.Single(currentPasswordAttrs);
        Assert.Single(newPasswordAttrs);
    }
    [Fact]
    public void ChangePasswordDto_ValidatesSuccessfully()
    {
        // Arrange
        var dto = new ChangePasswordDto
        {
            CurrentPassword = "OldPassword123!",
            NewPassword = "NewPassword123!"
        };
        var context = new ValidationContext(dto, null, null);
        var results = new List<ValidationResult>();

        // Act
        var isValid = Validator.TryValidateObject(dto, context, results, true);
        // Assert
        Assert.True(isValid);   
        Assert.Empty(results);
    }
   
}
