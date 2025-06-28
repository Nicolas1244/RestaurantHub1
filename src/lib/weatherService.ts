// CRITICAL: Enhanced Weather service for restaurant location integration
export class WeatherService {
  private static readonly API_KEY = ''; // Will use free OpenWeatherMap API
  private static readonly BASE_URL = 'https://api.openweathermap.org/data/2.5';
  private static readonly GEO_URL = 'https://api.openweathermap.org/geo/1.0';
  
  // CRITICAL: Cache to avoid excessive API calls
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  // CRITICAL: Enhanced geocoding with better address parsing
  static async getCoordinatesFromAddress(address: string): Promise<{ lat: number; lon: number } | null> {
    try {
      console.log('🌍 Geocoding address:', address);
      
      // For demo purposes, we'll use enhanced mock geocoding
      // In production, you would use a real geocoding API like:
      // - OpenWeatherMap Geocoding API
      // - Google Maps Geocoding API
      // - Mapbox Geocoding API
      const mockCoordinates = this.getMockCoordinatesForAddress(address);
      
      console.log('📍 Coordinates found:', mockCoordinates);
      return mockCoordinates;
    } catch (error) {
      console.error('❌ Geocoding failed:', error);
      return null;
    }
  }

  // CRITICAL: Enhanced mock geocoding with better French address support
  private static getMockCoordinatesForAddress(address: string): { lat: number; lon: number } {
    const addressLower = address.toLowerCase();
    
    // Enhanced French city detection with postal codes
    const cityMappings = [
      // Paris and arrondissements
      { patterns: ['paris', '75001', '75002', '75003', '75004', '75005', '75006', '75007', '75008', '75009', '75010', '75011', '75012', '75013', '75014', '75015', '75016', '75017', '75018', '75019', '75020'], coords: { lat: 48.8566, lon: 2.3522 } },
      
      // Major French cities
      { patterns: ['lyon', '69000', '69001', '69002', '69003', '69004', '69005', '69006', '69007', '69008', '69009'], coords: { lat: 45.7640, lon: 4.8357 } },
      { patterns: ['marseille', '13000', '13001', '13002', '13003', '13004', '13005', '13006', '13007', '13008', '13009', '13010', '13011', '13012', '13013', '13014', '13015', '13016'], coords: { lat: 43.2965, lon: 5.3698 } },
      { patterns: ['toulouse', '31000', '31100', '31200', '31300', '31400', '31500'], coords: { lat: 43.6047, lon: 1.4442 } },
      { patterns: ['nice', '06000', '06100', '06200', '06300'], coords: { lat: 43.7102, lon: 7.2620 } },
      { patterns: ['nantes', '44000', '44100', '44200', '44300'], coords: { lat: 47.2184, lon: -1.5536 } },
      { patterns: ['strasbourg', '67000', '67100', '67200'], coords: { lat: 48.5734, lon: 7.7521 } },
      { patterns: ['montpellier', '34000', '34070', '34080', '34090'], coords: { lat: 43.6110, lon: 3.8767 } },
      { patterns: ['bordeaux', '33000', '33100', '33200', '33300'], coords: { lat: 44.8378, lon: -0.5792 } },
      { patterns: ['lille', '59000', '59160', '59260', '59777', '59800'], coords: { lat: 50.6292, lon: 3.0573 } },
      { patterns: ['rennes', '35000', '35200', '35700'], coords: { lat: 48.1173, lon: -1.6778 } },
      { patterns: ['reims', '51100', '51430', '51450', '51500'], coords: { lat: 49.2583, lon: 4.0317 } },
      { patterns: ['le havre', '76600', '76610', '76620'], coords: { lat: 49.4944, lon: 0.1079 } },
      { patterns: ['saint-étienne', 'saint etienne', '42000', '42100', '42230'], coords: { lat: 45.4397, lon: 4.3872 } },
      { patterns: ['toulon', '83000', '83100', '83200'], coords: { lat: 43.1242, lon: 5.9280 } },
      { patterns: ['angers', '49000', '49100'], coords: { lat: 47.4784, lon: -0.5632 } },
      { patterns: ['grenoble', '38000', '38100', '38700'], coords: { lat: 45.1885, lon: 5.7245 } },
      { patterns: ['dijon', '21000', '21800'], coords: { lat: 47.3220, lon: 5.0415 } },
      { patterns: ['nîmes', 'nimes', '30000', '30900'], coords: { lat: 43.8367, lon: 4.3601 } },
      { patterns: ['aix-en-provence', 'aix en provence', '13080', '13090', '13100', '13290', '13540'], coords: { lat: 43.5297, lon: 5.4474 } }
    ];

    // Find matching city
    for (const mapping of cityMappings) {
      for (const pattern of mapping.patterns) {
        if (addressLower.includes(pattern)) {
          console.log(`🎯 Matched pattern "${pattern}" for address: ${address}`);
          return mapping.coords;
        }
      }
    }

    // Default to Paris coordinates if no match found
    console.log('🏛️ No specific match found, defaulting to Paris coordinates');
    return { lat: 48.8566, lon: 2.3522 };
  }

  // CRITICAL: Get weather forecast with enhanced caching and error handling
  static async getWeatherForecast(lat: number, lon: number): Promise<WeatherForecast | null> {
    const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    const cached = this.cache.get(cacheKey);
    
    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('☁️ Using cached weather data for:', cacheKey);
      return cached.data;
    }

    try {
      console.log('🌤️ Fetching fresh weather data for coordinates:', { lat, lon });
      
      // For demo purposes, return enhanced mock weather data
      // In production, you would make actual API calls to OpenWeatherMap:
      /*
      const response = await fetch(
        `${this.BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=metric&lang=fr`
      );
      const data = await response.json();
      */
      
      const mockForecast = this.generateMockWeatherForecast(lat, lon);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: mockForecast,
        timestamp: Date.now()
      });
      
      console.log('✅ Weather forecast generated and cached');
      return mockForecast;
    } catch (error) {
      console.error('❌ Weather API failed:', error);
      return null;
    }
  }

  // CRITICAL: Generate realistic mock weather data with location awareness
  private static generateMockWeatherForecast(lat: number, lon: number): WeatherForecast {
    const today = new Date();
    const forecast: WeatherData[] = [];
    
    // Generate 15 days of forecast data
    for (let i = 0; i < 15; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Generate realistic weather patterns based on location and season
      const baseTemp = this.getLocationSeasonalTemp(lat, lon, date);
      const variation = (Math.random() - 0.5) * 8; // ±4°C variation
      const minTemp = Math.round(baseTemp + variation - 3);
      const maxTemp = Math.round(baseTemp + variation + 5);
      
      // Weather conditions with realistic probabilities
      const weatherConditions = this.generateWeatherCondition(lat, lon, date, i);
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        temp: {
          min: minTemp,
          max: maxTemp
        },
        weather: [weatherConditions],
        wind: {
          speed: Math.round(Math.random() * 20 + 5), // 5-25 km/h
          deg: Math.round(Math.random() * 360)
        },
        humidity: Math.round(Math.random() * 40 + 40), // 40-80%
        pressure: Math.round(Math.random() * 50 + 1000) // 1000-1050 hPa
      });
    }

    return {
      location: {
        name: this.getLocationName(lat, lon),
        country: 'FR',
        lat,
        lon
      },
      current: forecast[0],
      forecast,
      lastUpdated: new Date().toISOString()
    };
  }

  // CRITICAL: Location-aware seasonal temperature calculation
  private static getLocationSeasonalTemp(lat: number, lon: number, date: Date): number {
    const month = date.getMonth();
    
    // Base seasonal temperatures for France (Paris region)
    const parisTemps = [5, 7, 11, 14, 18, 22, 25, 24, 20, 15, 9, 6];
    
    // Adjust for latitude (northern cities are cooler)
    const latitudeAdjustment = (lat - 48.8566) * -0.5; // Cooler as you go north
    
    // Adjust for longitude (eastern cities have more continental climate)
    const longitudeAdjustment = (lon - 2.3522) * 0.3; // More extreme temperatures inland
    
    // Mediterranean adjustment (southern coastal cities are warmer)
    let mediterraneanBonus = 0;
    if (lat < 44 && lon > 3) { // Rough Mediterranean region
      mediterraneanBonus = 3;
    }
    
    const baseTemp = parisTemps[month] + latitudeAdjustment + longitudeAdjustment + mediterraneanBonus;
    
    return Math.max(-5, Math.min(35, baseTemp)); // Reasonable temperature bounds
  }

  // CRITICAL: Enhanced weather condition generation with location awareness
  private static generateWeatherCondition(lat: number, lon: number, date: Date, dayIndex: number): WeatherCondition {
    const conditions = [
      { id: 800, main: 'Clear', description: 'ciel dégagé', icon: '01d' },
      { id: 801, main: 'Clouds', description: 'peu nuageux', icon: '02d' },
      { id: 802, main: 'Clouds', description: 'partiellement nuageux', icon: '03d' },
      { id: 803, main: 'Clouds', description: 'très nuageux', icon: '04d' },
      { id: 804, main: 'Clouds', description: 'couvert', icon: '04d' },
      { id: 500, main: 'Rain', description: 'pluie légère', icon: '10d' },
      { id: 501, main: 'Rain', description: 'pluie modérée', icon: '10d' },
      { id: 502, main: 'Rain', description: 'pluie forte', icon: '10d' },
      { id: 600, main: 'Snow', description: 'neige légère', icon: '13d' },
      { id: 701, main: 'Mist', description: 'brume', icon: '50d' }
    ];

    const month = date.getMonth();
    let weights: number[];
    
    // Adjust weather patterns based on location and season
    const isMediterranean = lat < 44 && lon > 3;
    const isNorthern = lat > 49;
    
    if (month >= 5 && month <= 8) { // Summer
      if (isMediterranean) {
        weights = [0.6, 0.2, 0.1, 0.05, 0.03, 0.015, 0.005, 0, 0, 0];
      } else if (isNorthern) {
        weights = [0.3, 0.25, 0.2, 0.15, 0.05, 0.03, 0.015, 0.005, 0, 0.005];
      } else {
        weights = [0.4, 0.25, 0.15, 0.1, 0.05, 0.03, 0.01, 0.005, 0, 0.005];
      }
    } else if (month >= 11 || month <= 2) { // Winter
      if (isMediterranean) {
        weights = [0.3, 0.2, 0.2, 0.15, 0.08, 0.04, 0.02, 0.005, 0.005, 0.01];
      } else if (isNorthern) {
        weights = [0.15, 0.15, 0.2, 0.2, 0.12, 0.08, 0.05, 0.02, 0.02, 0.01];
      } else {
        weights = [0.2, 0.15, 0.2, 0.15, 0.1, 0.08, 0.05, 0.02, 0.03, 0.02];
      }
    } else { // Spring/Fall
      weights = [0.3, 0.2, 0.2, 0.15, 0.08, 0.04, 0.02, 0.005, 0.005, 0.01];
    }

    // Select condition based on weights
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return conditions[i];
      }
    }
    
    return conditions[0]; // Fallback to clear sky
  }

  // CRITICAL: Enhanced location name detection with better French city support
  private static getLocationName(lat: number, lon: number): string {
    const cityMappings = [
      { coords: { lat: 48.8566, lon: 2.3522 }, name: 'Paris' },
      { coords: { lat: 45.7640, lon: 4.8357 }, name: 'Lyon' },
      { coords: { lat: 43.2965, lon: 5.3698 }, name: 'Marseille' },
      { coords: { lat: 43.6047, lon: 1.4442 }, name: 'Toulouse' },
      { coords: { lat: 43.7102, lon: 7.2620 }, name: 'Nice' },
      { coords: { lat: 47.2184, lon: -1.5536 }, name: 'Nantes' },
      { coords: { lat: 48.5734, lon: 7.7521 }, name: 'Strasbourg' },
      { coords: { lat: 43.6110, lon: 3.8767 }, name: 'Montpellier' },
      { coords: { lat: 44.8378, lon: -0.5792 }, name: 'Bordeaux' },
      { coords: { lat: 50.6292, lon: 3.0573 }, name: 'Lille' }
    ];

    // Find closest city (within 0.2 degrees)
    for (const mapping of cityMappings) {
      const latDiff = Math.abs(lat - mapping.coords.lat);
      const lonDiff = Math.abs(lon - mapping.coords.lon);
      
      if (latDiff < 0.2 && lonDiff < 0.2) {
        return mapping.name;
      }
    }
    
    return 'France'; // Generic fallback
  }

  // CRITICAL: Get weather icon URL
  static getWeatherIconUrl(iconCode: string): string {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }

  // CRITICAL: Get weather icon emoji for fallback
  static getWeatherEmoji(weatherMain: string): string {
    const emojiMap: Record<string, string> = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Fog': '🌫️',
      'Haze': '🌫️',
      'Dust': '🌪️',
      'Sand': '🌪️',
      'Ash': '🌋',
      'Squall': '💨',
      'Tornado': '🌪️'
    };
    
    return emojiMap[weatherMain] || '🌤️';
  }

  // CRITICAL: Format wind speed and direction
  static formatWind(speed: number, deg?: number): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const direction = deg ? directions[Math.round(deg / 45) % 8] : '';
    return `${speed} km/h ${direction}`.trim();
  }

  // CRITICAL: Production API integration guide
  static getProductionAPIGuide(): string {
    return `
    PRODUCTION WEATHER API INTEGRATION GUIDE:
    
    1. OpenWeatherMap API (Recommended):
       - Sign up at: https://openweathermap.org/api
       - Get free API key (1000 calls/day)
       - Replace API_KEY constant with your key
       - Uncomment actual API calls in getWeatherForecast()
    
    2. Geocoding API:
       - Use OpenWeatherMap Geocoding: http://api.openweathermap.org/geo/1.0/direct
       - Or Google Maps Geocoding API for better accuracy
       - Replace getMockCoordinatesForAddress() with real API calls
    
    3. Environment Variables:
       - Store API keys in .env file
       - Add VITE_WEATHER_API_KEY=your_api_key_here
       - Use import.meta.env.VITE_WEATHER_API_KEY in code
    
    4. Error Handling:
       - Implement retry logic for failed API calls
       - Add fallback to cached data when API is unavailable
       - Show user-friendly error messages
    
    5. Rate Limiting:
       - Implement request throttling
       - Use longer cache durations for production
       - Consider upgrading to paid plan for higher limits
    `;
  }
}

// CRITICAL: Export types for weather integration
export interface WeatherForecast {
  location: {
    name: string;
    country: string;
    lat: number;
    lon: number;
  };
  current: WeatherData;
  forecast: WeatherData[];
  lastUpdated: string;
}

export interface WeatherData {
  date: string;
  temp: {
    min: number;
    max: number;
  };
  weather: WeatherCondition[];
  wind?: {
    speed: number;
    deg: number;
  };
  humidity?: number;
  pressure?: number;
}

export interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}