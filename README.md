# WeatherIntel AI - Synoptic Climate Decision Engine

An immersive, fully responsive full-stack meteorological intelligence dashboard powered by Gemini AI and real-time/archival telemetry from Open-Meteo. The application serves high-fidelity weather diagnostics, multi-metric trend visualization, a proactive real-time weather alerts system, and archival climate historical intelligence.

## 🌟 Key Subsystems

### 1. 📊 Interactive Multi-Metric Forecast Trend Graphics
*   **Synoptic Trend Engine**: Interactive, beautifully formatted SVG visualizations tracking:
    *   **Temperature**: Min/Max ranges plotted with curve tracking and shade variations.
    *   **Precipitation (Rain Risk)**: Bar overlays matching precipitation totals coupled with probability lines.
    *   **Wind Speed**: Peak visual tracks representing atmospheric speed shifts.
*   **Interactive Diagnostics Overlay**: Slide or hover over data coordinates to read precise day-by-day metrics.

### 2. 🚨 Proactive In-App Alert System
*   **Militant Sensor Controls**: Set customized triggers matching specific thresholds for:
    *   Max and Min Temperatures.
    *   Precipitation chances.
    *   High wind gusts.
    *   Severe weather code advisories (rainstorms, snowstorms, lightning).
*   **Acoustic Alarms & Push Feeds**: Triggers localized sound signals and glowing amber/rose toast notifications immediately on live telemetry refreshes.
*   **Audit Logger Trail**: Tracks all historical alerts fired in a searchable timeline.

### 3. 📜 Archival Climate Intelligence Center
*   **Historical Climate Database**: Queries Open-Meteo ERA5 historical reanalysis archives to aggregate:
    *   Average mean temperature, total precipitation, storm wind gusts, and climatic profile brief.
    *   Generates a historical time-series chart mapping the city's temperature history across predefined ranges (1 month, 3 months, Same Month Last Year, or Custom Ranges).

---

## 🛠️ Tech Stack & Architecture

*   **Frontend**: React 18 (TypeScript), Vite, Tailwind CSS, Lucide Icons, and SVG responsive matrix renderers.
*   **Backend Proxy**: Node.js & Express (TypeScript compiled to clean ESModule bundle via `esbuild`).
*   **Data Pipelines**: Open-Meteo API proxies for Geocoding, Real-time forecasting, and Archival ERA5 climate models.
*   **AI Integration**: Gemini AI (Synoptic Meteorologist consultancy modeling synoptic atmospheric parameters and custom comfort ratings).

---

## 🚀 How to Export & Sync in Google AI Studio

To sync and push this complete workspace code to your approved repository (**`AI_Assisted_App_Building_Assignment-L2`**):

1. **Connect GitHub in AI Studio**:
   * Open the **Settings Panel** (Gear icon ⚙️) or click the **Export / Sync** option at the top right of the Google AI Studio build workspace.
   * Under the version control section, select **Direct GitHub Connection**.
   * Authenticate your GitHub account and grant the necessary write permissions.

2. **Select Target Repository**:
   * Select your approved repository from the dropdown list: `leelaharikrishna7890/AI_Assisted_App_Building_Assignment-L2`.
   * Click the **Push Source Code** or **Sync Workspace** button.

3. **Verify the Push & Complete**:
   * Navigate to `https://github.com/leelaharikrishna7890/AI_Assisted_App_Building_Assignment-L2`.
   * Confirm that the repository successfully contains:
     * `package.json` (Vite, Express, and dev scripts)
     * `README.md` (This documentation)
     * `/src` folder (All modular React interfaces, Charts, Alerts, and Historical Components)
     * `server.ts` (The Express proxy containing weather and archival endpoints)
