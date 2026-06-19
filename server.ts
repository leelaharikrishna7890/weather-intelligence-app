import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parsing support
  app.use(express.json());

  // Initialize secure GenAI instance
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  // 1. Geocoding Proxy (Search City)
  app.get("/api/weather/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res.status(400).json({ error: "Query parameter 'q' is required." });
      }

      const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=10&language=en`;
      const response = await fetch(geocodeUrl);
      
      if (!response.ok) {
        throw new Error(`Geocoding service returned status ${response.status}`);
      }

      const data = await response.json();
      return res.json(data);
    } catch (error: any) {
      console.error("Geocoding Proxy Error:", error.message);
      return res.status(500).json({ error: "Failed to query city coordinates." });
    }
  });

  // 2. Weather Forecast Proxy
  app.get("/api/weather/forecast", async (req, res) => {
    try {
      const { lat, lon, timezone } = req.query;
      if (!lat || !lon) {
        return res.status(400).json({ error: "Latitude 'lat' and longitude 'lon' are required." });
      }

      const tz = timezone && typeof timezone === "string" ? timezone : "auto";
      
      // Request hourly temperature & precipitation + daily metrics + current metrics
      const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(String(lat))}&longitude=${encodeURIComponent(String(lon))}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,rain_sum,showers_sum,snowfall_sum,precipitation_probability_max,wind_speed_10m_max&hourly=temperature_2m,precipitation_probability,weather_code&timezone=${encodeURIComponent(tz)}`;
      
      const response = await fetch(forecastUrl);
      if (!response.ok) {
        throw new Error(`Open-Meteo forecast returned status ${response.status}`);
      }

      const data = await response.json();
      return res.json(data);
    } catch (error: any) {
      console.error("Forecast Proxy Error:", error.message);
      return res.status(500).json({ error: "Failed to fetch weather forecast data." });
    }
  });

  // 2.5 Historical Weather Proxy
  app.get("/api/weather/historical", async (req, res) => {
    try {
      const { lat, lon, start_date, end_date, timezone } = req.query;
      if (!lat || !lon || !start_date || !end_date) {
        return res.status(400).json({ error: "Latitude, longitude, start_date, and end_date are required." });
      }

      const tz = timezone && typeof timezone === "string" ? timezone : "auto";
      const historicalUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${encodeURIComponent(String(lat))}&longitude=${encodeURIComponent(String(lon))}&start_date=${encodeURIComponent(String(start_date))}&end_date=${encodeURIComponent(String(end_date))}&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,wind_speed_10m_max&timezone=${encodeURIComponent(tz)}`;
      
      const response = await fetch(historicalUrl);
      if (!response.ok) {
        throw new Error(`Open-Meteo historical archive returned status ${response.status}`);
      }

      const data = await response.json();
      return res.json(data);
    } catch (error: any) {
      console.error("Historical Proxy Error:", error.message);
      return res.status(500).json({ error: "Failed to fetch historical weather data." });
    }
  });

  // 3. AI Weather Intelligence Prompt Generator & Analyzer
  app.post("/api/weather/intelligence", async (req, res) => {
    try {
      const { current, daily, city, country } = req.body;
      if (!current || !daily) {
        return res.status(400).json({ error: "Missing required weather metrics (current/daily)." });
      }

      const locationName = city ? `${city}, ${country || ""}` : "Selected Location";

      // Build a precise context dump for Gemini
      const weatherContext = {
        location: locationName,
        current: {
          temp: current.temperature_2m,
          feelsLike: current.apparent_temperature,
          humidity: current.relative_humidity_2m,
          windSpeed: current.wind_speed_10m,
          cloudCover: current.cloud_cover,
          weatherCode: current.weather_code,
          isDay: current.is_day,
          pressure: current.pressure_msl,
        },
        dailyForecast: daily.time.map((date: string, i: number) => ({
          date,
          tempMax: daily.temperature_2m_max?.[i],
          tempMin: daily.temperature_2m_min?.[i],
          apparentMax: daily.apparent_temperature_max?.[i],
          apparentMin: daily.apparent_temperature_min?.[i],
          weatherCode: daily.weather_code?.[i],
          uvIndexMax: daily.uv_index_max?.[i],
          precipitationSum: daily.precipitation_sum?.[i],
          precipitationProbMax: daily.precipitation_probability_max?.[i],
        })),
      };

      const prompt = `Analyze the meteorological forecast data for ${locationName} and generate highly tailored, professional and smart daily weather intelligence and advice.
      
Weather Data:
${JSON.stringify(weatherContext, null, 2)}

Provide recommendations for:
- Clothing & styling (taking into account temperatures, wind, rain, humidity).
- Outdoor activity scores, suitability, level of confidence, and safe matches (hiking, running, interior exercises, stargazing).
- Health & wellness (UV skin risk, pollen warnings based on precipitation/wind, joint pain indicators based on atmospheric pressure levels, hydration guides).
- Travel safety (road visibility, high wind flight scheduling warnings).
- Gardening & plant care (watering guidance, temperature protection, priority actions).
- Home energy optimizer (ventilation openings, air conditioning optimization, thermal insulation suggestions, solar panel conversion index based on clouds).
- A playful or quirky humorous quote about today's vibe.

Strictly adhere to the provided JSON schema output format. No raw markdown formatting surrounding the JSON description, just pure JSON data.`;

      // Request structured output from standard text execution model
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an elite automated meteorological consultant specializing in tailoring complex micro-weather indicators into crisp, human-centric actionable decisions.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: "A friendly and professional summary of today's weather context and what to expect."
              },
              funQuote: {
                type: Type.STRING,
                description: "A witty, lighthearted, or humorous remark about the weather."
              },
              dressCode: {
                type: Type.OBJECT,
                properties: {
                  recommendation: { type: Type.STRING, description: "Direct clothing guidance." },
                  keyItems: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "List of 3-4 recommended garments or accessories (e.g., 'Sunglasses', 'Umbrella')."
                  },
                  comfortIndex: { type: Type.STRING, description: "A simple metric (e.g. 'Highly Comfortable', 'Chilly & Damp', 'Extremely Hot')." }
                },
                required: ["recommendation", "keyItems", "comfortIndex"]
              },
              outdoorActivities: {
                type: Type.OBJECT,
                properties: {
                  suitabilityIndex: { type: Type.INTEGER, description: "0 to 100 rating of suitability for outdoor activities." },
                  assessment: { type: Type.STRING, description: "Comprehensive outdoor advice." },
                  safeActivities: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "List of matching exercises/activities (e.g. 'Indoor Yoga', 'Running', 'Photography')."
                  }
                },
                required: ["suitabilityIndex", "assessment", "safeActivities"]
              },
              healthTips: {
                type: Type.OBJECT,
                properties: {
                  uvRisk: { type: Type.STRING, description: "UV exposure and sunblock guide (e.g., 'Low risk - simple sunglasses', 'Extreme - SPF 50 required')." },
                  allergyPollen: { type: Type.STRING, description: "Allergy and pollen count estimate based on rain, wind, and seasonality." },
                  wellnessAdvice: { type: Type.STRING, description: "hydration advice, joints pressure warning, or general physical wellbeing tip." }
                },
                required: ["uvRisk", "allergyPollen", "wellnessAdvice"]
              },
              travelSafety: {
                type: Type.OBJECT,
                properties: {
                  drivingConditions: { type: Type.STRING, description: "Road condition rating (e.g., 'Excellent visibility, dry roads', 'Wet roads - watch out for hydroplaning')." },
                  flightDelayHazard: { type: Type.STRING, description: "Risk level for flight scheduling (e.g. 'Minimal', 'Moderate due to fog', 'High winds likely causing delays')." },
                  generalAdvice: { type: Type.STRING, description: "Safe travel recommendations." }
                },
                required: ["drivingConditions", "flightDelayHazard", "generalAdvice"]
              },
              gardeningAdvice: {
                type: Type.OBJECT,
                properties: {
                  wateringNeeds: { type: Type.STRING, description: "Watering guidelines (e.g., 'Skip watering - rainfall is sufficient', 'Deep soak needed today')." },
                  frostRisk: { type: Type.BOOLEAN, description: "True if temperature could damage sensitive plants." },
                  priorityTask: { type: Type.STRING, description: "Single most important gardening action for the day." }
                },
                required: ["wateringNeeds", "frostRisk", "priorityTask"]
              },
              homeEnergyOptimizer: {
                type: Type.OBJECT,
                properties: {
                  hvacOptimization: { type: Type.STRING, description: "Thermostat/ventilation advice (e.g., 'Turn off AC and open windows', 'Ramp up heating, lock drafts')." },
                  solarEfficiencyRatio: { type: Type.INTEGER, description: "0 to 100 efficiency potential rating based on cloud cover." },
                  applianceTip: { type: Type.STRING, description: "Suggestions on energy intensive tasks like laundry, solar usage, or air moisture control." }
                },
                required: ["hvacOptimization", "solarEfficiencyRatio", "applianceTip"]
              }
            },
            required: [
              "summary",
              "funQuote",
              "dressCode",
              "outdoorActivities",
              "healthTips",
              "travelSafety",
              "gardeningAdvice",
              "homeEnergyOptimizer"
            ]
          }
        }
      });

      const intelligenceResult = response.text ? JSON.parse(response.text.trim()) : null;
      return res.json(intelligenceResult);
    } catch (error: any) {
      console.error("AI Weather Intelligence Error:", error);
      return res.status(500).json({ error: "Failed to generate AI weather insights: " + error.message });
    }
  });

  // 4. Vite Environment Setup (Vite Middleware in Development)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static assets from dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Active Binding to port 3000
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Weather Intelligence server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
