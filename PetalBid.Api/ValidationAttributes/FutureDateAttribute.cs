using System.ComponentModel.DataAnnotations;

namespace PetalBid.Api.ValidationAttributes;

public class FutureDateAttribute : ValidationAttribute
{
	protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
	{
		if (value is DateTime dateTime)
		{
			if (dateTime > DateTime.UtcNow)
			{
				return ValidationResult.Success;
			}
			return new ValidationResult("The auction start date must be in the future.");
		}
		return new ValidationResult("Invalid date format.");
	}
}