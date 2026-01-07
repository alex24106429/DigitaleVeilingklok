using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using PetalBid.Api.Services;
using System.Security.Claims;

namespace PetalBid.Api.Hubs;

[Authorize]
public class AuctionHub(AuctionClockService auctionClockService) : Hub
{
	private readonly AuctionClockService _auctionClockService = auctionClockService;

	public async Task JoinAuctionGroup(int auctionId)
	{
		await Groups.AddToGroupAsync(Context.ConnectionId, $"auction-{auctionId}");

		// Send current state to the joining client
		var state = _auctionClockService.GetAuctionState(auctionId);
		if (state != null)
		{
			await Clients.Caller.SendAsync("AuctionState", state);
		}
	}

	public async Task LeaveAuctionGroup(int auctionId)
	{
		await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"auction-{auctionId}");
	}

	public async Task PlaceBid(int auctionId, int quantity)
	{
		var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
		var userEmail = Context.User?.FindFirstValue(ClaimTypes.Email);
		var userName = Context.User?.FindFirstValue("name") ?? userEmail; // Fallback

		if (userId == null) return;

		// Delegate logic to the singleton service which manages the state/db
		var result = await _auctionClockService.ProcessBidAsync(auctionId, int.Parse(userId), userName!, quantity);

		if (!result.Success)
		{
			await Clients.Caller.SendAsync("BidRejected", result.Message);
		}
	}
}
