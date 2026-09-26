using System.Text;
using System.Threading.RateLimiting;
using Gartengeist.Api.Data;
using Gartengeist.Api.Models.Entities;
using Gartengeist.Api.Repositories;
using Gartengeist.Api.Repositories.Interfaces;
using Gartengeist.Api.Services;
using Gartengeist.Api.Services.Interfaces;
using Gartengeist.Api.Services.Weather;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

DotNetEnv.Env.TraversePath().Load();

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("Connection string 'Default' not found.");

builder.Services.AddDbContext<GartengeistDbContext>(options =>
    options.UseNpgsql(connectionString));

var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtOptions = jwtSection.Get<JwtOptions>() ?? new JwtOptions();
if (Encoding.UTF8.GetByteCount(jwtOptions.Key) < 32)
    throw new InvalidOperationException("Jwt:Key fehlt oder ist kürzer als 32 Bytes (siehe .env.example).");
builder.Services.Configure<JwtOptions>(jwtSection);

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key))
        };
    });

// Alles erfordert Login, außer explizit [AllowAnonymous]
builder.Services.AddAuthorizationBuilder()
    .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());

builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

// Schutz gegen Passwort-Raten: max. 10 Login-/Registrierungsversuche pro Minute und IP
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unbekannt",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1) }));
});

// Hinter dem Reverse Proxy (Caddy) die echte Client-IP übernehmen; der Proxy ist nur im Docker-Netz erreichbar
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IGardenRepository, GardenRepository>();
builder.Services.AddScoped<IAreaRepository, AreaRepository>();
builder.Services.AddScoped<IPlantRepository, PlantRepository>();
builder.Services.AddScoped<IPlantingRepository, PlantingRepository>();
builder.Services.AddScoped<IJournalRepository, JournalRepository>();
builder.Services.AddScoped<ITaskRepository, TaskRepository>();
builder.Services.AddScoped<IShoppingRepository, ShoppingRepository>();
builder.Services.AddScoped<IInventoryRepository, InventoryRepository>();

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IGardenService, GardenService>();
builder.Services.AddScoped<IAreaService, AreaService>();
builder.Services.AddScoped<IPlantService, PlantService>();
builder.Services.AddScoped<IPlantingService, PlantingService>();
builder.Services.AddScoped<IJournalService, JournalService>();
builder.Services.AddSingleton<PhotoStorage>();
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<IShoppingService, ShoppingService>();
builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<FrostDateService>();
builder.Services.AddScoped<TaskGenerator>();
builder.Services.AddScoped<WateringService>();
builder.Services.AddScoped<RecommendationService>();
builder.Services.AddHostedService<AutomationWorker>();
builder.Services.AddSingleton<GeocodingService>();
builder.Services.AddScoped<IWeatherService, WeatherService>();
builder.Services.AddSingleton<IWeatherProvider, OpenMeteoWeatherProvider>();
builder.Services.AddMemoryCache();

builder.Services.AddHttpClient("openmeteo", c =>
{
    c.BaseAddress = new Uri("https://api.open-meteo.com/");
    c.Timeout = TimeSpan.FromSeconds(10);
});
builder.Services.AddHttpClient("openmeteo-archive", c =>
{
    c.BaseAddress = new Uri("https://archive-api.open-meteo.com/");
    c.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddHttpClient("nominatim", c =>
{
    c.BaseAddress = new Uri("https://nominatim.openstreetmap.org/");
    c.Timeout = TimeSpan.FromSeconds(10);
    c.DefaultRequestHeaders.UserAgent.TryParseAdd("Gartengeist/1.0 (private garden app)");
});

builder.Services.AddControllers();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<GartengeistDbContext>();
    await db.Database.MigrateAsync();
    await PlantCatalogSeeder.SeedAsync(db, app.Logger);
}

app.UseForwardedHeaders();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/health", async (GartengeistDbContext db) =>
{
    var canConnect = await db.Database.CanConnectAsync();
    return canConnect
        ? Results.Ok(new { status = "healthy" })
        : Results.Problem("Datenbankverbindung fehlgeschlagen");
}).AllowAnonymous();

app.Run();
