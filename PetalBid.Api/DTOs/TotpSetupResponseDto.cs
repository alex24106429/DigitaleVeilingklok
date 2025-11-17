namespace PetalBid.Api.DTOs;

public class TotpSetupResponseDto
{
	public string Secret { get; set; } = string.Empty;
	public string OtpauthUrl { get; set; } = string.Empty;
}