using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using PetalBid.Api.Data;
using PetalBid.Api.Services;
using System.Text;

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

		// Add Pwned Passwords service with IHttpClientFactory
		builder.Services.AddHttpClient<IPwnedPasswordsService, PwnedPasswordsService>();

		// Add Authentication Services
		builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
			.AddJwtBearer(options =>
			{
				options.TokenValidationParameters = new TokenValidationParameters
				{
					ValidateIssuer = true,
					ValidateAudience = true,
					ValidateLifetime = true,
					ValidateIssuerSigningKey = true,
					ValidIssuer = builder.Configuration["Jwt:Issuer"],
					ValidAudience = builder.Configuration["Jwt:Audience"],
					IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
				};
			});

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

			// Add JWT Authentication to Swagger
			c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
			{
				In = ParameterLocation.Header,
				Description = "Please enter a valid token",
				Name = "Authorization",
				Type = SecuritySchemeType.Http,
				BearerFormat = "JWT",
				Scheme = "Bearer"
			});
			c.AddSecurityRequirement(new OpenApiSecurityRequirement
			{
				{
					new OpenApiSecurityScheme
					{
						Reference = new OpenApiReference
						{
							Type = ReferenceType.SecurityScheme,
							Id = "Bearer"
						}
					},
					new string[]{}
				}
			});
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

		app.UseAuthentication();
		app.UseAuthorization();

		app.MapControllers();

		app.Run();
	}
}
