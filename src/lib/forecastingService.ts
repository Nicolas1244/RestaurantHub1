// CRITICAL: Forecasting Service for Performance Dashboard
import { POSData, ForecastData, ForecastingModel } from '../types';
import { addDays, subDays, format, getDay, isSameDay, parseISO } from 'date-fns';

export class ForecastingService {
  private static instance: ForecastingService;
  private models: Map<string, ForecastingModel> = new Map();

  private constructor() {
    this.initializeDefaultModels();
  }

  public static getInstance(): ForecastingService {
    if (!ForecastingService.instance) {
      ForecastingService.instance = new ForecastingService();
    }
    return ForecastingService.instance;
  }

  // CRITICAL: Initialize default forecasting models
  private initializeDefaultModels(): void {
    // Historical model (primary)
    this.models.set('historical', {
      type: 'historical',
      accuracy: 78.5,
      lastUpdated: new Date().toISOString(),
      parameters: {
        lookbackDays: 365,
        weightDecay: 0.95,
        seasonalAdjustment: true,
        dayTypeWeighting: {
          weekday: 1.0,
          weekend: 1.2,
          holiday: 0.8
        }
      }
    });

    // Seasonal model (secondary)
    this.models.set('seasonal', {
      type: 'seasonal',
      accuracy: 72.3,
      lastUpdated: new Date().toISOString(),
      parameters: {
        seasonalPeriods: [7, 30, 365], // Weekly, monthly, yearly patterns
        trendWeight: 0.3,
        seasonalWeight: 0.7
      }
    });
  }

  // CRITICAL: Generate forecast for a specific date
  async generateForecast(
    targetDate: string,
    historicalData: POSData[],
    model: 'historical' | 'seasonal' | 'auto' = 'auto'
  ): Promise<ForecastData> {
    console.log('🔮 Generating forecast for:', targetDate);

    const selectedModel = model === 'auto' ? this.selectBestModel(historicalData) : model;
    
    switch (selectedModel) {
      case 'historical':
        return this.generateHistoricalForecast(targetDate, historicalData);
      case 'seasonal':
        return this.generateSeasonalForecast(targetDate, historicalData);
      default:
        return this.generateHistoricalForecast(targetDate, historicalData);
    }
  }

  // CRITICAL: Historical forecasting based on same day previous year and recent averages
  private generateHistoricalForecast(targetDate: string, historicalData: POSData[]): ForecastData {
    const target = parseISO(targetDate);
    const dayOfWeek = getDay(target);
    
    // Find same date last year
    const lastYear = subDays(target, 365);
    const lastYearData = historicalData.find(data => 
      isSameDay(parseISO(data.date), lastYear)
    );

    // Find recent same-day-of-week averages (last 4 weeks)
    const recentSameDays = historicalData
      .filter(data => {
        const dataDate = parseISO(data.date);
        const daysDiff = Math.abs((target.getTime() - dataDate.getTime()) / (1000 * 60 * 60 * 24));
        return getDay(dataDate) === dayOfWeek && daysDiff <= 28 && daysDiff > 0;
      })
      .slice(-4); // Last 4 occurrences

    // Calculate weighted forecast
    let forecastedTurnover = 0;
    let forecastedCovers = 0;
    let confidence = 50;
    const factors: string[] = [];

    if (lastYearData) {
      // Weight: 40% from same date last year
      forecastedTurnover += lastYearData.turnover * 0.4;
      forecastedCovers += lastYearData.covers * 0.4;
      confidence += 20;
      factors.push(`Même date année précédente (${format(lastYear, 'dd/MM/yyyy')})`);
    }

    if (recentSameDays.length > 0) {
      // Weight: 60% from recent same days average
      const avgTurnover = recentSameDays.reduce((sum, data) => sum + data.turnover, 0) / recentSameDays.length;
      const avgCovers = recentSameDays.reduce((sum, data) => sum + data.covers, 0) / recentSameDays.length;
      
      const recentWeight = lastYearData ? 0.6 : 1.0;
      forecastedTurnover += avgTurnover * recentWeight;
      forecastedCovers += avgCovers * recentWeight;
      confidence += recentSameDays.length * 5;
      factors.push(`Moyenne des ${recentSameDays.length} derniers ${this.getDayName(dayOfWeek)}`);
    }

    // Apply seasonal adjustments
    const seasonalMultiplier = this.getSeasonalMultiplier(target);
    forecastedTurnover *= seasonalMultiplier;
    forecastedCovers *= seasonalMultiplier;

    if (seasonalMultiplier !== 1.0) {
      factors.push(`Ajustement saisonnier (${(seasonalMultiplier * 100).toFixed(0)}%)`);
    }

    // Apply day type adjustments
    const dayTypeMultiplier = this.getDayTypeMultiplier(target);
    forecastedTurnover *= dayTypeMultiplier;
    forecastedCovers *= dayTypeMultiplier;

    if (dayTypeMultiplier !== 1.0) {
      factors.push(`Ajustement type de jour (${(dayTypeMultiplier * 100).toFixed(0)}%)`);
    }

    // Ensure minimum confidence and realistic bounds
    confidence = Math.min(95, Math.max(30, confidence));
    forecastedTurnover = Math.max(500, Math.round(forecastedTurnover));
    forecastedCovers = Math.max(10, Math.round(forecastedCovers));

    return {
      date: targetDate,
      forecastedTurnover,
      forecastedCovers,
      confidence,
      basedOn: 'historical',
      factors
    };
  }

