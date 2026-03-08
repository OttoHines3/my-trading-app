// AG Charts Enterprise setup - must be imported before using charts
import { AgCharts } from "ag-charts-enterprise";

// Register all enterprise modules
// This needs to happen once at app startup

// Uncomment and add your license key when you receive it:
// AgCharts.setLicenseKey("YOUR_LICENSE_KEY_HERE");

// Export the setup status so components can check it
export const agChartsInitialized = true;
export { AgCharts };
