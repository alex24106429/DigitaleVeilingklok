using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Npgsql; 
using PetalBid.Api.Data;
using PetalBid.Api.Domain.Entities;
using PetalBid.Api.Services;
using System.Text;

namespace PetalBid.Api;

public class Program
{
	public static async Task Main(string[] args)
	{
		var builder = WebApplication.CreateBuilder(args);

		// -------------------------------------------------------------------------
		// Database Configuration
		// -------------------------------------------------------------------------
		var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");

		builder.Services.AddDbContext<AppDbContext>(options =>
		{
			if (!string.IsNullOrEmpty(databaseUrl))
			{
				// PRODUCTION: Use PostgreSQL
				var databaseUri = new Uri(databaseUrl);
				var userInfo = databaseUri.UserInfo.Split(':');

				var connectionStringBuilder = new NpgsqlConnectionStringBuilder
				{
					Host = databaseUri.Host,
					Port = databaseUri.Port > 0 ? databaseUri.Port : 5432,
					Username = userInfo[0],
					Password = userInfo[1],
					Database = databaseUri.LocalPath.TrimStart('/'),
					SslMode = SslMode.Prefer
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
		// ASP.NET Core Identity Configuration
		// -------------------------------------------------------------------------
		builder.Services.AddIdentity<User, IdentityRole<int>>(options =>
		{
			// Password settings (matching previous logic)
			options.Password.RequireDigit = true;
			options.Password.RequireLowercase = true;
			options.Password.RequireNonAlphanumeric = true;
			options.Password.RequireUppercase = true;
			options.Password.RequiredLength = 8;

			// User settings
			options.User.RequireUniqueEmail = true;

			// Lockout settings
			options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
			options.Lockout.MaxFailedAccessAttempts = 5;
			options.Lockout.AllowedForNewUsers = true;
		})
		.AddEntityFrameworkStores<AppDbContext>()
		.AddDefaultTokenProviders();

		builder.Services.AddControllers();

		// Add Pwned Passwords service
		builder.Services.AddHttpClient<IPwnedPasswordsService, PwnedPasswordsService>();

		// -------------------------------------------------------------------------
		// Authentication & JWT Configuration
		// -------------------------------------------------------------------------
		builder.Services.AddAuthentication(options =>
		{
			options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
			options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
			options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
		})
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

			// Extract token from HttpOnly cookie
			options.Events = new JwtBearerEvents
			{
				OnMessageReceived = context =>
				{
					if (context.Request.Cookies.ContainsKey("jwt"))
					{
						context.Token = context.Request.Cookies["jwt"];
					}
					return Task.CompletedTask;
				}
			};
		});

		builder.Services.AddAuthorization();

		builder.Services.AddCors(options =>
		{
			options.AddPolicy("AllowFrontend", policy =>
			{
				policy.WithOrigins("http://localhost:5173", "https://petalbid.bid")
					.AllowAnyHeader()
					.AllowAnyMethod()
					.AllowCredentials(); // Required for cookies
			});
		});

		builder.Services.AddEndpointsApiExplorer();
		builder.Services.AddSwaggerGen(c =>
		{
			c.SwaggerDoc("v1", new OpenApiInfo { Title = "PetalBid API", Version = "v1" });
			c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
			{
				In = ParameterLocation.Header,
				Description = "JWT Authorization using HttpOnly Cookies (handled by browser) or Bearer",
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
						Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
					},
					Array.Empty<string>()
				}
			});
		});

		var app = builder.Build();

		// -------------------------------------------------------------------------
		// Database Initialization & Seeding
		// -------------------------------------------------------------------------
		using (var scope = app.Services.CreateScope())
		{
			var services = scope.ServiceProvider;
			var db = services.GetRequiredService<AppDbContext>();
			var roleManager = services.GetRequiredService<RoleManager<IdentityRole<int>>>();
			
			db.Database.EnsureCreated();

			// Seed Roles
			string[] roleNames = { "Admin", "Auctioneer", "Buyer", "Supplier" };
			foreach (var roleName in roleNames)
			{
				if (!await roleManager.RoleExistsAsync(roleName))
				{
					await roleManager.CreateAsync(new IdentityRole<int>(roleName));
				}
			}
		}

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
