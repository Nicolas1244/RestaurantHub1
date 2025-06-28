// CRITICAL: Performance Analytics Service for Dashboard
import { PerformanceMetrics, POSData, Employee, Shift, KPIData, ChartDataPoint } from '../types';
import { calculateEmployeeWeeklySummary } from './scheduleUtils';
import { addDays, format, parseISO, startOfWeek, endOfWeek } from 'date-fns';

export class PerformanceAnalyticsService {
  private static instance: PerformanceAnalyticsService;

  private constructor() {}

  public static getInstance(): PerformanceAnalyticsService {
    if (!PerformanceAnalyticsService.instance) {
      PerformanceAnalyticsService.instance = new PerformanceAnalyticsService();
    }
    return PerformanceAnalyticsService.instance;
  }

  // CRITICAL: Calculate comprehensive performance metrics
  calculatePerformanceMetrics(
    posData: POSData[],
    employees: Employee[],
    shifts: Shift[],
    weekStartDate: Date,
    payBreakTimes: boolean = true
  ): PerformanceMetrics[] {
    console.log('📊 Calculating performance metrics...');

    return posData.map(dailyPOS => {
      const date = dailyPOS.date;
      
      // Calculate payroll metrics for this date
      const payrollMetrics = this.calculateDailyPayrollMetrics(
        employees,
        shifts,
        date,
        weekStartDate,
        payBreakTimes
      );

      // Calculate key performance indicators
      const staffCostRatio = dailyPOS.turnover > 0 
        ? (payrollMetrics.grossPayrollMass / dailyPOS.turnover) * 100 
        : 0;

      const averageHourlyCost = payrollMetrics.totalHoursWorked > 0 
        ? payrollMetrics.grossPayrollMass / payrollMetrics.totalHoursWorked 
        : 0;

      return {
        date,
        turnover: dailyPOS.turnover,
        covers: dailyPOS.covers,
        averageCheck: dailyPOS.averageCheck,
        grossPayrollMass: payrollMetrics.grossPayrollMass,
        staffCostRatio: Math.round(staffCostRatio * 100) / 100,
        totalHoursWorked: payrollMetrics.totalHoursWorked,
        averageHourlyCost: Math.round(averageHourlyCost * 100) / 100,
        scheduledHours: payrollMetrics.scheduledHours,
        overtimeHours: payrollMetrics.overtimeHours,
        absenceHours: payrollMetrics.absenceHours
      };
    });
  }

