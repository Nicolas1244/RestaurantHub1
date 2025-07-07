import { User } from '@supabase/supabase-js';

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export const DAILY_STATUS = {
  WEEKLY_REST: { label: 'Repos Hebdo', color: '#4B5563' }, // Gray
  CP: { label: 'CP', color: '#10B981' }, // Green
  PUBLIC_HOLIDAY: { label: 'Férié (1er Mai)', color: '#EF4444' }, // Red
  SICK_LEAVE: { label: 'Maladie', color: '#F59E0B' }, // Amber
  ACCIDENT: { label: 'Accident de Travail', color: '#8B5CF6' }, // Purple
  ABSENCE: { label: 'Absence', color: '#EC4899' }  // Pink
} as const;

export const SHIFT_TYPES = {
  morning: {
    label: 'Morning/Lunch',
    defaultStart: '08:00',
    defaultEnd: '16:00',
    color: '#3B82F6'
  },
  evening: {
    label: 'Evening/Dinner',
    defaultStart: '16:00',
    defaultEnd: '23:00',
    color: '#8B5CF6'
  },
  // New shift type for coupure management
  coupure: {
    label: 'Split Shift',
    defaultStart: '10:00',
    defaultEnd: '22:00',
    color: '#10B981',
    hasCoupure: true
  }
} as const;

// CRITICAL UPDATE: Exact position list and order as specified
export const POSITIONS = [
  'Operations Manager',      // French: Directeur / Directrice d'Exploitation
  'Chef de Cuisine',        // French: Chef de Cuisine
  'Second de Cuisine',      // French: Second de Cuisine
  'Chef de Partie',         // French: Chef de Partie
  'Commis de Cuisine',      // French: Commis de Cuisine
  'Plongeur',              // French: Plongeur
  'Barman/Barmaid',        // French: Barman/Barmaid
  'Waiter(s)'              // French: Serveur(se)
];

export const EMPLOYEE_CATEGORIES = {
  Cuisine: 'Cuisine',
  Salle: 'Salle'
} as const;

// CRITICAL: New employee status types
export const EMPLOYEE_STATUS = {
  Cadre: 'Cadre',
  Employe: 'Employé(e)'
} as const;

// CRITICAL: New time input types for schedule settings - converted to array format
export const TIME_INPUT_TYPES = {
  dropdown: {
    label: 'Dropdown Selection',
    labelFr: 'Sélection par Menu Déroulant',
    description: 'Traditional dropdown menus for time selection',
    descriptionFr: 'Menus déroulants traditionnels pour la sélection d\'heure'
  },
  timePicker: {
    label: 'Visual Time Picker',
    labelFr: 'Sélecteur d\'Heure Visuel',
    description: 'Interactive clock-style time picker',
    descriptionFr: 'Sélecteur d\'heure interactif de style horloge'
  },
  textInput: {
    label: 'Direct Text Input',
    labelFr: 'Saisie Directe de Texte',
    description: 'Type time directly in HH:MM format',
    descriptionFr: 'Saisir l\'heure directement au format HH:MM'
  }
} as const;

// CRITICAL: New schedule layout types for display optimization - converted to array format
export const SCHEDULE_LAYOUT_TYPES = {
  optimized: {
    label: 'Optimized Layout',
    labelFr: 'Mise en Page Optimisée',
    description: 'Compact layout with better column proportions',
    descriptionFr: 'Mise en page compacte avec de meilleures proportions de colonnes'
  },
  classic: {
    label: 'Classic Layout',
    labelFr: 'Mise en Page Classique',
    description: 'Original layout with wider columns',
    descriptionFr: 'Mise en page originale avec des colonnes plus larges'
  }
} as const;

// CRITICAL: New availability types
export const AVAILABILITY_TYPES = {
  PREFERRED: { label: 'Preferred', labelFr: 'Préféré', color: '#10B981' }, // Green
  AVAILABLE: { label: 'Available', labelFr: 'Disponible', color: '#3B82F6' }, // Blue
  LIMITED: { label: 'Limited', labelFr: 'Disponibilité Limitée', color: '#F59E0B' }, // Amber
  UNAVAILABLE: { label: 'Unavailable', labelFr: 'Indisponible', color: '#EF4444' } // Red
} as const;

