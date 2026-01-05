using System.ComponentModel.DataAnnotations;

namespace PetalBid.Api.ValidationAttributes;

public class FutureDateAttribute : ValidationAttribute
{
	protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
	{
		// Allow null values (optional fields)
		if (value is null)
		{
			return ValidationResult.Success;
		}

		if (value is DateTime dateTime)
		{
			// Compare date-only to avoid timezone issues; allow today and future
			if (dateTime.Date >= DateTime.UtcNow.Date)
			{
				return ValidationResult.Success;
			}
			return new ValidationResult("Date must be in the future.");
		}

		return new ValidationResult("Invalid date format.");
	}
}