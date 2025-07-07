import { Shift, DailyStatus } from '../types';
import { addDays, parseISO, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';

export const calculateTimeInHours = (start: string, end: string): number => {
  if (!start || !end) return 0;
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);
  const adjustedEndHour = endHour < startHour ? endHour + 24 : endHour;
  
  // Return the gross scheduled hours without any break deduction
  // Break deduction will be handled in calculateEmployeeWeeklySummary based on settings
  return (adjustedEndHour - startHour) + (endMin - startMin) / 60;
};

// CRITICAL: New function to calculate pro-rated contract hours for a specific week
export const calculateProRatedContractHours = (
  employeeStartDate: string,
  employeeEndDate: string | null,
  weekStartDate: Date,
  weeklyContractHours: number
): number => {
  console.log('🧮 Calculating pro-rated hours for:', {
    employeeStartDate,
    employeeEndDate,
    weekStartDate: weekStartDate.toISOString().split('T')[0],
    weeklyContractHours
  });

  const contractStart = parseISO(employeeStartDate);
  const contractEnd = employeeEndDate ? parseISO(employeeEndDate) : null;
  
  // Get the week boundaries (Monday to Sunday)
  const weekStart = startOfWeek(weekStartDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekStartDate, { weekStartsOn: 1 });
  
  console.log('📅 Week boundaries:', {
    weekStart: weekStart.toISOString().split('T')[0],
    weekEnd: weekEnd.toISOString().split('T')[0]
  });

  // Determine the actual working period within this week
  const workingPeriodStart = contractStart > weekStart ? contractStart : weekStart;
  const workingPeriodEnd = (contractEnd && contractEnd < weekEnd) ? contractEnd : weekEnd;
  
  console.log('⏰ Working period within week:', {
    workingPeriodStart: workingPeriodStart.toISOString().split('T')[0],
    workingPeriodEnd: workingPeriodEnd.toISOString().split('T')[0]
  });

  // If the working period is invalid (end before start), return 0
  if (workingPeriodEnd < workingPeriodStart) {
    console.log('❌ Invalid working period - employee not active during this week');
    return 0;
  }

  // Calculate the number of working days in the week
  // Standard working week is 6 days (Monday to Saturday) as per French restaurant industry
  const totalWorkingDaysInWeek = 6;
  const dailyContractHours = weeklyContractHours / totalWorkingDaysInWeek;
  
  console.log('📊 Contract breakdown:', {
    totalWorkingDaysInWeek,
    dailyContractHours: dailyContractHours.toFixed(2)
  });

  // Count the actual working days within the working period
  let workingDaysInPeriod = 0;
  
  // Iterate through each day of the week (Monday = 1, Sunday = 0)
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const currentDay = addDays(weekStart, dayOffset);
    const dayOfWeek = currentDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Check if this day is within the working period
    const isWithinWorkingPeriod = isWithinInterval(currentDay, {
      start: workingPeriodStart,
      end: workingPeriodEnd
    });
    
    // Count working days (Monday to Saturday, excluding Sunday)
    if (isWithinWorkingPeriod && dayOfWeek !== 0) { // Exclude Sunday (dayOfWeek = 0)
      workingDaysInPeriod++;
      console.log(`✅ Day ${dayOffset} (${currentDay.toISOString().split('T')[0]}) is a working day`);
    } else {
      console.log(`❌ Day ${dayOffset} (${currentDay.toISOString().split('T')[0]}) is NOT a working day - ${!isWithinWorkingPeriod ? 'outside working period' : 'Sunday'}`);
    }
  }
  
  // Calculate pro-rated hours
  const proRatedHours = workingDaysInPeriod * dailyContractHours;
  
  console.log('🎯 Pro-rated calculation result for employee:', {
    workingDaysInPeriod,
    dailyContractHours: dailyContractHours.toFixed(2),
    proRatedHours: proRatedHours.toFixed(2),
    originalWeeklyHours: weeklyContractHours
  });

  return proRatedHours;
};

