using Microsoft.AspNetCore.Mvc;
using PetalBid.Api.Data;

namespace PetalBid.Api.Controllers;
/// <summary>
///  Controls the database
/// </summary>
public abstract class ApiControllerBase : ControllerBase
{
	protected readonly AppDbContext Db;

	protected ApiControllerBase(AppDbContext db)
	{
		Db = db;
	}
}
