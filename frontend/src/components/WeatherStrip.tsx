import { FROST_RISK_TEMP, weatherInfo, weekdayLabel, type WeatherForecast } from '../api/weather'

const fmt = (n: number | null) => (n === null ? '–' : Math.round(n).toString())

export default function WeatherStrip({ forecast }: { forecast: WeatherForecast }) {
  const hasFallback = forecast.days.some((d) => d.source === 'open-meteo')

  return (
    <div>
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {forecast.days.map((day, i) => {
          const info = weatherInfo(day.weatherCode)
          const frost = day.tempMin !== null && day.tempMin <= FROST_RISK_TEMP
          return (
            <li
              key={day.date}
              className={`flex w-16 shrink-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-center ${
                frost ? 'bg-sky-500/15' : 'bg-surface'
              } ${day.source === 'open-meteo' ? 'opacity-70' : ''}`}
            >
              <span className="text-xs font-medium text-heading">{weekdayLabel(day.date, i)}</span>
              <span className="text-2xl" role="img" aria-label={info.label}>
                {info.icon}
              </span>
              <span className="text-sm font-semibold text-heading">{fmt(day.tempMax)}°</span>
              <span className={`text-xs ${frost ? 'font-semibold text-sky-600 dark:text-sky-400' : ''}`}>
                {fmt(day.tempMin)}°
              </span>
              <span className="text-[11px]">
                {day.precipitationMm !== null && day.precipitationMm >= 0.5
                  ? `${day.precipitationMm.toLocaleString('de-DE', { maximumFractionDigits: 0 })} mm`
                  : day.sunshineHours !== null
                    ? `${Math.round(day.sunshineHours)} h ☀`
                    : ' '}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="mt-2 text-[11px]">
        Prognose: MeteoSchweiz (ICON-CH) via Open-Meteo
        {hasFallback && ' · blasse Tage: globales Modell, weniger genau'}
      </p>
    </div>
  )
}
