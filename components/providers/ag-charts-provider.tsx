"use client";

import { ReactNode, useEffect, useState } from "react";
import {
  ModuleRegistry,
  AllEnterpriseModule,
} from "ag-charts-enterprise";

// Register all enterprise modules including financial charts
// This must happen before any charts are created
ModuleRegistry.registerModules([AllEnterpriseModule]);

// Uncomment when you receive your license key:
// import { AgCharts } from "ag-charts-enterprise";
// AgCharts.setLicenseKey("YOUR_LICENSE_KEY_HERE");

interface Props {
  children: ReactNode;
}

export function AGChartsProvider({ children }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Modules are already registered at import time
    setReady(true);
  }, []);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}
