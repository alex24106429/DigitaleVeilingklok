using System.Net;
using Moq;
using Moq.Protected;
using PetalBid.Api.Services;
using Xunit;

namespace PetalBid.Api.Tests.Services;

public class PwnedPasswordsServiceTests
{
	[Fact]
	public async Task IsPasswordPwnedAsync_ReturnsFalse_IfPasswordIsEmpty()
	{
		// Arrange
		var mockHandler = new Mock<HttpMessageHandler>();
		var client = new HttpClient(mockHandler.Object);
		var service = new PwnedPasswordsService(client);

		// Act
		var result = await service.IsPasswordPwnedAsync("");

		// Assert
		Assert.False(result);
	}

	[Fact]
	public async Task IsPasswordPwnedAsync_ReturnsTrue_WhenHashIsFoundInResponse()
	{
		// Arrange
		// Password "password" -> SHA1: 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
		// Prefix: 5BAA6
		// Suffix: 1E4C9B93F3F0682250B6CF8331B7EE68FD8

		var mockHandler = new Mock<HttpMessageHandler>();

		mockHandler.Protected()
			.Setup<Task<HttpResponseMessage>>(
				"SendAsync",
				ItExpr.Is<HttpRequestMessage>(r => r.RequestUri!.ToString().Contains("range/5BAA6")),
				ItExpr.IsAny<CancellationToken>()
			)
			.ReturnsAsync(new HttpResponseMessage
			{
				StatusCode = HttpStatusCode.OK,
				Content = new StringContent("ABCDE12345:1\r\n1E4C9B93F3F0682250B6CF8331B7EE68FD8:5000\r\nFGHIJ67890:2")
			});

		var client = new HttpClient(mockHandler.Object) { BaseAddress = new Uri("https://api.pwnedpasswords.com/") };
		var service = new PwnedPasswordsService(client);

		// Act
		var result = await service.IsPasswordPwnedAsync("password");

		// Assert
		Assert.True(result);
	}

	[Fact]
	public async Task IsPasswordPwnedAsync_ReturnsFalse_WhenHashIsNotFound()
	{
		// Arrange
		var mockHandler = new Mock<HttpMessageHandler>();

		mockHandler.Protected()
			.Setup<Task<HttpResponseMessage>>(
				"SendAsync",
				ItExpr.IsAny<HttpRequestMessage>(),
				ItExpr.IsAny<CancellationToken>()
			)
			.ReturnsAsync(new HttpResponseMessage
			{
				StatusCode = HttpStatusCode.OK,
				Content = new StringContent("ABCDE12345:1\r\nFGHIJ67890:2")
			});

		var client = new HttpClient(mockHandler.Object) { BaseAddress = new Uri("https://api.pwnedpasswords.com/") };
		var service = new PwnedPasswordsService(client);

		// Act
		var result = await service.IsPasswordPwnedAsync("SomeRandomSecurePassword123!");

		// Assert
		Assert.False(result);
	}

	[Fact]
	public async Task IsPasswordPwnedAsync_ReturnsFalse_WhenApiFails_FailSafe()
	{
		// Arrange
		var mockHandler = new Mock<HttpMessageHandler>();

		mockHandler.Protected()
			.Setup<Task<HttpResponseMessage>>(
				"SendAsync",
				ItExpr.IsAny<HttpRequestMessage>(),
				ItExpr.IsAny<CancellationToken>()
			)
			.ReturnsAsync(new HttpResponseMessage
			{
				StatusCode = HttpStatusCode.InternalServerError
			});

		var client = new HttpClient(mockHandler.Object) { BaseAddress = new Uri("https://api.pwnedpasswords.com/") };
		var service = new PwnedPasswordsService(client);

		// Act
		var result = await service.IsPasswordPwnedAsync("password");

		// Assert
		Assert.False(result);
	}
}
