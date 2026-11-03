import type {
  AltitudeUnit,
  PressureUnit,
  RainUnit,
  TemperatureUnit,
  WindUnit,
} from './domain'

export interface FormattedValue {
  value: string
  unit: string
}

function formatted(value: number, digits: number, unit: string): FormattedValue {
  return {
    value: Number.isFinite(value) ? value.toFixed(digits) : '—',
    unit,
  }
}

export function temperature(value: number, unit: TemperatureUnit): FormattedValue {
  return unit === 'fahrenheit'
    ? formatted((value * 9) / 5 + 32, 1, '°F')
    : formatted(value, 1, '°C')
}

export function pressure(value: number, unit: PressureUnit): FormattedValue {
  const conversions: Record<PressureUnit, [number, number, string]> = {
    hPa: [1, 1, 'hPa'],
    mmHg: [0.750061561303, 1, 'mmHg'],
    kPa: [0.1, 2, 'kPa'],
    inHg: [0.0295299830714, 2, 'inHg'],
    mb: [1, 1, 'mb'],
  }
  const [factor, digits, label] = conversions[unit]
  return formatted(value * factor, digits, label)
}

export function beaufort(knots: number): number {
  return Math.min(Math.round(((knots * 0.514444) / 0.836) ** (2 / 3)), 12)
}

export function wind(value: number, unit: WindUnit): FormattedValue {
  const conversions: Record<Exclude<WindUnit, 'B'>, [number, string]> = {
    kmh: [1.852, 'km/h'],
    mph: [1.15078, 'mph'],
    kts: [1, 'kt'],
    ms: [0.514444, 'm/s'],
  }
  if (unit === 'B') return formatted(beaufort(value), 0, 'Bft')
  const [factor, label] = conversions[unit]
  return formatted(value * factor, 1, label)
}

export function rainfall(value: number, unit: RainUnit): FormattedValue {
  return unit === 'inch' ? formatted(value * 0.0393701, 2, 'in') : formatted(value, 1, 'mm')
}

export function altitude(value: number, unit: AltitudeUnit): FormattedValue {
  const conversions: Record<AltitudeUnit, [number, string]> = {
    m: [0.3048, 'm'],
    yds: [0.333333, 'yd'],
    ft: [1, 'ft'],
  }
  const [factor, label] = conversions[unit]
  return formatted(value * factor, 0, label)
}

export function percent(value: number): FormattedValue {
  return formatted(value, 0, '%')
}
