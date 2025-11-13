using Microsoft.AspNetCore.Mvc;
using PetalBid.Api.Data;

namespace PetalBid.Api.Controllers;

// Basiscontroller voor API-controllers die de AppDbContext gebruiken.
public abstract class ApiControllerBase : ControllerBase
{
	protected readonly AppDbContext Db;

	protected ApiControllerBase(AppDbContext db)
	{
		Db = db;
	}
}