// CRITICAL: Enhanced function with break payment setting integration
export const calculateEmployeeWeeklySummary = (
  shifts: Shift[],
  weeklyContractHours: number,
  employeeStartDate: string,
  employeeEndDate: string | null,
  weekStartDate: Date,
  payBreakTimes: boolean = true // CRITICAL: New parameter for break payment setting
) => {
  console.log('📋 Starting weekly summary calculation for employee:', {
    shiftsCount: shifts.length,
    weeklyContractHours,
    employeeStartDate,
    employeeEndDate,
    weekStartDate: weekStartDate.toISOString().split('T')[0],
    payBreakTimes // CRITICAL: Log the break payment setting
  });

  // CRITICAL: Calculate pro-rated contract hours for this specific week
  const proRatedContractHours = calculateProRatedContractHours(
    employeeStartDate,
    employeeEndDate,
    weekStartDate,
    weeklyContractHours
  );

  console.log('🎯 Pro-rated contract hours for this week:', proRatedContractHours.toFixed(2));

  // Initialize counters
  let totalWorkedHours = 0; // ONLY actual hours worked (including Férié hours if scheduled)
  let totalAssimilatedHours = 0; // ONLY for CP days
  let totalPublicHolidayHours = 0; // Track Férié (1er Mai) hours separately for display
  let shiftCount = 0; // Count only valid services

  // Calculate daily contract hours (based on 6-day week as specified)
  const dailyContractHours = proRatedContractHours / 6;

  // Initialize arrays for each day
  const dailyHours = new Array(7).fill(0);
  const dailyStatus = new Array(7).fill<DailyStatus | null>(null);

  // CRITICAL: Group shifts by day to handle multiple shifts per day
  const shiftsByDay: Record<number, Shift[]> = {};
  shifts.forEach(shift => {
    if (!shiftsByDay[shift.day]) {
      shiftsByDay[shift.day] = [];
    }
    shiftsByDay[shift.day].push(shift);
  });

  // First pass: Calculate actual worked hours and store statuses
  Object.entries(shiftsByDay).forEach(([dayStr, dayShifts]) => {
    const day = parseInt(dayStr);
    
    // Get status and isHolidayWorked flag from any shift for this day
    const status = dayShifts.find(s => s.status)?.status;
    const hasHolidayWorked = dayShifts.some(s => s.isHolidayWorked);
    if (status) {
      dailyStatus[day] = status;
    }

    // Calculate total hours for this day from all shifts
    let dayTotalHours = 0;
    dayShifts.forEach(shift => {
      if (shift.start && shift.end) {
        let hours = calculateTimeInHours(shift.start, shift.end);
        
        // CRITICAL: Apply break payment setting
        if (!payBreakTimes) { // If breaks are not paid, subtract break time
          // If breaks are unpaid, we need to subtract break time
          // For now, we'll use a simplified approach: subtract 30 minutes for shifts > 6 hours
          // In a production system, you might want more sophisticated break calculation
          if (hours > 6) {
            hours -= 0.5; // Subtract 30 minutes for unpaid break
            console.log(`💰 Unpaid break applied: -0.5h for shift ${shift.start}-${shift.end}`);
          }
        }
        
        dayTotalHours += hours;
      }
    });
    
    dailyHours[day] = dayTotalHours;
  });

  console.log('📊 Daily breakdown:', {
    dailyHours,
    dailyStatus,
    dailyContractHours: dailyContractHours.toFixed(2),
    payBreakTimes
  });

  // Second pass: Process each day according to EXACT CHR rules with pro-rated contract hours
  for (let day = 0; day < 7; day++) {
    const status = dailyStatus[day];
    const hours = dailyHours[day];

    if (status === 'WEEKLY_REST') {
      // Repos Hebdo: NO IMPACT on calculations - designated non-working day
      // NO services counted for this day
      continue;
    } else if (status === 'CP') {
      // CP: ONLY status that assimilates to worked hours for contractual coverage
      // CRITICAL: Use pro-rated daily hours instead of fixed daily hours
      totalAssimilatedHours += dailyContractHours;
      // NO services counted for CP days
    } else if (status === 'PUBLIC_HOLIDAY') {
      // Check if this is a worked holiday
      if (hasHolidayWorked && hours > 0) {
        // Férié travaillé: Hours worked count as ACTUAL WORKED HOURS
        totalWorkedHours += hours; // Include in Total Heures Travaillées
        totalPublicHolidayHours += hours; // Track separately for "Heures Majorées 100%"
        shiftCount++; // Count as service if hours are scheduled on Férié
      } else {
        // Férié non travaillé: No impact on hours
      }
      // If no hours on Férié, no service counted
    } else if (status === 'ABSENCE' || status === 'SICK_LEAVE' || status === 'ACCIDENT') {
      // These statuses CREATE DEFICITS - no coverage for contractual hours
      // NO services counted for these absence days
    } else if (hours > 0) {
      // Regular working day with actual hours (no status)
      totalWorkedHours += hours;
      
      // CRITICAL: Count each shift as a separate service
      const shiftsForCurrentDay = shiftsByDay[day] || [];
      shiftCount += shiftsForCurrentDay.filter(s => s.start && s.end && (!s.status || s.isHolidayWorked)).length;
      
      // Check for worked holiday shifts (without status but with isHolidayWorked flag)
      const holidayWorkedHours = shiftsForCurrentDay
        .filter(s => s.isHolidayWorked && s.start && s.end)
        .reduce((sum, s) => sum + calculateTimeInHours(s.start, s.end), 0);
      
      if (holidayWorkedHours > 0) {
        totalPublicHolidayHours += holidayWorkedHours;
      }
    }
  }

  // CRITICAL: "Total Heures Couvertes pour Contrat" calculation with pro-rated hours
  // Per your EXACT specification: ALL actual worked hours (including Férié) + CP assimilated hours
  const totalCoveredHours = totalWorkedHours + totalAssimilatedHours;

  // CRITICAL: Calculate "Heures Supp./Manquantes" against PRO-RATED contract hours
  // This is the key fix - using proRatedContractHours instead of weeklyContractHours
  const hoursDiff = totalCoveredHours - proRatedContractHours;

  console.log('✅ Final calculation results:', {
    totalWorkedHours: totalWorkedHours.toFixed(2),
    totalAssimilatedHours: totalAssimilatedHours.toFixed(2),
    totalPublicHolidayHours: totalPublicHolidayHours.toFixed(2),
    totalCoveredHours: totalCoveredHours.toFixed(2),
    proRatedContractHours: proRatedContractHours.toFixed(2),
    hoursDiff: hoursDiff.toFixed(2),
    shiftCount,
    payBreakTimes // CRITICAL: Log the break payment setting used
  });

  return {
    totalWorkedHours, // ALL actual hours worked (including Férié) - now affected by break payment setting
    totalAssimilatedHours, // Only CP assimilated hours
    totalPublicHolidayHours, // Férié hours for "Heures Majorées 100%" display
    totalCoveredHours, // For internal calculation verification
    hoursDiff, // CRITICAL: Now calculated against pro-rated contract hours
    shiftCount, // Only counts services on days WITHOUT absence status (except Férié with hours)
    proRatedContractHours // CRITICAL: Return for display/debugging purposes
  };
};

