using System.Security.Cryptography;
using System.Text;

namespace PetalBid.Api.Services;

public interface IPwnedPasswordsService
{
	Task<bool> IsPasswordPwnedAsync(string password);
}

public class PwnedPasswordsService : IPwnedPasswordsService
{
	private readonly HttpClient _httpClient;

	public PwnedPasswordsService(HttpClient httpClient)
	{
		_httpClient = httpClient;
		_httpClient.BaseAddress = new Uri("https://api.pwnedpasswords.com/");
	}

	public async Task<bool> IsPasswordPwnedAsync(string password)
	{
		if (string.IsNullOrEmpty(password))
		{
			return false;
		}

		try
		{
			// 1. Hash the password using SHA-1
			byte[] passwordBytes = Encoding.UTF8.GetBytes(password);
			byte[] hashBytes = SHA1.HashData(passwordBytes);
			string hashString = Convert.ToHexString(hashBytes);

			// 2. Split the hash into a 5-char prefix and the suffix
			string hashPrefix = hashString.Substring(0, 5);
			string hashSuffix = hashString.Substring(5);

			// 3. Call the API using the prefix for k-Anonymity
			var response = await _httpClient.GetAsync($"range/{hashPrefix}");

			if (!response.IsSuccessStatusCode)
			{
				// If the API call fails, we can't confirm, so fail safe (allow password).
				return false;
			}

			// 4. Efficiently read the response stream and check for the suffix
			using var responseStream = await response.Content.ReadAsStreamAsync();
			using var reader = new StreamReader(responseStream);

			string? line;
			while ((line = await reader.ReadLineAsync()) != null)
			{
				// The API returns lines in the format SUFFIX:COUNT
				if (line.StartsWith(hashSuffix, StringComparison.OrdinalIgnoreCase))
				{
					return true; // Pwned! The suffix was found.
				}
			}
		}
		catch (Exception)
		{
			// Log the exception. Fail safe by allowing the password if the check service is down.
			return false;
		}

		return false; // Not pwned. The suffix was not found.
	}
}
