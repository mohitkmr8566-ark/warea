// lib/logistics.ts

export type Zone = 'METRO' | 'NON_METRO' | 'REMOTE';

export function zoneFromPincode(pincode: string): Zone {
  // ⚠️ Simple mock logic — you can expand this with real serviceable pincodes later.
  const metroPrefixes = ['11', '40', '56', '60']; // example: Delhi, Mumbai, Bangalore, Chennai
  const prefix = pincode.substring(0, 2);
  if (metroPrefixes.includes(prefix)) return 'METRO';
  if (parseInt(prefix) >= 10 && parseInt(prefix) <= 70) return 'NON_METRO';
  return 'REMOTE';
}

export function etaRange(zone: Zone, from: Date = new Date()) {
  const addDays = (days: number) => new Date(from.getTime() + days * 86400000);

  switch (zone) {
    case 'METRO':
      return { start: addDays(2), end: addDays(3) };
    case 'NON_METRO':
      return { start: addDays(4), end: addDays(6) };
    default:
      return { start: addDays(6), end: addDays(9) };
  }
}
