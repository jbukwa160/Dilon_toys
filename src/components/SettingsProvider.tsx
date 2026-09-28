"use client";

import { createContext, useContext } from "react";
import { DEFAULT_SETTINGS, publicSettings, type PublicSettings } from "@/lib/settings-types";

const Ctx = createContext<PublicSettings>(publicSettings(DEFAULT_SETTINGS));

export function SettingsProvider({ value, children }: { value: PublicSettings; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Store settings (shipping prices, points rate…) edited in the admin panel. */
export function useSettings(): PublicSettings {
  return useContext(Ctx);
}
