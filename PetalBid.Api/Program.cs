using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using PetalBid.Api.Data;

namespace PetalBid.Api;

public class Program
{
	public static void Main(string[] args)
	{
		var builder = WebApplication.CreateBuilder(args);

		builder.WebHost.ConfigureKestrel(options =>
		{
			options.ListenAnyIP(5048);
		});

		builder.Services.AddDbContext<AppDbContext>(options =>
			options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

		builder.Services.AddControllers();
		builder.Services.AddAuthorization();

		// Add CORS
		builder.Services.AddCors(options =>
		{
			options.AddPolicy("AllowFrontend", policy =>
			{
				policy.WithOrigins("http://localhost:5173") // Vite default port
					.AllowAnyHeader()
					.AllowAnyMethod();
			});
		});

		builder.Services.AddEndpointsApiExplorer();
		builder.Services.AddSwaggerGen(c =>
		{
			c.SwaggerDoc("v1", new OpenApiInfo { Title = "PetalBid API", Version = "v1" });
		});

		var app = builder.Build();

		if (app.Environment.IsDevelopment())
		{
			app.UseSwagger();
			app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "PetalBid API v1"));
		}
		else
		{
			app.UseHttpsRedirection();
		}

		app.UseCors("AllowFrontend");
		app.UseAuthorization();
		app.MapControllers();

		app.Run();
	}
}