  // CRITICAL: Calculate daily payroll metrics
  private calculateDailyPayrollMetrics(
    employees: Employee[],
    shifts: Shift[],
    date: string,
    weekStartDate: Date,
    payBreakTimes: boolean
  ): {
    grossPayrollMass: number;
    totalHoursWorked: number;
    scheduledHours: number;
    overtimeHours: number;
    absenceHours: number;
  } {
    const targetDate = parseISO(date);
    const dayOfWeek = Math.floor((targetDate.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Get shifts for this specific day
    const dailyShifts = shifts.filter(shift => shift.day === dayOfWeek);
    
    let totalHoursWorked = 0;
    let scheduledHours = 0;
    let overtimeHours = 0;
    let absenceHours = 0;
    let grossPayrollMass = 0;

    // Standard hourly rates by position (in euros)
    const hourlyRates: Record<string, number> = {
      'Operations Manager': 25.00,
      'Chef de Cuisine': 18.00,
      'Second de Cuisine': 16.00,
      'Chef de Partie': 14.50,
      'Commis de Cuisine': 12.00,
      'Plongeur': 11.50,
      'Barman/Barmaid': 13.50,
      'Waiter(s)': 12.50
    };

    employees.forEach(employee => {
      const employeeShifts = dailyShifts.filter(shift => shift.employeeId === employee.id);
      
      if (employeeShifts.length > 0) {
        // Calculate weekly summary to get proper overtime calculation
        const weeklySummary = calculateEmployeeWeeklySummary(
          shifts.filter(s => s.employeeId === employee.id),
          employee.weeklyHours || 35,
          employee.startDate,
          employee.endDate,
          weekStartDate,
          payBreakTimes
        );

        // Calculate daily hours for this employee
        let dailyWorkedHours = 0;
        let dailyScheduledHours = 0;
        let dailyAbsenceHours = 0;

        employeeShifts.forEach(shift => {
          if (shift.status) {
            // Handle absence statuses
            const contractDailyHours = (employee.weeklyHours || 35) / 6; // Assuming 6-day work week
            
            if (shift.status === 'CP' || shift.status === 'PUBLIC_HOLIDAY') {
              dailyAbsenceHours += contractDailyHours;
              if (shift.status === 'CP') {
                dailyWorkedHours += contractDailyHours; // CP counts as worked hours
              }
            } else {
              dailyAbsenceHours += contractDailyHours;
            }
          } else if (shift.start && shift.end) {
            // Regular working shift
            const shiftHours = this.calculateShiftHours(shift.start, shift.end, payBreakTimes);
            dailyWorkedHours += shiftHours;
            dailyScheduledHours += shiftHours;
          }
        });

        // Calculate pay
        const hourlyRate = hourlyRates[employee.position] || 12.00;
        const socialCharges = 0.42; // 42% social charges in France
        
        // Base pay
        let dailyPay = dailyWorkedHours * hourlyRate;
        
        // Add overtime premium if applicable (simplified calculation)
        const dailyOvertimeHours = Math.max(0, dailyWorkedHours - 8); // Over 8 hours per day
        if (dailyOvertimeHours > 0) {
          dailyPay += dailyOvertimeHours * hourlyRate * 0.25; // 25% overtime premium
        }
        
        // Add social charges
        const dailyGrossPayroll = dailyPay * (1 + socialCharges);

        // Accumulate totals
        totalHoursWorked += dailyWorkedHours;
        scheduledHours += dailyScheduledHours;
        overtimeHours += dailyOvertimeHours;
        absenceHours += dailyAbsenceHours;
        grossPayrollMass += dailyGrossPayroll;
      }
    });

    return {
      grossPayrollMass: Math.round(grossPayrollMass * 100) / 100,
      totalHoursWorked: Math.round(totalHoursWorked * 100) / 100,
      scheduledHours: Math.round(scheduledHours * 100) / 100,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
      absenceHours: Math.round(absenceHours * 100) / 100
    };
  }

  // CRITICAL: Calculate shift hours with break consideration
  private calculateShiftHours(start: string, end: string, payBreakTimes: boolean): number {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    let hours = endHour - startHour;
    let minutes = endMin - startMin;
    
    // Handle overnight shifts
    if (hours < 0) {
      hours += 24;
    }
    
    const totalHours = hours + minutes / 60;
    
    // Apply break deduction if breaks are unpaid
    if (!payBreakTimes && totalHours > 6) {
      return totalHours - 0.5; // Subtract 30 minutes for unpaid break
    }
    
    return totalHours;
  }

  // CRITICAL: Generate KPI data with trends
  generateKPIData(
    current: PerformanceMetrics[],
    previous: PerformanceMetrics[],
    targets?: Record<string, number>
  ): Record<string, KPIData> {
    const currentTotals = this.aggregateMetrics(current);
    const previousTotals = this.aggregateMetrics(previous);

    const kpis: Record<string, KPIData> = {};

    // Turnover KPI
    kpis.turnover = {
      current: currentTotals.turnover,
      previous: previousTotals.turnover,
      target: targets?.turnover,
      trend: this.calculateTrend(currentTotals.turnover, previousTotals.turnover),
      trendPercentage: this.calculateTrendPercentage(currentTotals.turnover, previousTotals.turnover),
      unit: '€',
      format: 'currency'
    };

    // Staff Cost Ratio KPI
    kpis.staffCostRatio = {
      current: currentTotals.staffCostRatio,
      previous: previousTotals.staffCostRatio,
      target: targets?.staffCostRatio || 30, // 30% is a common target
      trend: this.calculateTrend(previousTotals.staffCostRatio, currentTotals.staffCostRatio), // Inverted for cost
      trendPercentage: this.calculateTrendPercentage(previousTotals.staffCostRatio, currentTotals.staffCostRatio),
      unit: '%',
      format: 'percentage'
    };

    // Average Check KPI
    kpis.averageCheck = {
      current: currentTotals.averageCheck,
      previous: previousTotals.averageCheck,
      target: targets?.averageCheck,
      trend: this.calculateTrend(currentTotals.averageCheck, previousTotals.averageCheck),
      trendPercentage: this.calculateTrendPercentage(currentTotals.averageCheck, previousTotals.averageCheck),
      unit: '€',
      format: 'currency'
    };

    // Covers KPI
    kpis.covers = {
      current: currentTotals.covers,
      previous: previousTotals.covers,
      target: targets?.covers,
      trend: this.calculateTrend(currentTotals.covers, previousTotals.covers),
      trendPercentage: this.calculateTrendPercentage(currentTotals.covers, previousTotals.covers),
      unit: '',
      format: 'number'
    };

    // Average Hourly Cost KPI
    kpis.averageHourlyCost = {
      current: currentTotals.averageHourlyCost,
      previous: previousTotals.averageHourlyCost,
      target: targets?.averageHourlyCost,
      trend: this.calculateTrend(previousTotals.averageHourlyCost, currentTotals.averageHourlyCost), // Inverted for cost
      trendPercentage: this.calculateTrendPercentage(previousTotals.averageHourlyCost, currentTotals.averageHourlyCost),
      unit: '€/h',
      format: 'currency'
    };

    return kpis;
  }

  // CRITICAL: Aggregate metrics for period
  private aggregateMetrics(metrics: PerformanceMetrics[]): PerformanceMetrics {
    if (metrics.length === 0) {
      return {
        date: '',
        turnover: 0,
        covers: 0,
        averageCheck: 0,
        grossPayrollMass: 0,
        staffCostRatio: 0,
        totalHoursWorked: 0,
        averageHourlyCost: 0,
        scheduledHours: 0,
        overtimeHours: 0,
        absenceHours: 0
      };
    }

    const totals = metrics.reduce((acc, metric) => ({
      date: '',
      turnover: acc.turnover + metric.turnover,
      covers: acc.covers + metric.covers,
      averageCheck: acc.averageCheck + metric.averageCheck,
      grossPayrollMass: acc.grossPayrollMass + metric.grossPayrollMass,
      staffCostRatio: acc.staffCostRatio + metric.staffCostRatio,
      totalHoursWorked: acc.totalHoursWorked + metric.totalHoursWorked,
      averageHourlyCost: acc.averageHourlyCost + metric.averageHourlyCost,
      scheduledHours: acc.scheduledHours + metric.scheduledHours,
      overtimeHours: acc.overtimeHours + metric.overtimeHours,
      absenceHours: acc.absenceHours + metric.absenceHours
    }));

    // Calculate averages for ratio-based metrics
    totals.averageCheck = totals.averageCheck / metrics.length;
    totals.staffCostRatio = totals.turnover > 0 ? (totals.grossPayrollMass / totals.turnover) * 100 : 0;
    totals.averageHourlyCost = totals.totalHoursWorked > 0 ? totals.grossPayrollMass / totals.totalHoursWorked : 0;

    return totals;
  }

  // CRITICAL: Calculate trend direction
  private calculateTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
    const threshold = 0.02; // 2% threshold for stability
    const change = (current - previous) / previous;
    
    if (Math.abs(change) < threshold) return 'stable';
    return change > 0 ? 'up' : 'down';
  }

  // CRITICAL: Calculate trend percentage
  private calculateTrendPercentage(current: number, previous: number): number {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100 * 100) / 100;
  }