  // CRITICAL: Seasonal forecasting based on patterns
  private generateSeasonalForecast(targetDate: string, historicalData: POSData[]): ForecastData {
    const target = parseISO(targetDate);
    
    // Calculate seasonal trends
    const weeklyPattern = this.calculateWeeklyPattern(historicalData);
    const monthlyPattern = this.calculateMonthlyPattern(historicalData);
    
    const dayOfWeek = getDay(target);
    const month = target.getMonth();
    
    // Base forecast on overall average
    const avgTurnover = historicalData.reduce((sum, data) => sum + data.turnover, 0) / historicalData.length;
    const avgCovers = historicalData.reduce((sum, data) => sum + data.covers, 0) / historicalData.length;
    
    // Apply patterns
    const weeklyMultiplier = weeklyPattern[dayOfWeek] || 1.0;
    const monthlyMultiplier = monthlyPattern[month] || 1.0;
    
    const forecastedTurnover = Math.round(avgTurnover * weeklyMultiplier * monthlyMultiplier);
    const forecastedCovers = Math.round(avgCovers * weeklyMultiplier * monthlyMultiplier);
    
    return {
      date: targetDate,
      forecastedTurnover,
      forecastedCovers,
      confidence: 65,
      basedOn: 'seasonal',
      factors: [
        `Tendance hebdomadaire (${this.getDayName(dayOfWeek)})`,
        `Tendance mensuelle (${this.getMonthName(month)})`
      ]
    };
  }

  // CRITICAL: Calculate weekly patterns
  private calculateWeeklyPattern(data: POSData[]): Record<number, number> {
    const dayTotals: Record<number, { sum: number; count: number }> = {};
    
    data.forEach(item => {
      const dayOfWeek = getDay(parseISO(item.date));
      if (!dayTotals[dayOfWeek]) {
        dayTotals[dayOfWeek] = { sum: 0, count: 0 };
      }
      dayTotals[dayOfWeek].sum += item.turnover;
      dayTotals[dayOfWeek].count += 1;
    });
    
    const overallAvg = data.reduce((sum, item) => sum + item.turnover, 0) / data.length;
    const pattern: Record<number, number> = {};
    
    Object.keys(dayTotals).forEach(day => {
      const dayNum = parseInt(day);
      const dayAvg = dayTotals[dayNum].sum / dayTotals[dayNum].count;
      pattern[dayNum] = dayAvg / overallAvg;
    });
    
    return pattern;
  }

  // CRITICAL: Calculate monthly patterns
  private calculateMonthlyPattern(data: POSData[]): Record<number, number> {
    const monthTotals: Record<number, { sum: number; count: number }> = {};
    
    data.forEach(item => {
      const month = parseISO(item.date).getMonth();
      if (!monthTotals[month]) {
        monthTotals[month] = { sum: 0, count: 0 };
      }
      monthTotals[month].sum += item.turnover;
      monthTotals[month].count += 1;
    });
    
    const overallAvg = data.reduce((sum, item) => sum + item.turnover, 0) / data.length;
    const pattern: Record<number, number> = {};
    
    Object.keys(monthTotals).forEach(month => {
      const monthNum = parseInt(month);
      const monthAvg = monthTotals[monthNum].sum / monthTotals[monthNum].count;
      pattern[monthNum] = monthAvg / overallAvg;
    });
    
    return pattern;
  }

