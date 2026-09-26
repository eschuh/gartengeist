namespace Gartengeist.Api.Services;

// Läuft im Hintergrund: Frostdaten aktuell halten und automatische Aufgaben erzeugen
public class AutomationWorker(IServiceScopeFactory scopeFactory, ILogger<AutomationWorker> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                await scope.ServiceProvider.GetRequiredService<FrostDateService>().EnsureAsync();
                await scope.ServiceProvider.GetRequiredService<TaskGenerator>()
                    .GenerateAsync(DateOnly.FromDateTime(DateTime.Today));
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "Automatisierung fehlgeschlagen");
            }

            await Task.Delay(Interval, stoppingToken);
        }
    }
}