// CRITICAL: New function to calculate coupure duration
export const calculateCoupureDuration = (shifts: Shift[]): number => {
  if (shifts.length <= 1) return 0;
  
  // Sort shifts by start time
  const sortedShifts = [...shifts].sort((a, b) => a.start.localeCompare(b.start));
  
  let totalCoupureMinutes = 0;
  
  for (let i = 0; i < sortedShifts.length - 1; i++) {
    const currentShift = sortedShifts[i];
    const nextShift = sortedShifts[i + 1];
    
    // Calculate end time of current shift in minutes
    const [currentEndHour, currentEndMin] = currentShift.end.split(':').map(Number);
    const currentEndMinutes = currentEndHour * 60 + currentEndMin;
    
    // Calculate start time of next shift in minutes
    const [nextStartHour, nextStartMin] = nextShift.start.split(':').map(Number);
    const nextStartMinutes = nextStartHour * 60 + nextStartMin;
    
    // Handle overnight shifts
    let coupureMinutes = nextStartMinutes - currentEndMinutes;
    if (coupureMinutes < 0) {
      coupureMinutes += 24 * 60; // Add 24 hours in minutes
    }
    
    totalCoupureMinutes += coupureMinutes;
  }
  
  return totalCoupureMinutes;
};

// CRITICAL: New function to group shifts by day and employee
export const groupShiftsByDayAndEmployee = (shifts: Shift[]): Record<string, Shift[]> => {
  const groups: Record<string, Shift[]> = {};
  
  shifts.forEach(shift => {
    const key = `${shift.employeeId}-${shift.day}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(shift);
  });
  
  // Sort shifts within each group
  Object.values(groups).forEach(groupShifts => {
    groupShifts.sort((a, b) => a.start.localeCompare(b.start));
  });
  
  return groups;
};

export const formatHoursDiff = (hours: number): string => {
  const sign = hours >= 0 ? '+' : '-';
  const absHours = Math.abs(hours);
  const wholeHours = Math.floor(absHours);
  const minutes = Math.round((absHours - wholeHours) * 60);
  return `${sign}${wholeHours}H${minutes.toString().padStart(2, '0')}`;
};

export const formatHours = (hours: number): string => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours}H${minutes.toString().padStart(2, '0')}`;
};