  // CRITICAL: Get seasonal multiplier based on date
  private getSeasonalMultiplier(date: Date): number {
    const month = date.getMonth();
    
    // French restaurant seasonal patterns
    const seasonalMultipliers: Record<number, number> = {
      0: 0.85,  // January - post-holiday slowdown
      1: 0.90,  // February - winter
      2: 0.95,  // March - spring pickup
      3: 1.05,  // April - spring
      4: 1.10,  // May - good weather
      5: 1.15,  // June - summer season
      6: 1.20,  // July - peak summer
      7: 1.15,  // August - summer (some vacation impact)
      8: 1.05,  // September - back to school
      9: 1.10,  // October - autumn
      10: 1.05, // November - pre-holiday
      11: 1.25  // December - holiday season
    };
    
    return seasonalMultipliers[month] || 1.0;
  }

  // CRITICAL: Get day type multiplier
  private getDayTypeMultiplier(date: Date): number {
    const dayOfWeek = getDay(date);
    
    // Check if it's a holiday (simplified - in production, use a holiday API)
    const isHoliday = this.isHoliday(date);
    
    if (isHoliday) {
      return 0.7; // Holidays typically slower
    }
    
    // Weekend vs weekday multipliers
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 1.15; // Weekends typically busier
    }
    
    return 1.0; // Regular weekday
  }

  // CRITICAL: Simple holiday detection (expand in production)
  private isHoliday(date: Date): boolean {
    const month = date.getMonth();
    const day = date.getDate();
    
    // Major French holidays
    const holidays = [
      { month: 0, day: 1 },   // New Year
      { month: 4, day: 1 },   // Labor Day
      { month: 4, day: 8 },   // Victory Day
      { month: 6, day: 14 },  // Bastille Day
      { month: 7, day: 15 },  // Assumption
      { month: 10, day: 1 },  // All Saints
      { month: 10, day: 11 }, // Armistice
      { month: 11, day: 25 }  // Christmas
    ];
    
    return holidays.some(holiday => holiday.month === month && holiday.day === day);
  }

  // CRITICAL: Select best model based on data quality
  private selectBestModel(data: POSData[]): 'historical' | 'seasonal' {
    if (data.length < 30) {
      return 'seasonal'; // Not enough data for historical
    }
    
    if (data.length > 365) {
      return 'historical'; // Enough data for year-over-year comparison
    }
    
    return 'seasonal'; // Default to seasonal for medium datasets
  }

  // CRITICAL: Generate multiple day forecast
  async generateMultiDayForecast(
    startDate: string,
    days: number,
    historicalData: POSData[]
  ): Promise<ForecastData[]> {
    const forecasts: ForecastData[] = [];
    
    for (let i = 0; i < days; i++) {
      const targetDate = format(addDays(parseISO(startDate), i), 'yyyy-MM-dd');
      const forecast = await this.generateForecast(targetDate, historicalData);
      forecasts.push(forecast);
    }
    
    return forecasts;
  }

  // CRITICAL: Update model accuracy based on actual results
  updateModelAccuracy(modelType: string, actualData: POSData[], forecastData: ForecastData[]): void {
    const model = this.models.get(modelType);
    if (!model) return;

    let totalError = 0;
    let validComparisons = 0;

    forecastData.forEach(forecast => {
      const actual = actualData.find(data => data.date === forecast.date);
      if (actual) {
        const turnoverError = Math.abs(actual.turnover - forecast.forecastedTurnover) / actual.turnover;
        const coversError = Math.abs(actual.covers - forecast.forecastedCovers) / actual.covers;
        totalError += (turnoverError + coversError) / 2;
        validComparisons++;
      }
    });

    if (validComparisons > 0) {
      const accuracy = Math.max(0, 100 - (totalError / validComparisons * 100));
      model.accuracy = Math.round(accuracy * 10) / 10;
      model.lastUpdated = new Date().toISOString();
      
      console.log(`📊 Updated ${modelType} model accuracy: ${model.accuracy}%`);
    }
  }

  // CRITICAL: Helper methods
  private getDayName(dayOfWeek: number): string {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return days[dayOfWeek];
  }

  private getMonthName(month: number): string {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[month];
  }

  // CRITICAL: Get model information
  getModel(type: string): ForecastingModel | null {
    return this.models.get(type) || null;
  }

  // CRITICAL: Get all models
  getAllModels(): ForecastingModel[] {
    return Array.from(this.models.values());
  }
}

// CRITICAL: Export singleton instance
export const forecastingService = ForecastingService.getInstance();