import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind, MapPin, RefreshCw, Settings } from 'lucide-react';
import { WeatherForecast as WeatherForecastType, WeatherData } from '../../types';
import { WeatherService } from '../../lib/weatherService';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../contexts/AppContext';
import { addDays, format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface WeatherForecastProps {
  weekStartDate: Date;
  restaurantLocation?: string;
  compact?: boolean;
  responsive?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const WeatherForecast: React.FC<WeatherForecastProps> = ({
  weekStartDate,
  restaurantLocation,
  compact = false,
  responsive = 'lg'
}) => {
  const { t, i18n } = useTranslation();
  // CRITICAL: Force weatherEnabled to true by default
  const { userSettings, updateSettings, currentRestaurant } = useAppContext();
  const [forecast, setForecast] = useState<WeatherForecastType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CRITICAL: Enhanced location detection with restaurant address priority
  const getWeatherLocation = (): string => {
    // Priority 1: Manual location override from settings
    if (!userSettings?.weatherAutoLocation && userSettings?.weatherLocation) {
      console.log('🎯 Using manual weather location:', userSettings.weatherLocation);
      return userSettings.weatherLocation;
    }

    // Priority 2: Current restaurant's complete address
    if (userSettings?.weatherAutoLocation && currentRestaurant) {
      const addressParts = [];
      
      if (currentRestaurant.streetAddress) {
        addressParts.push(currentRestaurant.streetAddress);
      }
      
      if (currentRestaurant.postalCode) {
        addressParts.push(currentRestaurant.postalCode);
      }
      
      if (currentRestaurant.city) {
        addressParts.push(currentRestaurant.city);
      }
      
      if (currentRestaurant.country) {
        addressParts.push(currentRestaurant.country);
      }

      if (addressParts.length > 0) {
        const fullAddress = addressParts.join(', ');
        console.log('🏪 Using restaurant address for weather:', fullAddress);
        return fullAddress;
      }

      // Fallback to restaurant location field
      if (currentRestaurant.location) {
        console.log('🏪 Using restaurant location field:', currentRestaurant.location);
        return currentRestaurant.location;
      }
    }

    // Priority 3: Fallback to provided restaurant location
    if (restaurantLocation) {
      console.log('📍 Using provided restaurant location:', restaurantLocation);
      return restaurantLocation;
    }

    // Priority 4: Default fallback
    console.log('🌍 Using default location: France');
    return 'France';
  };

  // CRITICAL: Load weather data with enhanced location detection
  useEffect(() => {
    // CRITICAL: Always load weather data regardless of weatherEnabled setting
    if (true) {
      loadWeatherData();
    }
  }, [
    userSettings?.weatherEnabled, 
    userSettings?.weatherLocation, 
    userSettings?.weatherAutoLocation, 
    currentRestaurant?.streetAddress,
    currentRestaurant?.postalCode,
    currentRestaurant?.city,
    currentRestaurant?.country,
    currentRestaurant?.location,
    restaurantLocation
  ]);

  // CRITICAL: Enhanced weather data loading with better error handling
  const loadWeatherData = async () => {
    setLoading(true);
    setError(null);

    try {
      const location = getWeatherLocation();
      console.log('🌤️ Loading weather for location:', location);

      // Get coordinates from address
      const coordinates = await WeatherService.getCoordinatesFromAddress(location);

      if (coordinates) {
        console.log('📍 Coordinates obtained:', coordinates);
        const weatherData = await WeatherService.getWeatherForecast(coordinates.lat, coordinates.lon);
        
        if (weatherData) {
          setForecast(weatherData);
          console.log('✅ Weather data loaded successfully');
        } else {
          throw new Error('No weather data received');
        }
      } else {
        throw new Error('Unable to determine coordinates for location');
      }
    } catch (err) {
      console.error('❌ Weather loading failed:', err);
      setError(i18n.language === 'fr' 
        ? 'Impossible de charger les données météo' 
        : 'Failed to load weather data'
      );
    } finally {
      setLoading(false);
    }
  };

  // CRITICAL: Toggle weather feature
  const toggleWeather = async () => {
    await updateSettings({ weatherEnabled: !userSettings?.weatherEnabled });
  };

  // CRITICAL: Get weather data for specific date
  const getWeatherForDate = (date: Date): WeatherData | null => {
    if (!forecast) return null;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    return forecast.forecast.find(day => day.date === dateStr) || null;
  };

  // CRITICAL: REDUCED HEIGHT - Optimized responsive classes with minimal padding
  const getResponsiveClasses = () => {
    switch (responsive) {
      case 'xs':
        return {
          container: 'px-1 py-0.5',
          grid: 'grid grid-cols-[80px_repeat(7,minmax(70px,1fr))_100px]',
          employeeHeader: 'w-[80px] p-0.5 text-center',
          dayCell: 'p-0.5 text-center flex flex-col items-center justify-center',
          summaryHeader: 'w-[100px] p-0.5 text-center',
          icon: 'w-4 h-4',
          temp: 'text-xs mt-0.5',
          wind: 'text-xs mt-0.5',
          location: 'text-xs',
          controls: 'text-xs'
        };
      case 'sm':
        return {
          container: 'px-2 py-0.5',
          grid: 'grid grid-cols-[90px_repeat(7,minmax(80px,1fr))_120px]',
          employeeHeader: 'w-[90px] p-0.5 text-center',
          dayCell: 'p-0.5 text-center flex flex-col items-center justify-center',
          summaryHeader: 'w-[120px] p-0.5 text-center',
          icon: 'w-5 h-5',
          temp: 'text-xs mt-0.5',
          wind: 'text-xs mt-0.5',
          location: 'text-xs',
          controls: 'text-xs'
        };
      case 'md':
        return {
          container: compact ? 'px-2 py-0.5' : 'px-3 py-0.5',
          grid: compact 
            ? 'grid grid-cols-[110px_repeat(7,minmax(90px,1fr))_140px]'
            : 'grid grid-cols-[120px_repeat(7,minmax(100px,1fr))_160px]',
          employeeHeader: compact ? 'w-[110px] p-1 text-center' : 'w-[120px] p-1 text-center',
          dayCell: compact ? 'p-0.5 text-center flex flex-col items-center justify-center' : 'p-1 text-center flex flex-col items-center justify-center',
          summaryHeader: compact ? 'w-[140px] p-1 text-center' : 'w-[160px] p-1 text-center',
          icon: compact ? 'w-5 h-5' : 'w-6 h-6',
          temp: 'text-xs mt-0.5',
          wind: 'text-xs mt-0.5',
          location: 'text-sm',
          controls: 'text-sm'
        };
      case 'lg':
        return {
          container: compact ? 'px-3 py-0.5' : 'px-4 py-0.5',
          grid: compact 
            ? 'grid grid-cols-[120px_repeat(7,minmax(100px,1fr))_160px]'
            : 'grid grid-cols-[140px_repeat(7,minmax(120px,1fr))_180px]',
          employeeHeader: compact ? 'w-[120px] p-1 text-center' : 'w-[140px] p-1.5 text-center',
          dayCell: compact ? 'p-0.5 text-center flex flex-col items-center justify-center' : 'p-1 text-center flex flex-col items-center justify-center',
          summaryHeader: compact ? 'w-[160px] p-1 text-center' : 'w-[180px] p-1.5 text-center',
          icon: compact ? 'w-6 h-6' : 'w-8 h-8',
          temp: compact ? 'text-xs mt-0.5' : 'text-sm mt-0.5',
          wind: compact ? 'text-xs mt-0.5' : 'text-xs mt-0.5',
          location: 'text-sm',
          controls: 'text-sm'
        };
      case 'xl':
      default:
        return {
          container: compact ? 'px-4 py-0.5' : 'px-6 py-0.5',
          grid: compact 
            ? 'grid grid-cols-[140px_repeat(7,minmax(120px,1fr))_180px]'
            : 'grid grid-cols-[160px_repeat(7,minmax(140px,1fr))_200px]',
          employeeHeader: compact ? 'w-[140px] p-1.5 text-center' : 'w-[160px] p-1.5 text-center',
          dayCell: compact ? 'p-1 text-center flex flex-col items-center justify-center' : 'p-1 text-center flex flex-col items-center justify-center',
          summaryHeader: compact ? 'w-[180px] p-1.5 text-center' : 'w-[200px] p-1.5 text-center',
          icon: compact ? 'w-7 h-7' : 'w-10 h-10',
          temp: compact ? 'text-sm mt-0.5' : 'text-base mt-0.5',
          wind: compact ? 'text-xs mt-0.5' : 'text-sm mt-0.5',
          location: 'text-base',
          controls: 'text-base'
        };
    }
  };

  const classes = getResponsiveClasses();

  // CRITICAL: Render weather icon with perfect centering
  const renderWeatherIcon = (weather: WeatherData) => {
    const condition = weather.weather[0];
    const emoji = WeatherService.getWeatherEmoji(condition.main);
    
    return (
      <div className={`${classes.icon} flex items-center justify-center`} title={condition.description}>
        <span className="text-lg">{emoji}</span>
      </div>
    );
  };

  // CRITICAL: Format temperature display
  const formatTemperature = (min: number, max: number) => {
    return `${min}° / ${max}°`;
  };

  // CRITICAL: Don't render if weather is disabled
  // CRITICAL: Always show weather forecast regardless of setting
  if (false && !userSettings?.weatherEnabled) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg ${classes.container}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Cloud className="text-blue-600 mr-2" size={20} />
            <span className={`text-blue-700 font-medium ${classes.controls}`}>
              {i18n.language === 'fr' ? 'Prévisions météo désactivées' : 'Weather forecast disabled'}
            </span>
          </div>
          <button
            onClick={toggleWeather}
            className={`px-3 py-1 ${classes.controls} text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors`}
          >
            {i18n.language === 'fr' ? 'Activer' : 'Enable'}
          </button>
        </div>
      </div>
    );
  }

  // CRITICAL: Loading state
  if (loading) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg ${classes.container}`}>
        <div className="flex items-center justify-center">
          <RefreshCw className="animate-spin text-gray-400 mr-2" size={20} />
          <span className={`text-gray-600 ${classes.controls}`}>
            {i18n.language === 'fr' ? 'Chargement des prévisions météo...' : 'Loading weather forecast...'}
          </span>
        </div>
      </div>
    );
  }

  // CRITICAL: Error state with location info
  if (error || !forecast) {
    const location = getWeatherLocation();
    
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg ${classes.container}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Cloud className="text-red-600 mr-2" size={20} />
            <div>
              <span className={`text-red-700 ${classes.controls}`}>
                {error || (i18n.language === 'fr' ? 'Prévisions météo indisponibles' : 'Weather forecast unavailable')}
              </span>
              <div className={`text-red-600 ${classes.controls} opacity-75 mt-1`}>
                {i18n.language === 'fr' ? 'Localisation' : 'Location'}: {location}
              </div>
            </div>
          </div>
          <button
            onClick={loadWeatherData}
            className={`px-3 py-1 ${classes.controls} text-red-600 hover:text-red-700 hover:bg-red-100 rounded transition-colors`}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* CRITICAL: Enhanced weather header with location display */}
      <div className={`border-b border-gray-100 ${classes.container}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Cloud className="text-blue-600 mr-2" size={18} />
            <div>
              <span className={`text-gray-800 font-medium ${classes.location}`}>
                {i18n.language === 'fr' ? 'Prévisions météo' : 'Weather Forecast'}
              </span>
              {forecast.location.name && (
                <div className="flex items-center mt-0.5">
                  <MapPin className="text-gray-400 mr-1" size={12} />
                  <span className={`text-gray-500 ${classes.controls}`}>
                    {forecast.location.name}
                  </span>
                  {/* CRITICAL: Show if using restaurant address */}
                  {userSettings?.weatherAutoLocation && currentRestaurant && (
                    <span className={`text-green-600 ml-2 ${classes.controls}`}>
                      📍 {i18n.language === 'fr' ? 'Auto' : 'Auto'}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={loadWeatherData}
              className={`p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors`}
              title={i18n.language === 'fr' ? 'Actualiser' : 'Refresh'}
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={toggleWeather}
              className={`p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors`}
              title={i18n.language === 'fr' ? 'Paramètres météo' : 'Weather settings'}
            >
              <Settings size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* CRITICAL: Weather forecast grid with perfect alignment */}
      <div className={`sticky top-[73px] z-10 bg-white border-b border-gray-100 ${classes.container}`}>
        <div className={classes.grid}>
          {/* Empty cell to align with employee column */}
          <div className={classes.employeeHeader}>
            {/* Empty space to align with employee names column */}
          </div>
          
          {/* Weather data for each day */}
          {Array.from({ length: 7 }, (_, index) => {
            const date = addDays(weekStartDate, index);
            const weather = getWeatherForDate(date);
            
            return (
              <div key={index} className={`${classes.dayCell} hover:bg-gray-50 rounded transition-colors`}>
                {weather ? (
                  <>
                    {/* Weather icon */}
                    <div className="flex justify-center">
                      {renderWeatherIcon(weather)}
                    </div>
                    
                    {/* Temperature */}
                    <div className={`${classes.temp} font-medium text-gray-800 text-center`}>
                      {formatTemperature(weather.temp.min, weather.temp.max)}
                    </div>
                    
                    {/* Wind (if space allows) */}
                    {weather.wind && (responsive === 'lg' || responsive === 'xl') && (
                      <div className={`${classes.wind} text-gray-500 flex items-center justify-center`}>
                        <Wind size={10} className="mr-0.5" />
                        <span>{WeatherService.formatWind(weather.wind.speed, weather.wind.deg)}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className={`${classes.temp} text-gray-400 text-center`}>
                    {i18n.language === 'fr' ? 'N/A' : 'N/A'}
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Empty cell to align with weekly summary column */}
          <div className={classes.summaryHeader}>
            {/* Empty space to align with weekly summary column */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherForecast;