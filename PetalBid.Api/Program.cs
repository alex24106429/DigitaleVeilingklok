using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Npgsql;
using PetalBid.Api.Data;
using PetalBid.Api.Domain.Entities;
using PetalBid.Api.Domain.Enums;
using PetalBid.Api.Hubs;
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
			options.Password.RequireDigit = true;
			options.Password.RequireLowercase = true;
			options.Password.RequireNonAlphanumeric = true;
			options.Password.RequireUppercase = true;
			options.Password.RequiredLength = 8;
			options.User.RequireUniqueEmail = true;
			options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
			options.Lockout.MaxFailedAccessAttempts = 5;
			options.Lockout.AllowedForNewUsers = true;
		})
		.AddEntityFrameworkStores<AppDbContext>()
		.AddDefaultTokenProviders();

		builder.Services.AddControllers();
		builder.Services.AddSignalR(); // Add SignalR services

		// Services
		builder.Services.AddHttpClient<IPwnedPasswordsService, PwnedPasswordsService>();
		builder.Services.AddSingleton<AuctionClockService>(); // Singleton state management for auctions

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

			options.Events = new JwtBearerEvents
			{
				OnMessageReceived = context =>
				{
					if (context.Request.Cookies.ContainsKey("jwt"))
					{
						context.Token = context.Request.Cookies["jwt"];
					}
					// Allow token in query string for SignalR connections
					var accessToken = context.Request.Query["access_token"];
					var path = context.HttpContext.Request.Path;
					if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/auctionHub"))
					{
						context.Token = accessToken;
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
					.AllowCredentials();
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

		// Database Init & Seeding
		using (var scope = app.Services.CreateScope())
		{
			var services = scope.ServiceProvider;
			var db = services.GetRequiredService<AppDbContext>();
			var roleManager = services.GetRequiredService<RoleManager<IdentityRole<int>>>();
			var userManager = services.GetRequiredService<UserManager<User>>();

			db.Database.EnsureCreated();

			// 1. Roles
			string[] roleNames = { "Admin", "Auctioneer", "Buyer", "Supplier" };
			foreach (var roleName in roleNames)
			{
				if (!await roleManager.RoleExistsAsync(roleName))
				{
					await roleManager.CreateAsync(new IdentityRole<int>(roleName));
				}
			}

			string defaultPassword = "PetalBid1!";

			// 2. Administrator
			var adminEmail = "administrator@petalbid.bid";
			var existingAdmin = await userManager.FindByEmailAsync(adminEmail);
			if (existingAdmin == null)
			{
				var adminUser = new Admin
				{
					FullName = "Administrator",
					UserName = adminEmail,
					Email = adminEmail,
					EmailConfirmed = true,
					IsDisabled = false
				};
				var createResult = await userManager.CreateAsync(adminUser, defaultPassword);
				if (createResult.Succeeded) await userManager.AddToRoleAsync(adminUser, "Admin");
			}

			// 3. Buyer
			var buyerEmail = "koper@petalbid.bid";
			var existingBuyer = await userManager.FindByEmailAsync(buyerEmail);
			if (existingBuyer == null)
			{
				var buyerUser = new Buyer
				{
					FullName = "Koper",
					UserName = buyerEmail,
					Email = buyerEmail,
					EmailConfirmed = true,
					IsDisabled = false,
					CompanyName = "Bloemenwinkel De Hoek"
				};
				var createResult = await userManager.CreateAsync(buyerUser, defaultPassword);
				if (createResult.Succeeded) await userManager.AddToRoleAsync(buyerUser, "Buyer");
			}

			// 4. Supplier
			var supplierEmail = "leverancier@petalbid.bid";
			var existingSupplier = await userManager.FindByEmailAsync(supplierEmail);
			if (existingSupplier == null)
			{
				var supplierUser = new Supplier
				{
					FullName = "Leverancier",
					UserName = supplierEmail,
					Email = supplierEmail,
					EmailConfirmed = true,
					IsDisabled = false,
					CompanyName = "Grote Kwekerij BV"
				};
				var createResult = await userManager.CreateAsync(supplierUser, defaultPassword);
				if (createResult.Succeeded) await userManager.AddToRoleAsync(supplierUser, "Supplier");
			}

			// 5. Auctioneer
			var auctioneerEmail = "veilingmeester@petalbid.bid";
			var existingAuctioneer = await userManager.FindByEmailAsync(auctioneerEmail);
			if (existingAuctioneer == null)
			{
				var auctioneerUser = new Auctioneer
				{
					FullName = "Veilingmeester",
					UserName = auctioneerEmail,
					Email = auctioneerEmail,
					EmailConfirmed = true,
					IsDisabled = false
				};
				var createResult = await userManager.CreateAsync(auctioneerUser, defaultPassword);
				if (createResult.Succeeded) await userManager.AddToRoleAsync(auctioneerUser, "Auctioneer");
			}

			// 6. Auctions
			var auctioneer = await db.Auctioneers.FirstOrDefaultAsync(a => a.Email == auctioneerEmail);
			Auction? auctionNaaldwijk = null;
			Auction? auctionAalsmeer = null;

			if (auctioneer != null)
			{
				// Ensure Naaldwijk auction exists
				auctionNaaldwijk = await db.Auctions.FirstOrDefaultAsync(a => a.ClockLocation == ClockLocation.Naaldwijk && a.AuctioneerId == auctioneer.Id);
				if (auctionNaaldwijk == null)
				{
					auctionNaaldwijk = new Auction
					{
						Description = "Veiling in Naaldwijk",
						StartsAt = DateTime.UtcNow.AddMinutes(30),
						ClockLocation = ClockLocation.Naaldwijk,
						Status = AuctionStatus.Pending,
						AuctioneerId = auctioneer.Id
					};
					db.Auctions.Add(auctionNaaldwijk);
				}

				// Ensure Aalsmeer auction exists
				auctionAalsmeer = await db.Auctions.FirstOrDefaultAsync(a => a.ClockLocation == ClockLocation.Aalsmeer && a.AuctioneerId == auctioneer.Id);
				if (auctionAalsmeer == null)
				{
					auctionAalsmeer = new Auction
					{
						Description = "Veiling in Aalsmeer",
						StartsAt = DateTime.UtcNow.AddHours(1),
						ClockLocation = ClockLocation.Aalsmeer,
						Status = AuctionStatus.Pending,
						AuctioneerId = auctioneer.Id
					};
					db.Auctions.Add(auctionAalsmeer);
				}

				await db.SaveChangesAsync();
			}

			// 7. Plants (Products)
			var supplier = await db.Suppliers.FirstOrDefaultAsync(s => s.Email == supplierEmail);
			if (supplier != null && !await db.Products.AnyAsync(p => p.SupplierId == supplier.Id))
			{
				var products = new List<Product>
				{
					new Product {
						Name = "Roos", Species = "Rosa", Weight = 0.1, Stock = 1000, MinimumPrice = 0.50,
						SupplierId = supplier.Id, ImageBase64 = "/images/plants/rose.avif",
						AuctionId = auctionNaaldwijk?.Id,
						MaxPricePerUnit = 2.00
					},
					new Product {
						Name = "Tulp", Species = "Tulipa", Weight = 0.05, Stock = 2000, MinimumPrice = 0.30,
						SupplierId = supplier.Id, ImageBase64 = "/images/plants/tulip.avif",
						AuctionId = auctionNaaldwijk?.Id,
						MaxPricePerUnit = 1.00
					},
					new Product {
						Name = "Orchidee", Species = "Phalaenopsis", Weight = 0.5, Stock = 500, MinimumPrice = 5.00,
						SupplierId = supplier.Id, ImageBase64 = "/images/plants/orchid.avif",
						AuctionId = auctionAalsmeer?.Id,
						MaxPricePerUnit = 10.00
					},
					new Product {
						Name = "Lelie", Species = "Lilium", Weight = 0.2, Stock = 800, MinimumPrice = 0.80,
						SupplierId = supplier.Id, ImageBase64 = "/images/plants/lily.avif",
						AuctionId = auctionAalsmeer?.Id,
						MaxPricePerUnit = 2.50
					}
				};
				db.Products.AddRange(products);
				await db.SaveChangesAsync();
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
		app.MapHub<AuctionHub>("/api/auctionHub");

		app.Run();
	}
}
