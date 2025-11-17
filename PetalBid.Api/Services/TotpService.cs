using System.Security.Cryptography;
using System.Text;

namespace PetalBid.Api.Services;

public interface ITotpService
{
	string GenerateSecret();
	bool ValidateCode(string secret, string code);
	string BuildOtpAuthUri(string secret, string email, string issuer);
}

public class TotpService : ITotpService
{
	private const int StepSeconds = 30;
	private const int TotpDigits = 6;
	private static readonly char[] Base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".ToCharArray();

	public string GenerateSecret()
	{
		Span<byte> buffer = stackalloc byte[20];
		RandomNumberGenerator.Fill(buffer);
		return Base32Encode(buffer);
	}

	public bool ValidateCode(string secret, string code)
	{
		if (string.IsNullOrWhiteSpace(secret) || string.IsNullOrWhiteSpace(code))
		{
			return false;
		}

		var normalized = code.Replace(" ", string.Empty);
		if (!normalized.All(char.IsDigit))
		{
			return false;
		}

		normalized = normalized.PadLeft(TotpDigits, '0');

		var timestep = GetCurrentTimeStepNumber();

		for (long offset = -1; offset <= 1; offset++)
		{
			var expected = ComputeTotp(secret, timestep + offset);
			if (ConstantTimeEquals(expected, normalized))
			{
				return true;
			}
		}

		return false;
	}

	public string BuildOtpAuthUri(string secret, string email, string issuer)
	{
		var label = Uri.EscapeDataString($"{issuer}:{email}");
		var issuerEncoded = Uri.EscapeDataString(issuer);
		return $"otpauth://totp/{label}?secret={secret}&issuer={issuerEncoded}&digits={TotpDigits}";
	}

	private static long GetCurrentTimeStepNumber() => DateTimeOffset.UtcNow.ToUnixTimeSeconds() / StepSeconds;

	private static string ComputeTotp(string secret, long timestep)
	{
		var key = Base32Decode(secret);
		var timestampBytes = BitConverter.GetBytes(timestep);

		if (BitConverter.IsLittleEndian)
		{
			Array.Reverse(timestampBytes);
		}

		using var hmac = new HMACSHA1(key);
		var hash = hmac.ComputeHash(timestampBytes);

		int offset = hash[^1] & 0x0F;
		int binary =
			((hash[offset] & 0x7f) << 24) |
			((hash[offset + 1] & 0xff) << 16) |
			((hash[offset + 2] & 0xff) << 8) |
			(hash[offset + 3] & 0xff);

		int otp = binary % (int)Math.Pow(10, TotpDigits);
		return otp.ToString($"D{TotpDigits}");
	}

	private static bool ConstantTimeEquals(string expected, string provided)
	{
		if (expected.Length != provided.Length)
		{
			return false;
		}

		int diff = 0;
		for (int i = 0; i < expected.Length; i++)
		{
			diff |= expected[i] ^ provided[i];
		}

		return diff == 0;
	}

	private static string Base32Encode(ReadOnlySpan<byte> data)
	{
		var output = new StringBuilder((data.Length + 4) / 5 * 8);
		int buffer = 0;
		int bitsLeft = 0;

		foreach (var b in data)
		{
			buffer = (buffer << 8) | b;
			bitsLeft += 8;

			while (bitsLeft >= 5)
			{
				int index = (buffer >> (bitsLeft - 5)) & 0x1F;
				bitsLeft -= 5;
				output.Append(Base32Alphabet[index]);
			}
		}

		if (bitsLeft > 0)
		{
			int index = (buffer << (5 - bitsLeft)) & 0x1F;
			output.Append(Base32Alphabet[index]);
		}

		return output.ToString();
	}

	private static byte[] Base32Decode(string input)
	{
		if (string.IsNullOrWhiteSpace(input)) return Array.Empty<byte>();

		string sanitized = input.Trim().Replace(" ", string.Empty).ToUpperInvariant();
		var output = new List<byte>();
		int buffer = 0;
		int bitsLeft = 0;

		foreach (var c in sanitized)
		{
			int value = c switch
			{
				>= 'A' and <= 'Z' => c - 'A',
				>= '2' and <= '7' => c - '2' + 26,
				_ => throw new FormatException("Ongeldig Base32-teken.")
			};

			buffer = (buffer << 5) | value;
			bitsLeft += 5;

			if (bitsLeft >= 8)
			{
				int byteValue = (buffer >> (bitsLeft - 8)) & 0xFF;
				bitsLeft -= 8;
				output.Add((byte)byteValue);
			}
		}

		return output.ToArray();
	}
}
