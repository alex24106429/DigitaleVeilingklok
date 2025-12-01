using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Npgsql;
using PetalBid.Api.Data;
using PetalBid.Api.Services;
using System.Text;

namespace PetalBid.Api;

public class Program
{
	public static void Main(string[] args)
	{
		var builder = WebApplication.CreateBuilder(args);

		// -------------------------------------------------------------------------
		// Database Configuration: SQLite (Local) vs PostgreSQL (Production)
		// -------------------------------------------------------------------------
		// Render and other cloud providers set 'DATABASE_URL' automatically.
		var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");

		builder.Services.AddDbContext<AppDbContext>(options =>
		{
			if (!string.IsNullOrEmpty(databaseUrl))
			{
				// PRODUCTION: Use PostgreSQL
				// We must parse the connection URL (postgres://user:pass@host/db) 
				// into a format .NET accepts.
				var databaseUri = new Uri(databaseUrl);
				var userInfo = databaseUri.UserInfo.Split(':');

				var connectionStringBuilder = new NpgsqlConnectionStringBuilder
				{
					Host = databaseUri.Host,
					Port = databaseUri.Port,
					Username = userInfo[0],
					Password = userInfo[1],
					Database = databaseUri.LocalPath.TrimStart('/'),
					SslMode = SslMode.Prefer // Usually required by cloud providers
				};

				options.UseNpgsql(connectionStringBuilder.ToString());
			}
			else
			{
				// LOCAL DEVELOPMENT: Use SQLite
				options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection"));
			}
		});
		// -------------------------------------------------------------------------

		builder.Services.AddControllers();

		// Add Pwned Passwords service with IHttpClientFactory
		builder.Services.AddHttpClient<IPwnedPasswordsService, PwnedPasswordsService>();
		builder.Services.AddSingleton<ITotpService, TotpService>();

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
				// Note: When you deploy your frontend, you might need to add that URL here too
				// e.g., .WithOrigins("http://localhost:5173", "https://your-frontend.onrender.com")
				policy.WithOrigins("http://localhost:5173") 
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

		// -------------------------------------------------------------------------
		// Database Initialization
		// -------------------------------------------------------------------------
		// This block ensures the database tables are created automatically when the app starts.
		// This is critical for the cloud deployment to create the Postgres schema.
		using (var scope = app.Services.CreateScope())
		{
			var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
			
			// This creates tables if they don't exist.
			// It bypasses migration history, which is fine for this hybrid setup.
			db.Database.EnsureCreated();
		}
		// -------------------------------------------------------------------------

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