// CRITICAL: New recurrence types for availabilities
export const RECURRENCE_TYPES = {
  ONCE: { label: 'One-time', labelFr: 'Unique' },
  WEEKLY: { label: 'Weekly', labelFr: 'Hebdomadaire' },
  BIWEEKLY: { label: 'Bi-weekly', labelFr: 'Bi-hebdomadaire' },
  MONTHLY: { label: 'Monthly', labelFr: 'Mensuel' }
} as const;

export type ContractType = 'CDI' | 'CDD' | 'Extra';
export type EmployeeCategory = keyof typeof EMPLOYEE_CATEGORIES;
export type EmployeeStatus = keyof typeof EMPLOYEE_STATUS;
export type ShiftType = keyof typeof SHIFT_TYPES;
export type DailyStatus = keyof typeof DAILY_STATUS;
export type LeaveType = DailyStatus | null;
export type TimeInputType = keyof typeof TIME_INPUT_TYPES;
export type ScheduleLayoutType = keyof typeof SCHEDULE_LAYOUT_TYPES;
export type AvailabilityType = keyof typeof AVAILABILITY_TYPES;
export type RecurrenceType = keyof typeof RECURRENCE_TYPES;

export const formatFrenchPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (match) {
    return match.slice(1).join(' ');
  }
  return phone;
};

export const formatSocialSecurityNumber = (ssn: string): string => {
  const cleaned = ssn.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{1})(\d{2})(\d{2})(\d{2})(\d{3})(\d{3})(\d{2})$/);
  if (match) {
    return match.slice(1).join(' ');
  }
  return ssn;
};

export interface Restaurant {
  id: string;
  name: string;
  commercialName?: string;
  legalName?: string;
  siret?: string;
  location: string;
  streetAddress?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  phone?: string;
  website?: string;
  image?: string;
  manager?: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
}