  // CRITICAL: Generate chart data for various metrics
  generateChartData(
    metrics: PerformanceMetrics[],
    metric: keyof PerformanceMetrics,
    label?: string
  ): ChartDataPoint[] {
    return metrics.map(data => ({
      date: data.date,
      value: data[metric] as number,
      label: label || metric.toString()
    }));
  }

  // CRITICAL: Generate comparison data
  generateComparisonData(
    current: PerformanceMetrics[],
    previous: PerformanceMetrics[]
  ): {
    current: ChartDataPoint[];
    previous: ChartDataPoint[];
    variance: number;
  } {
    const currentData = this.generateChartData(current, 'turnover', 'Période actuelle');
    const previousData = this.generateChartData(previous, 'turnover', 'Période précédente');
    
    const currentTotal = current.reduce((sum, m) => sum + m.turnover, 0);
    const previousTotal = previous.reduce((sum, m) => sum + m.turnover, 0);
    const variance = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

    return {
      current: currentData,
      previous: previousData,
      variance: Math.round(variance * 100) / 100
    };
  }

  // CRITICAL: Calculate productivity metrics
  calculateProductivityMetrics(metrics: PerformanceMetrics[]): {
    revenuePerHour: number;
    revenuePerEmployee: number;
    coversPerHour: number;
    efficiency: number;
  } {
    const totals = this.aggregateMetrics(metrics);
    
    return {
      revenuePerHour: totals.totalHoursWorked > 0 ? totals.turnover / totals.totalHoursWorked : 0,
      revenuePerEmployee: metrics.length > 0 ? totals.turnover / metrics.length : 0,
      coversPerHour: totals.totalHoursWorked > 0 ? totals.covers / totals.totalHoursWorked : 0,
      efficiency: totals.scheduledHours > 0 ? (totals.totalHoursWorked / totals.scheduledHours) * 100 : 0
    };
  }

  // CRITICAL: Generate recommendations based on metrics
  generateRecommendations(metrics: PerformanceMetrics[]): string[] {
    const recommendations: string[] = [];
    const totals = this.aggregateMetrics(metrics);

    // Staff cost ratio analysis
    if (totals.staffCostRatio > 35) {
      recommendations.push('🔴 Ratio masse salariale élevé (>35%). Optimiser les plannings ou augmenter le CA.');
    } else if (totals.staffCostRatio < 25) {
      recommendations.push('🟡 Ratio masse salariale faible (<25%). Vérifier si le service est suffisant.');
    }

    // Average check analysis
    if (totals.averageCheck < 30) {
      recommendations.push('💰 Ticket moyen faible. Considérer des stratégies d\'upselling ou réviser la carte.');
    }

    // Overtime analysis
    if (totals.overtimeHours > totals.totalHoursWorked * 0.1) {
      recommendations.push('⏰ Heures supplémentaires élevées (>10%). Revoir l\'organisation du travail.');
    }

    // Productivity analysis
    const productivity = this.calculateProductivityMetrics(metrics);
    if (productivity.revenuePerHour < 80) {
      recommendations.push('📈 Productivité faible (<80€/h). Analyser l\'efficacité opérationnelle.');
    }

    return recommendations;
  }
}

// CRITICAL: Export singleton instance
export const performanceAnalyticsService = PerformanceAnalyticsService.getInstance();