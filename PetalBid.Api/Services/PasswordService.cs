using System.Security.Cryptography;

namespace PetalBid.Api.Services;

public static class PasswordService
{
	private const int SaltSize = 16; // 128 bit 
	private const int KeySize = 32; // 256 bit
	private const int Iterations = 10000;
	private const int MinimumPasswordLength = 8;

	public static string HashPassword(string password)
	{
		using var algorithm = new Rfc2898DeriveBytes(
			password,
			SaltSize,
			Iterations,
			HashAlgorithmName.SHA256);

		var key = Convert.ToBase64String(algorithm.GetBytes(KeySize));
		var salt = Convert.ToBase64String(algorithm.Salt);

		return $"{Iterations}.{salt}.{key}";
	}

	public static (bool IsValid, string ErrorMessage) ValidatePasswordRequirements(string password)
	{
		if (string.IsNullOrWhiteSpace(password))
		{
			return (false, "Wachtwoord mag niet leeg zijn.");
		}

		var errors = new List<string>();

		if (password.Length < MinimumPasswordLength)
		{
			errors.Add($"minimaal {MinimumPasswordLength} karakters bevatten");
		}
		if (!password.Any(char.IsUpper))
		{
			errors.Add("minimaal één hoofdletter bevatten");
		}
		if (!password.Any(char.IsLower))
		{
			errors.Add("minimaal één kleine letter bevatten");
		}
		if (!password.Any(char.IsDigit))
		{
			errors.Add("minimaal één cijfer bevatten");
		}
		if (!password.Any(c => !char.IsLetterOrDigit(c)))
		{
			errors.Add("minimaal één speciaal teken bevatten (bv. !, @, #)");
		}

		if (errors.Count == 0)
		{
			return (true, string.Empty);
		}

		return (false, $"Wachtwoord moet {string.Join(", ", errors)}.");
	}

	public static bool VerifyPassword(string hash, string password)
	{
		var parts = hash.Split('.', 3);

		if (parts.Length != 3)
			return false;

		var iterations = Convert.ToInt32(parts[0]);
		var salt = Convert.FromBase64String(parts[1]);
		var key = Convert.FromBase64String(parts[2]);

		using var algorithm = new Rfc2898DeriveBytes(
			password,
			salt,
			iterations,
			HashAlgorithmName.SHA256);

		var keyToCheck = algorithm.GetBytes(KeySize);
		var verified = keyToCheck.Length == key.Length;

		for (int i = 0; i < keyToCheck.Length && i < key.Length; i++)
		{
			verified &= keyToCheck[i] == key[i];
		}

		return verified;
	}
}