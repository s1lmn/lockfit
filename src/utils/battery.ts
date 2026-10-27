export type BatteryInstruction = {
  title: string;
  bullets: string[];
};

const instructionsByManufacturer: Record<string, BatteryInstruction> = {
  xiaomi: {
    title: 'Xiaomi / MIUI',
    bullets: [
      'Open Settings -> Apps -> Manage apps -> LockFit -> Battery saver.',
      'Choose No restrictions.',
      'Open Recent apps, long-press LockFit, and tap the lock icon so MIUI does not kill it.',
    ],
  },
  samsung: {
    title: 'Samsung',
    bullets: [
      'Open Settings -> Battery -> Background usage limits.',
      'Add LockFit to Never sleeping apps.',
      'Check Settings -> Apps -> LockFit -> Battery and allow unrestricted background work if shown.',
    ],
  },
  huawei: {
    title: 'Huawei',
    bullets: [
      'Open Settings -> Battery -> App launch.',
      'Find LockFit and disable automatic management.',
      'Enable Auto-launch, Secondary launch, and Run in background.',
    ],
  },
  oppo: {
    title: 'OPPO / ColorOS',
    bullets: [
      'Open Settings -> Apps -> App management -> LockFit -> Battery usage.',
      'Allow background activity.',
      'If a performance mode prompt appears, choose the option that keeps the app alive.',
    ],
  },
  vivo: {
    title: 'vivo / Funtouch OS',
    bullets: [
      'Open Settings -> Battery -> Background high power consumption.',
      'Allow LockFit to keep running in background.',
      'Also check iManager power settings if the phone still closes the app.',
    ],
  },
  oneplus: {
    title: 'OnePlus / OxygenOS',
    bullets: [
      'Open Settings -> Battery -> Battery optimization.',
      'Select LockFit and set it to Don’t optimize.',
      'If available, also allow Auto-launch in app management.',
    ],
  },
  generic: {
    title: 'Android (generic steps)',
    bullets: [
      'Open Settings -> Apps -> LockFit -> Battery.',
      'Set background access to Unrestricted or Don’t optimize.',
      'If the phone has a vendor-specific power manager, add LockFit to the allowlist there too.',
    ],
  },
};

export function getBatteryInstruction(manufacturer: string): BatteryInstruction {
  const key = manufacturer.trim().toLowerCase();
  return instructionsByManufacturer[key] ?? instructionsByManufacturer.generic;
}
