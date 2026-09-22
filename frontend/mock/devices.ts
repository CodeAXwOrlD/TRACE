import type { DeviceProfile } from "@/lib/types";

export const devices: DeviceProfile[] = [
  {
    id: "DEV-8819",
    deviceType: "mobile_ios",
    deviceInfo: "iPhone 15 Pro / iOS 17.5.1 Safari",
    cardsSeenOn: ["CARD-4417", "CARD-0921", "CARD-7754", "CARD-3308"],
  },
  {
    id: "DEV-0921",
    deviceType: "desktop_mac",
    deviceInfo: "macOS 14.4 Sonoma / Chrome 124.0.6367",
    cardsSeenOn: ["CARD-0921"],
  },
  {
    id: "DEV-7754",
    deviceType: "mobile_android",
    deviceInfo: "Samsung Galaxy S23 / Android 14",
    cardsSeenOn: ["CARD-7754"],
  },
  {
    id: "DEV-3308",
    deviceType: "desktop_windows",
    deviceInfo: "Windows 11 / Edge 125.0",
    cardsSeenOn: ["CARD-3308"],
  },
];

export function getDevice(id: string): DeviceProfile | undefined {
  return devices.find((d) => d.id === id) ?? {
    id,
    deviceType: "mobile_ios",
    deviceInfo: "iPhone / iOS Safari (historical lookup)",
    cardsSeenOn: ["CARD-4417", "CARD-0921"],
  };
}
