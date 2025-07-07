import { Employee, Shift, DailyStatus } from '../types';
import { addDays, differenceInHours, parseISO, format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

// CRITICAL: French Labor Law Constants for CHR Sector
export const LABOR_LAW_CONSTANTS = {
  // Daily rest requirements
  MINIMUM_DAILY_REST_HOURS: 11, // Article L3131-1 Code du travail
  
  // Weekly rest requirements
  MINIMUM_WEEKLY_REST_HOURS: 35, // 24h + 11h daily rest
  WEEKLY_REST_MUST_INCLUDE_SUNDAY: true, // Default CHR requirement
  
  // Maximum working time
  MAXIMUM_DAILY_HOURS: 10, // Article L3121-18
  MAXIMUM_WEEKLY_HOURS: 48, // Article L3121-20
  MAXIMUM_AVERAGE_WEEKLY_HOURS_12_WEEKS: 44, // Article L3121-22
  
  // Consecutive working days
  MAXIMUM_CONSECUTIVE_WORKING_DAYS: 6, // Before mandatory rest
  
  // CHR specific overtime thresholds
  CHR_OVERTIME_THRESHOLD_110_PERCENT: 35, // 35h-39h = 110%
  CHR_OVERTIME_THRESHOLD_125_PERCENT: 39, // 39h+ = 125%
  
  // Working week structure
  STANDARD_WORKING_DAYS_PER_WEEK: 6, // Monday to Saturday
  
  // CRITICAL: Coupure (break) management
  MINIMUM_COUPURE_DURATION_MINUTES: 60, // Minimum break between services (CHR)
  MAXIMUM_COUPURE_DURATION_HOURS: 4, // Maximum break before considering separate workdays
} as const;

// CRITICAL: Violation severity levels
export type ViolationSeverity = 'critical' | 'warning' | 'info';

// CRITICAL: Violation types with French descriptions
export interface LaborLawViolation {
  id: string;
  type: 'daily_rest' | 'weekly_rest' | 'max_daily_hours' | 'max_weekly_hours' | 'consecutive_days' | 'contract_period' | 'coupure_violation';
  severity: ViolationSeverity;
  employeeId: string;
  employeeName: string;
  day?: number; // Day of week (0-6)
  message: string;
  suggestion: string;
  affectedShifts: string[]; // Shift IDs
  legalReference: string;
}

// CRITICAL: Rest period calculation result
export interface RestPeriodAnalysis {
  hasValidDailyRest: boolean;
  hasValidWeeklyRest: boolean;
  consecutiveWorkingDays: number;
  weeklyWorkingHours: number;
  violations: LaborLawViolation[];
  suggestions: string[];
}

// CRITICAL: Workday definition for proper daily rest calculation
interface Workday {
  day: number; // Day of week (0-6)
  shifts: Shift[]; // All shifts for this calendar day
  firstShiftStart: Date; // Start of first shift
  lastShiftEnd: Date; // End of last shift
  totalHours: number; // Total working hours for the day
  hasCoupure: boolean; // Whether there are breaks between shifts
}

// CRITICAL: Main validation class for French labor law compliance
export class FrenchLaborLawValidator {
  private employees: Employee[];
  private shifts: Shift[];
  private weekStartDate: Date;
  private violations: LaborLawViolation[] = [];

  constructor(employees: Employee[], shifts: Shift[], weekStartDate: Date) {
    this.employees = employees;
    this.shifts = shifts;
    this.weekStartDate = weekStartDate;
    this.violations = [];
  }

  // CRITICAL: Main validation method - analyzes all employees for the week
  public validateWeeklySchedule(): RestPeriodAnalysis[] {
    console.log('🔍 Starting French Labor Law validation for week:', format(this.weekStartDate, 'yyyy-MM-dd'));
    
    const results: RestPeriodAnalysis[] = [];
    this.violations = [];

    this.employees.forEach(employee => {
      const analysis = this.validateEmployeeWeek(employee);
      results.push(analysis);
      this.violations.push(...analysis.violations);
    });

    console.log('⚖️ Validation complete. Found', this.violations.length, 'violations');
    return results;
  }

  // CRITICAL: Validate individual employee for the week
  private validateEmployeeWeek(employee: Employee): RestPeriodAnalysis {
    console.log('👤 Validating employee:', employee.firstName, employee.lastName);

    const employeeShifts = this.getEmployeeShiftsForWeek(employee.id);
    const violations: LaborLawViolation[] = [];
    const suggestions: string[] = [];

    // 1. Check contract period validity
    const contractViolations = this.validateContractPeriod(employee, employeeShifts);
    violations.push(...contractViolations);

    // CRITICAL: 2. Check daily rest periods (11h minimum BETWEEN WORKDAYS, not shifts)
    const dailyRestViolations = this.validateDailyRestBetweenWorkdays(employee, employeeShifts);
    violations.push(...dailyRestViolations);

    // CRITICAL: 3. Check coupures (breaks within same workday) - separate validation
    const coupureViolations = this.validateCoupures(employee, employeeShifts);
    violations.push(...coupureViolations);

    // 4. Check weekly rest period (35h consecutive)
    const weeklyRestViolations = this.validateWeeklyRest(employee, employeeShifts);
    violations.push(...weeklyRestViolations);

    // 5. Check maximum daily working hours (10h max)
    const dailyHoursViolations = this.validateMaximumDailyHours(employee, employeeShifts);
    violations.push(...dailyHoursViolations);

    // 6. Check maximum weekly working hours (48h max)
    const weeklyHoursViolations = this.validateMaximumWeeklyHours(employee, employeeShifts);
    violations.push(...weeklyHoursViolations);

    // 7. Check consecutive working days (max 6 before rest)
    const consecutiveDaysViolations = this.validateConsecutiveWorkingDays(employee, employeeShifts);
    violations.push(...consecutiveDaysViolations);

    // Generate intelligent suggestions
    if (violations.length > 0) {
      suggestions.push(...this.generateComplianceSuggestions(employee, employeeShifts, violations));
    }

    const weeklyHours = this.calculateWeeklyWorkingHours(employeeShifts);
    const consecutiveDays = this.calculateConsecutiveWorkingDays(employeeShifts);

    return {
      hasValidDailyRest: !violations.some(v => v.type === 'daily_rest'),
      hasValidWeeklyRest: !violations.some(v => v.type === 'weekly_rest'),
      consecutiveWorkingDays: consecutiveDays,
      weeklyWorkingHours: weeklyHours,
      violations,
      suggestions
    };
  }

  // CRITICAL: NEW - Build workdays from shifts (groups shifts by calendar day)
  private buildWorkdaysFromShifts(shifts: Shift[]): Workday[] {
    console.log('🏗️ Building workdays from shifts...');
    
    // Filter only actual working shifts (exclude status-only shifts like absences)
    const workingShifts = shifts.filter(shift => 
      shift.start && shift.end && !shift.status
    );

    // Group shifts by calendar day
    const shiftsByDay = this.groupShiftsByDay(workingShifts);
    const workdays: Workday[] = [];

    Object.entries(shiftsByDay).forEach(([dayStr, dayShifts]) => {
      const day = parseInt(dayStr);
      
      // Sort shifts by start time for this day
      const sortedShifts = dayShifts.sort((a, b) => a.start.localeCompare(b.start));
      
      // Calculate workday boundaries
      const firstShiftStart = this.parseShiftDateTime(day, sortedShifts[0].start);
      const lastShiftEnd = this.parseShiftDateTime(day, sortedShifts[sortedShifts.length - 1].end);
      
      // Calculate total working hours for the day
      const totalHours = sortedShifts.reduce((total, shift) => {
        return total + this.calculateShiftHours(shift.start, shift.end);
      }, 0);

      // Determine if there are coupures (breaks between shifts)
      const hasCoupure = sortedShifts.length > 1;

      workdays.push({
        day,
        shifts: sortedShifts,
        firstShiftStart,
        lastShiftEnd,
        totalHours,
        hasCoupure
      });

      console.log(`📅 Workday ${day}:`, {
        shiftsCount: sortedShifts.length,
        firstStart: format(firstShiftStart, 'HH:mm'),
        lastEnd: format(lastShiftEnd, 'HH:mm'),
        totalHours: totalHours.toFixed(1),
        hasCoupure
      });
    });

    return workdays.sort((a, b) => a.day - b.day);
  }

  // CRITICAL: FIXED - Validate 11-hour daily rest requirement BETWEEN WORKDAYS
  private validateDailyRestBetweenWorkdays(employee: Employee, shifts: Shift[]): LaborLawViolation[] {
    console.log('🛌 Validating daily rest BETWEEN WORKDAYS (not between shifts within same day)...');
    
    const violations: LaborLawViolation[] = [];
    const workdays = this.buildWorkdaysFromShifts(shifts);

    // Check rest periods between consecutive workdays
    for (let i = 0; i < workdays.length - 1; i++) {
      const currentWorkday = workdays[i];
      const nextWorkday = workdays[i + 1];

      // CRITICAL: Calculate rest time from END of current workday to START of next workday
      const restHours = differenceInHours(nextWorkday.firstShiftStart, currentWorkday.lastShiftEnd);

      console.log(`🔍 Rest between workday ${currentWorkday.day} and ${nextWorkday.day}:`, {
        currentEnd: format(currentWorkday.lastShiftEnd, 'HH:mm'),
        nextStart: format(nextWorkday.firstShiftStart, 'HH:mm'),
        restHours: restHours.toFixed(1)
      });

      if (restHours < LABOR_LAW_CONSTANTS.MINIMUM_DAILY_REST_HOURS) {
        violations.push({
          id: `daily-rest-${employee.id}-${currentWorkday.day}-${nextWorkday.day}`,
          type: 'daily_rest',
          severity: 'critical',
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          day: nextWorkday.day,
          message: `Repos quotidien insuffisant : ${restHours.toFixed(1)}h au lieu de 11h minimum entre la fin du ${this.getDayName(currentWorkday.day)} (${format(currentWorkday.lastShiftEnd, 'HH:mm')}) et le début du ${this.getDayName(nextWorkday.day)} (${format(nextWorkday.firstShiftStart, 'HH:mm')})`,
          suggestion: `Décaler le premier service du ${this.getDayName(nextWorkday.day)} à ${format(addDays(currentWorkday.lastShiftEnd, 0).setHours(currentWorkday.lastShiftEnd.getHours() + 11), 'HH:mm')} ou terminer plus tôt le ${this.getDayName(currentWorkday.day)}`,
          affectedShifts: [...currentWorkday.shifts.map(s => s.id), ...nextWorkday.shifts.map(s => s.id)],
          legalReference: 'Article L3131-1 Code du travail - Repos quotidien entre journées de travail'
        });
      }
    }

    console.log(`✅ Daily rest validation complete. Found ${violations.length} violations.`);
    return violations;
  }

  // CRITICAL: NEW - Validate coupures (breaks within same workday) - separate from daily rest
  private validateCoupures(employee: Employee, shifts: Shift[]): LaborLawViolation[] {
    console.log('☕ Validating coupures (breaks within same workday)...');
    
    const violations: LaborLawViolation[] = [];
    const workdays = this.buildWorkdaysFromShifts(shifts);

    workdays.forEach(workday => {
      if (workday.hasCoupure && workday.shifts.length > 1) {
        // Check breaks between shifts within the same workday
        for (let i = 0; i < workday.shifts.length - 1; i++) {
          const currentShift = workday.shifts[i];
          const nextShift = workday.shifts[i + 1];

          const currentEnd = this.parseShiftDateTime(workday.day, currentShift.end);
          const nextStart = this.parseShiftDateTime(workday.day, nextShift.start);
          const breakMinutes = differenceInHours(nextStart, currentEnd) * 60;

          console.log(`☕ Coupure on day ${workday.day}:`, {
            between: `${currentShift.start}-${currentShift.end} and ${nextShift.start}-${nextShift.end}`,
            breakMinutes: breakMinutes.toFixed(0)
          });

          // Check minimum coupure duration (CHR requirement)
          if (breakMinutes < LABOR_LAW_CONSTANTS.MINIMUM_COUPURE_DURATION_MINUTES) {
            violations.push({
              id: `coupure-min-${employee.id}-${workday.day}-${i}`,
              type: 'coupure_violation',
              severity: 'warning',
              employeeId: employee.id,
              employeeName: `${employee.firstName} ${employee.lastName}`,
              day: workday.day,
              message: `Coupure trop courte le ${this.getDayName(workday.day)} : ${breakMinutes.toFixed(0)}min au lieu de ${LABOR_LAW_CONSTANTS.MINIMUM_COUPURE_DURATION_MINUTES}min minimum entre ${currentShift.start}-${currentShift.end} et ${nextShift.start}-${nextShift.end}`,
              suggestion: `Allonger la coupure à au moins ${LABOR_LAW_CONSTANTS.MINIMUM_COUPURE_DURATION_MINUTES}min ou grouper les services`,
              affectedShifts: [currentShift.id, nextShift.id],
              legalReference: 'Convention collective CHR - Durée minimale des coupures'
            });
          }

          // Check maximum coupure duration (beyond which it might be considered separate workdays)
          if (breakMinutes > LABOR_LAW_CONSTANTS.MAXIMUM_COUPURE_DURATION_HOURS * 60) {
            violations.push({
              id: `coupure-max-${employee.id}-${workday.day}-${i}`,
              type: 'coupure_violation',
              severity: 'info',
              employeeId: employee.id,
              employeeName: `${employee.firstName} ${employee.lastName}`,
              day: workday.day,
              message: `Coupure très longue le ${this.getDayName(workday.day)} : ${(breakMinutes/60).toFixed(1)}h entre ${currentShift.start}-${currentShift.end} et ${nextShift.start}-${nextShift.end}`,
              suggestion: `Vérifier si cette longue coupure est justifiée ou considérer comme deux journées de travail distinctes`,
              affectedShifts: [currentShift.id, nextShift.id],
              legalReference: 'Convention collective CHR - Gestion des coupures prolongées'
            });
          }
        }
      }
    });

    console.log(`✅ Coupure validation complete. Found ${violations.length} violations.`);
    return violations;
  }

  // CRITICAL: Validate contract period compliance
  private validateContractPeriod(employee: Employee, shifts: Shift[]): LaborLawViolation[] {
    const violations: LaborLawViolation[] = [];
    const contractStart = parseISO(employee.startDate);
    const contractEnd = employee.endDate ? parseISO(employee.endDate) : null;

    shifts.forEach(shift => {
      const shiftDate = addDays(this.weekStartDate, shift.day);
      
      // Check if shift is before contract start
      if (shiftDate < contractStart) {
        violations.push({
          id: `contract-start-${employee.id}-${shift.day}`,
          type: 'contract_period',
          severity: 'critical',
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          day: shift.day,
          message: `Service planifié avant le début du contrat (${format(contractStart, 'd MMMM yyyy', { locale: fr })})`,
          suggestion: `Supprimer ce service ou modifier la date de début du contrat`,
          affectedShifts: [shift.id],
          legalReference: 'Code du travail - Période contractuelle'
        });
      }

      // Check if shift is after contract end
      if (contractEnd && shiftDate > contractEnd) {
        violations.push({
          id: `contract-end-${employee.id}-${shift.day}`,
          type: 'contract_period',
          severity: 'critical',
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          day: shift.day,
          message: `Service planifié après la fin du contrat (${format(contractEnd, 'd MMMM yyyy', { locale: fr })})`,
          suggestion: `Supprimer ce service ou prolonger le contrat`,
          affectedShifts: [shift.id],
          legalReference: 'Code du travail - Période contractuelle'
        });
      }
    });

    return violations;
  }

  // CRITICAL: Validate 35-hour weekly rest requirement
  private validateWeeklyRest(employee: Employee, shifts: Shift[]): LaborLawViolation[] {
    const violations: LaborLawViolation[] = [];
    
    // Check if employee has any rest day in the week
    const workingDays = new Set(
      shifts
        .filter(shift => shift.start && shift.end && !shift.status)
        .map(shift => shift.day)
    );

    const restDays = new Set(
      shifts
        .filter(shift => shift.status === 'WEEKLY_REST')
        .map(shift => shift.day)
    );

    // If working 6 or 7 days without designated rest, it's a violation
    if (workingDays.size >= 6 && restDays.size === 0) {
      violations.push({
        id: `weekly-rest-${employee.id}`,
        type: 'weekly_rest',
        severity: 'critical',
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        message: `Repos hebdomadaire manquant : ${workingDays.size} jours de travail sans repos de 35h consécutives`,
        suggestion: `Planifier un repos hebdomadaire de 35h consécutives, de préférence incluant le dimanche`,
        affectedShifts: shifts.map(s => s.id),
        legalReference: 'Article L3132-2 Code du travail + Convention CHR'
      });
    }

    // Check if Sunday rest is respected (CHR preference)
    if (workingDays.has(6) && !restDays.has(6)) { // Sunday = day 6
      violations.push({
        id: `sunday-rest-${employee.id}`,
        type: 'weekly_rest',
        severity: 'warning',
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        day: 6,
        message: `Travail le dimanche sans repos compensateur désigné`,
        suggestion: `Prévoir un repos compensateur ou justifier le travail dominical selon la convention CHR`,
        affectedShifts: shifts.filter(s => s.day === 6).map(s => s.id),
        legalReference: 'Convention collective CHR - Repos dominical'
      });
    }

    return violations;
  }

  // CRITICAL: Validate maximum 10 hours per day
  private validateMaximumDailyHours(employee: Employee, shifts: Shift[]): LaborLawViolation[] {
    const violations: LaborLawViolation[] = [];
    const workdays = this.buildWorkdaysFromShifts(shifts);

    workdays.forEach(workday => {
      if (workday.totalHours > LABOR_LAW_CONSTANTS.MAXIMUM_DAILY_HOURS) {
        violations.push({
          id: `daily-hours-${employee.id}-${workday.day}`,
          type: 'max_daily_hours',
          severity: 'critical',
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          day: workday.day,
          message: `Dépassement du temps de travail quotidien : ${workday.totalHours.toFixed(1)}h au lieu de 10h maximum le ${this.getDayName(workday.day)}`,
          suggestion: `Réduire les heures du ${this.getDayName(workday.day)} ou répartir sur plusieurs jours`,
          affectedShifts: workday.shifts.map(s => s.id),
          legalReference: 'Article L3121-18 Code du travail'
        });
      }
    });

    return violations;
  }

  // CRITICAL: Validate maximum 48 hours per week
  private validateMaximumWeeklyHours(employee: Employee, shifts: Shift[]): LaborLawViolation[] {
    const violations: LaborLawViolation[] = [];
    const weeklyHours = this.calculateWeeklyWorkingHours(shifts);

    if (weeklyHours > LABOR_LAW_CONSTANTS.MAXIMUM_WEEKLY_HOURS) {
      violations.push({
        id: `weekly-hours-${employee.id}`,
        type: 'max_weekly_hours',
        severity: 'critical',
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        message: `Dépassement du temps de travail hebdomadaire : ${weeklyHours.toFixed(1)}h au lieu de 48h maximum`,
        suggestion: `Réduire les heures de travail ou répartir sur plusieurs semaines`,
        affectedShifts: shifts.map(s => s.id),
        legalReference: 'Article L3121-20 Code du travail'
      });
    }

    return violations;
  }

  // CRITICAL: Validate maximum 6 consecutive working days
  private validateConsecutiveWorkingDays(employee: Employee, shifts: Shift[]): LaborLawViolation[] {
    const violations: LaborLawViolation[] = [];
    const consecutiveDays = this.calculateConsecutiveWorkingDays(shifts);

    if (consecutiveDays > LABOR_LAW_CONSTANTS.MAXIMUM_CONSECUTIVE_WORKING_DAYS) {
      violations.push({
        id: `consecutive-days-${employee.id}`,
        type: 'consecutive_days',
        severity: 'critical',
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        message: `Trop de jours consécutifs : ${consecutiveDays} jours au lieu de 6 maximum`,
        suggestion: `Insérer un jour de repos après 6 jours de travail consécutifs`,
        affectedShifts: shifts.map(s => s.id),
        legalReference: 'Article L3132-1 Code du travail'
      });
    }

    return violations;
  }

  // CRITICAL: Generate intelligent compliance suggestions
  private generateComplianceSuggestions(employee: Employee, shifts: Shift[], violations: LaborLawViolation[]): string[] {
    const suggestions: string[] = [];

    // Daily rest suggestions
    const dailyRestViolations = violations.filter(v => v.type === 'daily_rest');
    if (dailyRestViolations.length > 0) {
      suggestions.push('💡 Conseil repos quotidien : Respecter 11h de repos entre la fin d\'une journée de travail et le début de la suivante');
    }

    // Coupure suggestions
    const coupureViolations = violations.filter(v => v.type === 'coupure_violation');
    if (coupureViolations.length > 0) {
      suggestions.push('💡 Conseil coupures : Les pauses entre services doivent durer au moins 1h selon la convention CHR');
    }

    // Weekly rest suggestions
    const weeklyRestViolations = violations.filter(v => v.type === 'weekly_rest');
    if (weeklyRestViolations.length > 0) {
      suggestions.push('💡 Conseil repos hebdomadaire : Planifier 35h de repos consécutives, idéalement du samedi soir au lundi matin');
    }

    // Daily hours suggestions
    const dailyHoursViolations = violations.filter(v => v.type === 'max_daily_hours');
    if (dailyHoursViolations.length > 0) {
      suggestions.push('💡 Conseil heures quotidiennes : Limiter à 10h/jour ou demander une dérogation préfectorale');
    }

    // Weekly hours suggestions
    const weeklyHoursViolations = violations.filter(v => v.type === 'max_weekly_hours');
    if (weeklyHoursViolations.length > 0) {
      suggestions.push('💡 Conseil heures hebdomadaires : Respecter 48h maximum ou étaler sur plusieurs semaines');
    }

    return suggestions;
  }

  // CRITICAL: Helper methods for calculations

  private getEmployeeShiftsForWeek(employeeId: string): Shift[] {
    return this.shifts.filter(shift => shift.employeeId === employeeId);
  }

  private parseShiftDateTime(day: number, time: string): Date {
    const shiftDate = addDays(this.weekStartDate, day);
    
    // Validate time string format and extract hours/minutes
    if (!time || typeof time !== 'string' || !time.includes(':')) {
      console.warn(`Invalid time format: "${time}". Using start of day as fallback.`);
      shiftDate.setHours(0, 0, 0, 0);
      return shiftDate;
    }
    
    const timeParts = time.split(':');
    if (timeParts.length !== 2) {
      console.warn(`Invalid time format: "${time}". Expected HH:MM format. Using start of day as fallback.`);
      shiftDate.setHours(0, 0, 0, 0);
      return shiftDate;
    }
    
    const hours = Number(timeParts[0]);
    const minutes = Number(timeParts[1]);
    
    // Validate that hours and minutes are valid numbers
    if (isNaN(hours) || isNaN(minutes)) {
      console.warn(`Invalid time values: hours="${timeParts[0]}", minutes="${timeParts[1]}". Using start of day as fallback.`);
      shiftDate.setHours(0, 0, 0, 0);
      return shiftDate;
    }
    
    // Validate hour and minute ranges
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.warn(`Time values out of range: hours=${hours}, minutes=${minutes}. Using start of day as fallback.`);
      shiftDate.setHours(0, 0, 0, 0);
      return shiftDate;
    }
    
    // Handle overnight shifts (e.g., ending at 02:00 next day)
    if (hours < 6) { // Assume times before 6 AM are next day
      shiftDate.setDate(shiftDate.getDate() + 1);
    }
    
    shiftDate.setHours(hours, minutes, 0, 0);
    return shiftDate;
  }

  private calculateWeeklyWorkingHours(shifts: Shift[]): number {
    return shifts
      .filter(shift => shift.start && shift.end && !shift.status)
      .reduce((total, shift) => {
        const hours = this.calculateShiftHours(shift.start, shift.end);
        return total + hours;
      }, 0);
  }

  private calculateConsecutiveWorkingDays(shifts: Shift[]): number {
    const workingDays = shifts
      .filter(shift => shift.start && shift.end && !shift.status)
      .map(shift => shift.day)
      .sort((a, b) => a - b);

    if (workingDays.length === 0) return 0;

    let maxConsecutive = 1;
    let currentConsecutive = 1;

    for (let i = 1; i < workingDays.length; i++) {
      if (workingDays[i] === workingDays[i - 1] + 1) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 1;
      }
    }

    return maxConsecutive;
  }

  private calculateShiftHours(start: string, end: string): number {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    let hours = endHour - startHour;
    let minutes = endMin - startMin;
    
    // Handle overnight shifts
    if (hours < 0) {
      hours += 24;
    }
    
    return hours + minutes / 60;
  }

  private groupShiftsByDay(shifts: Shift[]): Record<number, Shift[]> {
    return shifts.reduce((groups, shift) => {
      if (!groups[shift.day]) {
        groups[shift.day] = [];
      }
      groups[shift.day].push(shift);
      return groups;
    }, {} as Record<number, Shift[]>);
  }

  private getDayName(day: number): string {
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    return days[day] || `Jour ${day}`;
  }

  // CRITICAL: Public method to get all violations
  public getAllViolations(): LaborLawViolation[] {
    return this.violations;
  }

  // CRITICAL: Get violations by severity
  public getViolationsBySeverity(severity: ViolationSeverity): LaborLawViolation[] {
    return this.violations.filter(v => v.severity === severity);
  }

  // CRITICAL: Check if schedule is compliant
  public isScheduleCompliant(): boolean {
    return this.violations.filter(v => v.severity === 'critical').length === 0;
  }
}

// CRITICAL: Export utility functions for UI integration
export const formatViolationMessage = (violation: LaborLawViolation): string => {
  return `⚠️ ${violation.message}`;
};

export const getViolationIcon = (severity: ViolationSeverity): string => {
  switch (severity) {
    case 'critical': return '🔴';
    case 'warning': return '🟠';
    case 'info': return '🔵';
    default: return '⚪';
  }
};

export const getViolationColor = (severity: ViolationSeverity): string => {
  switch (severity) {
    case 'critical': return 'text-red-600 bg-red-50 border-red-200';
    case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};