// CRITICAL: New interface for employee availability
export interface EmployeeAvailability {
  id: string;
  employeeId: string;
  type: AvailabilityType;
  dayOfWeek?: number; // 0-6 for recurring availabilities
  date?: string; // For one-time availabilities
  startTime: string;
  endTime: string;
  recurrence: RecurrenceType;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

// CRITICAL: New interface for employee preferences
export interface EmployeePreference {
  id: string;
  employeeId: string;
  preferredDays: number[]; // 0-6 representing days of week
  preferredShifts: ShiftType[];
  preferredPositions: string[];
  preferredHours: {
    min: number;
    max: number;
  };
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  restaurantId: string;
  firstName: string;
  lastName: string;
  streetAddress: string;
  city: string;
  postalCode: string;
  phone: string;
  email?: string;
  socialSecurityNumber?: string;
  contractType: ContractType;
  profilePicture?: string; // Base64 encoded image data
  startDate: string;
  endDate: string | null;
  position: string;
  category: EmployeeCategory;
  weeklyHours: number;
  notificationDays?: number;
  // CRITICAL: New fields for comprehensive employee directory
  dateOfBirth?: string;
  placeOfBirth?: string;
  countryOfBirth?: string;
  employeeStatus?: EmployeeStatus;
  hiringDate?: string;
  hourlyRate?: number;
  grossMonthlySalary?: number;
  // CRITICAL: New fields for preferences and availability
  preferences?: EmployeePreference;
  availabilities?: EmployeeAvailability[];
}

export interface Shift {
  id: string;
  restaurantId: string;
  employeeId: string;
  day: number;
  start: string;
  end: string;
  position: string;
  color?: string;
  type: ShiftType;
  status?: DailyStatus;
  leaveType?: LeaveType;
  // New fields for coupure management
  shiftGroup?: string; // Unique identifier to group related shifts (for coupures)
  shiftOrder?: number; // Order within a group of shifts (1, 2, etc.)
  hasCoupure?: boolean; // Indicates if this shift is part of a coupure pattern
  coupureStart?: string; // Start time of coupure (end time of this shift)
  coupureEnd?: string; // End time of coupure (start time of next shift)
  coupureDuration?: number; // Duration of coupure in minutes
}

export interface Schedule {
  id: string;
  restaurantId: string;
  weekStartDate: string;
  shifts: Shift[];
}

export interface ShiftTemplate {
  id: string;
  name: string;
  description?: string;
  start: string;
  end: string;
  position: string;
  weeklyPattern: Record<number, boolean>;
  type: ShiftType;
  restaurantId: string;
}

// CRITICAL: Enhanced settings interface with break payment option and time clock toggle
export interface UserSettings {
  timeInputType: TimeInputType;
  scheduleLayoutType: ScheduleLayoutType;
  weekStartsOn: 0 | 1; // 0 = Sunday, 1 = Monday
  timeFormat: '12h' | '24h';
  language: 'en' | 'fr';
  timezone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  twoFactorAuth: boolean;
  // CRITICAL: Weather settings
  weatherEnabled: boolean;
  weatherLocation?: string; // Manual location override
  weatherAutoLocation: boolean; // Use restaurant address for weather
  // CRITICAL: NEW - Break payment setting
  payBreakTimes: boolean; // Whether break times are considered paid or unpaid 
  // CRITICAL: NEW - Time clock toggle
  timeClockEnabled: boolean; // Whether the time clock functionality is enabled 
  // HR & Document Management settings
  documentStorage?: 'local' | 'cloud' | 's3' | 'gdrive';
  documentRetention?: '1year' | '3years' | '5years' | '10years' | 'indefinite';
  electronicSignature?: boolean;
  automaticDocumentGeneration?: boolean;
  // Payroll Integration settings
  payrollSoftware?: 'none' | 'sage' | 'cegid' | 'payfit' | 'adp' | 'quadratus';
  payrollExportFrequency?: 'weekly' | 'biweekly' | 'monthly';
  automaticPayrollExport?: boolean;
  payrollValidationRequired?: boolean;
}

// CRITICAL: Weather forecast interfaces
export interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface WeatherData {
  date: string; // ISO date string
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

export interface WeatherForecast {
  location: {
    name: string;
    country: string;
    lat: number;
    lon: number;
  };
  current: WeatherData;
  forecast: WeatherData[]; // Up to 15 days
  lastUpdated: string;
}

export interface AuthUser extends User {
  restaurantAccess?: string[];
  role?: string;
}

// CRITICAL: Labor law compliance types
export interface LaborLawViolation {
  id: string;
  type: 'daily_rest' | 'weekly_rest' | 'max_daily_hours' | 'max_weekly_hours' | 'consecutive_days' | 'contract_period';
  severity: 'critical' | 'warning' | 'info';
  employeeId: string;
  employeeName: string;
  day?: number;
  message: string;
  suggestion: string;
  affectedShifts: string[];
  legalReference: string;
}

export interface RestPeriodAnalysis {
  hasValidDailyRest: boolean;
  hasValidWeeklyRest: boolean;
  consecutiveWorkingDays: number;
  weeklyWorkingHours: number;
  violations: LaborLawViolation[];
  suggestions: string[];
}

// CRITICAL: NEW - Performance Dashboard Types

// POS Integration Types
export interface POSCredentials {
  provider: 'laddition' | 'lightspeed' | 'tiller' | 'square' | 'zettle';
  apiKey?: string;
  username?: string;
  password?: string;
  storeId?: string;
  endpoint?: string;
  isActive: boolean;
  lastSync?: string;
}

export interface POSData {
  date: string; // ISO date string
  turnover: number; // Chiffre d'affaires
  covers: number; // Number of customers served
  averageCheck: number; // Ticket moyen
  salesByHour: Record<string, number>; // Sales by hour
  salesByCategory: Record<string, number>; // Sales by product category
  salesByService: {
    lunch: number;
    dinner: number;
  };
}

// Performance Metrics Types
export interface PerformanceMetrics {
  date: string;
  turnover: number;
  covers: number;
  averageCheck: number;
  grossPayrollMass: number;
  staffCostRatio: number; // (Gross Payroll Mass / Turnover) * 100
  totalHoursWorked: number;
  averageHourlyCost: number; // Gross Payroll Mass / Total Hours Worked
  scheduledHours: number;
  overtimeHours: number;
  absenceHours: number;
}

// Forecasting Types
export interface ForecastData {
  date: string;
  forecastedTurnover: number;
  forecastedCovers: number;
  confidence: number; // 0-100%
  basedOn: 'historical' | 'seasonal' | 'manual';
  factors: string[]; // Factors considered in forecast
}

export interface ForecastingModel {
  type: 'historical' | 'seasonal' | 'regression';
  accuracy: number; // Historical accuracy percentage
  lastUpdated: string;
  parameters: Record<string, any>;
}

// Dashboard Module Types
export interface DashboardModule {
  id: string;
  title: string;
  type: 'kpi' | 'chart' | 'table' | 'forecast';
  data: any;
  config: Record<string, any>;
  isVisible: boolean;
  order: number;
}

// Chart Data Types
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
  category?: string;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area';
  xAxis: string;
  yAxis: string;
  colors: string[];
  showLegend: boolean;
  showGrid: boolean;
  animate: boolean;
}

// KPI Types
export interface KPIData {
  current: number;
  previous: number;
  target?: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  unit: string;
  format: 'currency' | 'percentage' | 'number' | 'hours';
}

// Manual Data Entry Types
export interface ManualDataEntry {
  date: string;
  turnover?: number;
  covers?: number;
  notes?: string;
  enteredBy: string;
  enteredAt: string;
}

// Performance Dashboard Settings
export interface PerformanceDashboardSettings {
  posIntegration: POSCredentials;
  autoSync: boolean;
  syncFrequency: 'hourly' | 'daily' | 'weekly';
  forecastingEnabled: boolean;
  forecastingModel: ForecastingModel;
  kpiTargets: Record<string, number>;
  alertThresholds: Record<string, number>;
  dashboardModules: DashboardModule[];
}

// Analysis Period Types
export type AnalysisPeriod = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface DateRange {
  start: string;
  end: string;
}

// Comparison Types
export interface ComparisonData {
  current: PerformanceMetrics[];
  previous: PerformanceMetrics[];
  variance: Record<string, number>;
  trend: Record<string, 'up' | 'down' | 'stable'>;
}

// Export Types
export interface PerformanceReport {
  id: string;
  title: string;
  period: DateRange;
  metrics: PerformanceMetrics[];
  analysis: string;
  recommendations: string[];
  generatedAt: string;
  generatedBy: string;
}

// CRITICAL: New interface for coupure management
export interface CoupureInfo {
  startTime: string;
  endTime: string;
  duration: number; // in minutes
}

// CRITICAL: New interface for daily shift groups
export interface DailyShiftGroup {
  employeeId: string;
  day: number;
  shifts: Shift[];
  coupures: CoupureInfo[];
  totalWorkingHours: number;
  totalCoupureHours: number;
}

// CRITICAL: Time Clock (Badgeuse) types
export interface TimeClock {
  id: string;
  employeeId: string;
  restaurantId: string;
  clockInTime: string; // ISO date string
  clockOutTime?: string; // ISO date string
  totalHours?: number;
  status: 'active' | 'completed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeClockSummary {
  employeeId: string;
  employeeName: string;
  date: string;
  totalHours: number;
  scheduledHours: number;
  difference: number;
  status: 'on_time' | 'late' | 'early' | 'overtime' | 'undertime';
  date: string;
  totalHours: number;
  scheduledHours: number;
  difference: number;
  status: 'on_time' | 'late' | 'early' | 'overtime' | 'undertime';
}