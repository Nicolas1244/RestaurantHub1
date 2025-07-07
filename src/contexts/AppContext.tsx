import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Restaurant, Employee, Schedule, Shift, UserSettings, TimeInputType, ScheduleLayoutType, EmployeePreference, EmployeeAvailability } from '../types';
import { mockRestaurants, mockEmployees, mockSchedules } from '../data/mockData';
import toast from 'react-hot-toast';

interface AppContextType {
  restaurants: Restaurant[];
  employees: Employee[];
  schedules: Schedule[];
  currentRestaurant: Restaurant | null;
  currentTab: 'dashboard' | 'restaurants' | 'schedule' | 'staff' | 'settings' | 'performance' | 'timeclock' | 'documents';
  setCurrentTab: (tab: 'dashboard' | 'restaurants' | 'schedule' | 'staff' | 'settings' | 'performance' | 'timeclock' | 'documents') => void;
  setCurrentRestaurant: (restaurant: Restaurant | null) => void;
  getRestaurantEmployees: (restaurantId: string) => Employee[];
  getRestaurantSchedule: (restaurantId: string) => Schedule | undefined;
  addEmployee: (employee: Omit<Employee, 'id'>) => Promise<void>;
  updateEmployee: (employee: Employee) => Promise<void>;
  deleteEmployee: (employeeId: string) => Promise<void>;
  addShift: (shift: Omit<Shift, 'id'>) => void;
  updateShift: (shift: Shift) => void;
  deleteShift: (shiftId: string) => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  addRestaurant: (restaurant: Omit<Restaurant, 'id'>) => Promise<void>;
  updateRestaurant: (restaurant: Restaurant) => Promise<void>;
  deleteRestaurant: (restaurantId: string) => Promise<void>;
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  // CRITICAL: Add last save timestamp for auto-save feature
  lastScheduleSave: Date | null;
  // CRITICAL: New methods for employee preferences and availability
  addEmployeePreference: (preference: Omit<EmployeePreference, 'id'>) => Promise<void>;
  updateEmployeePreference: (preference: EmployeePreference) => Promise<void>;
  getEmployeePreferences: (employeeId: string) => EmployeePreference | undefined;
  addEmployeeAvailability: (availability: Omit<EmployeeAvailability, 'id'>) => Promise<void>;
  deleteEmployeeAvailability: (availabilityId: string) => Promise<void>;
  getEmployeeAvailabilities: (employeeId: string) => EmployeeAvailability[];
  checkAvailabilityConflicts: (employeeId: string, day: number, startTime: string, endTime: string) => { hasConflict: boolean; conflictType: string | null; };
}

// CRITICAL: Enhanced default user settings with break payment enabled by default
export const defaultUserSettings: UserSettings = {
  timeInputType: 'timePicker', // CRITICAL: Set Visual Time Picker as default
  scheduleLayoutType: 'optimized',
  weekStartsOn: 1, // Monday
  timeFormat: '24h',
  language: 'en',
  timezone: 'Europe/Paris',
  dateFormat: 'DD/MM/YYYY',
  currency: 'EUR',
  emailNotifications: true,
  pushNotifications: false,
  twoFactorAuth: false,
  sessionTimeout: 60,
  theme: 'light',
  compactMode: false,
  autoSave: true,
  // CRITICAL: Weather settings with auto-location enabled by default
  weatherEnabled: true, // CRITICAL: Always enabled by default
  weatherAutoLocation: true,
  weatherLocation: undefined,
  // CRITICAL: NEW - Break payment setting enabled by default
  payBreakTimes: true, // CRITICAL: Always default to paid breaks 
  // CRITICAL: NEW - Time clock functionality disabled by default
  timeClockEnabled: false, 
  // HR & Document Management settings
  documentStorage: 'local',
  documentRetention: '5years',
  electronicSignature: false,
  automaticDocumentGeneration: false,
  // Payroll Integration settings
  payrollSoftware: 'none',
  payrollExportFrequency: 'monthly',
  automaticPayrollExport: false,
  payrollValidationRequired: true,
  // Integration settings
  posSync: false,
  weatherData: false
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(mockRestaurants);
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [schedules, setSchedules] = useState<Schedule[]>(mockSchedules);
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(mockRestaurants[0]); 
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'restaurants' | 'schedule' | 'staff' | 'settings' | 'performance' | 'timeclock' | 'documents'>('dashboard');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(defaultUserSettings);
  // CRITICAL: Add last save timestamp for auto-save feature
  const [lastScheduleSave, setLastScheduleSave] = useState<Date | null>(null);
  // CRITICAL: Add state for employee preferences and availabilities
  const [employeePreferences, setEmployeePreferences] = useState<EmployeePreference[]>([]);
  const [employeeAvailabilities, setEmployeeAvailabilities] = useState<EmployeeAvailability[]>([]);

  // CRITICAL: Load user settings from localStorage with break payment default
  useEffect(() => {
    try {
      console.log('🔄 Loading user settings from localStorage...');
      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        // CRITICAL: Ensure all new settings have proper defaults
        const mergedSettings = { 
          ...defaultUserSettings, 
          ...parsedSettings,
          // Force Visual Time Picker as default if not explicitly set
          timeInputType: parsedSettings.timeInputType || 'timePicker',
          // Ensure weather is enabled by default for new users
          weatherEnabled: parsedSettings.weatherEnabled !== undefined ? parsedSettings.weatherEnabled : true,
          weatherAutoLocation: parsedSettings.weatherAutoLocation !== undefined ? parsedSettings.weatherAutoLocation : true,
          // CRITICAL: Ensure break payment setting has proper default
          payBreakTimes: true, // CRITICAL: Force paid breaks to be true regardless of saved setting
          // CRITICAL: Ensure time clock setting has proper default (disabled)
          timeClockEnabled: parsedSettings.timeClockEnabled !== undefined ? parsedSettings.timeClockEnabled : false
        };
        console.log('✅ Settings loaded with payBreakTimes:', mergedSettings.payBreakTimes);
        setSettings(mergedSettings);
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
      // CRITICAL: Fallback to default settings with all new features enabled
      const defaultSettings = {...defaultUserSettings, payBreakTimes: true};
      setSettings(defaultSettings);
      console.log('⚠️ Using default settings with payBreakTimes:', defaultSettings.payBreakTimes);
    }
  }, []);

  // CRITICAL: Ensure settings are properly applied to the UI
  useEffect(() => {
    // Log current settings for debugging
    console.log('Current settings loaded:', settings);
  }, [settings]);

  // CRITICAL: Helper function to create initial schedule for a restaurant
  const createInitialSchedule = (restaurantId: string): Schedule => {
    const currentDate = new Date();
    const getWeekStartDate = (date: Date) => {
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
      return new Date(date.setDate(diff)).toISOString().split('T')[0];
    };

    const newSchedule: Schedule = {
      id: Math.random().toString(36).substr(2, 9),
      restaurantId,
      weekStartDate: getWeekStartDate(currentDate),
      shifts: [] // Start with empty shifts array
    };

    console.log('🆕 Created initial schedule for restaurant:', restaurantId, newSchedule);
    return newSchedule;
  };

  const getRestaurantEmployees = (restaurantId: string): Employee[] => {
    // Get employees and attach their preferences and availabilities
    const restaurantEmployees = employees.filter(employee => employee.restaurantId === restaurantId);
    
    return restaurantEmployees.map(employee => {
      const preferences = employeePreferences.find(pref => pref.employeeId === employee.id);
      const availabilities = employeeAvailabilities.filter(avail => avail.employeeId === employee.id);
      
      return {
        ...employee,
        preferences,
        availabilities
      };
    });
  };

  const getRestaurantSchedule = (restaurantId: string): Schedule | undefined => {
    let schedule = schedules.find(schedule => schedule.restaurantId === restaurantId);
    
    // CRITICAL: If no schedule exists for this restaurant, create one automatically
    if (!schedule) {
      console.log('⚠️ No schedule found for restaurant:', restaurantId, 'Creating initial schedule...');
      schedule = createInitialSchedule(restaurantId);
      
      // Add the new schedule to the schedules array
      setSchedules(prev => [...prev, schedule!]);
      
      toast.info('Schedule initialized for new restaurant', { duration: 3000 });
    }
    
    return schedule;
  };

  // CRITICAL FIX: Single notification source for employee operations
  const addEmployee = async (employeeData: Omit<Employee, 'id'>) => {
    const newEmployee: Employee = {
      ...employeeData,
      id: Math.random().toString(36).substr(2, 9)
    };

    console.log('➕ Adding new employee:', newEmployee);
    setEmployees(prev => [...prev, newEmployee]);
    
    // CRITICAL: Single source of truth for success notifications
    toast.success('Employé ajouté avec succès');
  };

  const updateEmployee = async (updatedEmployee: Employee) => {
    console.log('🔄 Updating employee:', updatedEmployee.id);
    setEmployees(prev =>
      prev.map(employee =>
        employee.id === updatedEmployee.id ? updatedEmployee : employee
      )
    );
    
    // CRITICAL: Single source of truth for success notifications
    toast.success('Employé mis à jour avec succès');
  };

  const deleteEmployee = async (employeeId: string) => {
    console.log('🗑️ Deleting employee:', employeeId);
    setEmployees(prev => prev.filter(e => e.id !== employeeId));
  };

  const addRestaurant = async (restaurantData: Omit<Restaurant, 'id'>) => {
    try {
      const newRestaurant: Restaurant = {
        ...restaurantData,
        id: Math.random().toString(36).substr(2, 9)
      };

      console.log('🏪 Adding new restaurant:', newRestaurant);
      setRestaurants(prev => [...prev, newRestaurant]);
      
      // CRITICAL: Automatically create initial schedule for new restaurant
      const initialSchedule = createInitialSchedule(newRestaurant.id);
      setSchedules(prev => [...prev, initialSchedule]);
      
      // Automatically set as current restaurant if it's the first one
      if (restaurants.length === 0) {
        setCurrentRestaurant(newRestaurant);
      }

      console.log('✅ Restaurant and initial schedule created successfully');
      toast.success('Restaurant created with scheduling enabled');
    } catch (error) {
      console.error('❌ Error adding restaurant:', error);
      throw error;
    }
  };

  const updateRestaurant = async (updatedRestaurant: Restaurant) => {
    try {
      console.log('🔄 Updating restaurant:', updatedRestaurant.id);
      setRestaurants(prev =>
        prev.map(restaurant =>
          restaurant.id === updatedRestaurant.id ? updatedRestaurant : restaurant
        )
      );

      // Update current restaurant if it's the one being updated
      if (currentRestaurant?.id === updatedRestaurant.id) {
        setCurrentRestaurant(updatedRestaurant);
      }
    } catch (error) {
      console.error('❌ Error updating restaurant:', error);
      throw error;
    }
  };

  const deleteRestaurant = async (restaurantId: string) => {
    try {
      console.log('🗑️ Deleting restaurant:', restaurantId);
      
      // Remove restaurant
      setRestaurants(prev => prev.filter(r => r.id !== restaurantId));
      
      // CRITICAL: Also remove associated schedule and employees
      setSchedules(prev => prev.filter(s => s.restaurantId !== restaurantId));
      setEmployees(prev => prev.filter(e => e.restaurantId !== restaurantId));
      
      // Clear current restaurant if it's the one being deleted
      if (currentRestaurant?.id === restaurantId) {
        const remainingRestaurants = restaurants.filter(r => r.id !== restaurantId);
        setCurrentRestaurant(remainingRestaurants.length > 0 ? remainingRestaurants[0] : null);
      }
      
      console.log('✅ Restaurant and associated data deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting restaurant:', error);
      throw error;
    }
  };

  // CRITICAL: Enhanced user settings management with break payment setting
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      console.log('Updating settings:', newSettings);
      
      // CRITICAL: Force payBreakTimes to be true regardless of user input
      if (newSettings.payBreakTimes === false) {
        console.log('⚠️ Overriding payBreakTimes to true (forced default)');
        newSettings.payBreakTimes = true;
      }
      
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      
      // Save to localStorage for persistence
      localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
      
      // CRITICAL: Provide specific feedback for different setting types
      if (newSettings.timeInputType) {
        const timeInputLabels = {
          'timePicker': 'Sélecteur d\'Heure Visuel',
          'textInput': 'Saisie Directe de Texte',
          'dropdown': 'Menu Déroulant'
        };
        
        toast.success(`Type de saisie d'heure mis à jour : ${timeInputLabels[newSettings.timeInputType]}`);
      } else if (newSettings.weatherEnabled !== undefined) {
        toast.success(newSettings.weatherEnabled ? 'Prévisions météo activées' : 'Prévisions météo désactivées');
      } else if (newSettings.weatherLocation) {
        toast.success(`Localisation météo mise à jour : ${newSettings.weatherLocation}`);
      } else if (newSettings.payBreakTimes !== undefined) {
        // CRITICAL: Specific feedback for break payment setting
        // CRITICAL: Since we're forcing paid breaks, only show the positive message
        toast.success('Temps de pause rémunérés dans les calculs (paramètre par défaut)');
        
        // CRITICAL: Force a refresh of the schedule to update calculations
        const currentSchedules = [...schedules];
        setSchedules(currentSchedules);
        
        // Update last save timestamp to trigger UI refresh
        setLastScheduleSave(new Date());
      } else if (newSettings.timeClockEnabled !== undefined) {
        // CRITICAL: Specific feedback for time clock setting
        toast.success(newSettings.timeClockEnabled 
          ? 'Fonction Badgeuse activée' 
          : 'Fonction Badgeuse désactivée'
        );
      } else {
        toast.success('Paramètres mis à jour avec succès');
      }
    } catch (error) {
      console.error('Error updating user settings:', error);
      toast.error('Échec de la mise à jour des paramètres');
      throw error;
    }
  };

  const addShift = (shiftData: Omit<Shift, 'id'>) => {
    const newShift: Shift = {
      ...shiftData,
      id: Math.random().toString(36).substr(2, 9)
    };

    console.log('➕ Adding new shift:', newShift);

    setSchedules(prev => 
      prev.map(schedule => {
        if (schedule.restaurantId === newShift.restaurantId) {
          return {
            ...schedule,
            shifts: [...schedule.shifts, newShift]
          };
        }
        return schedule;
      })
    );
    
    // CRITICAL: Update last save timestamp
    setLastScheduleSave(new Date());
  };

  const updateShift = (updatedShift: Shift) => {
    console.log('🔄 Updating shift:', updatedShift.id);
    
    setSchedules(prev => 
      prev.map(schedule => {
        if (schedule.restaurantId === updatedShift.restaurantId) {
          return {
            ...schedule,
            shifts: schedule.shifts.map(shift => 
              shift.id === updatedShift.id ? updatedShift : shift
            )
          };
        }
        return schedule;
      })
    );
    
    // CRITICAL: Update last save timestamp
    setLastScheduleSave(new Date());
  };

  const deleteShift = (shiftId: string) => {
    console.log('🗑️ Deleting shift:', shiftId);
    
    setSchedules(prev => 
      prev.map(schedule => {
        return {
          ...schedule,
          shifts: schedule.shifts.filter(shift => shift.id !== shiftId)
        };
      })
    );
    
    // CRITICAL: Update last save timestamp
    setLastScheduleSave(new Date());
  };

  // CRITICAL: New methods for employee preferences
  const addEmployeePreference = async (preference: Omit<EmployeePreference, 'id'>) => {
    try {
      const newPreference: EmployeePreference = {
        ...preference,
        id: Math.random().toString(36).substr(2, 9)
      };

      console.log('➕ Adding employee preference:', newPreference);
      setEmployeePreferences(prev => [...prev, newPreference]);
      
      toast.success('Préférences enregistrées avec succès');
      return newPreference;
    } catch (error) {
      console.error('Error adding employee preference:', error);
      throw error;
    }
  };

  const updateEmployeePreference = async (preference: EmployeePreference) => {
    try {
      console.log('🔄 Updating employee preference:', preference.id);
      
      setEmployeePreferences(prev => 
        prev.map(p => p.id === preference.id ? preference : p)
      );
      
      toast.success('Préférences mises à jour avec succès');
    } catch (error) {
      console.error('Error updating employee preference:', error);
      throw error;
    }
  };

  const getEmployeePreferences = (employeeId: string): EmployeePreference | undefined => {
    return employeePreferences.find(p => p.employeeId === employeeId);
  };

  // CRITICAL: New methods for employee availability
  const addEmployeeAvailability = async (availability: Omit<EmployeeAvailability, 'id'>) => {
    try {
      const newAvailability: EmployeeAvailability = {
        ...availability,
        id: Math.random().toString(36).substr(2, 9)
      };

      console.log('➕ Adding employee availability:', newAvailability);
      setEmployeeAvailabilities(prev => [...prev, newAvailability]);
      
      return newAvailability;
    } catch (error) {
      console.error('Error adding employee availability:', error);
      throw error;
    }
  };

  const deleteEmployeeAvailability = async (availabilityId: string) => {
    try {
      console.log('🗑️ Deleting employee availability:', availabilityId);
      
      setEmployeeAvailabilities(prev => 
        prev.filter(a => a.id !== availabilityId)
      );
    } catch (error) {
      console.error('Error deleting employee availability:', error);
      throw error;
    }
  };

  const getEmployeeAvailabilities = (employeeId: string): EmployeeAvailability[] => {
    return employeeAvailabilities.filter(a => a.employeeId === employeeId);
  };

  // CRITICAL: Check for availability conflicts
  const checkAvailabilityConflicts = (
    employeeId: string, 
    day: number, 
    startTime: string, 
    endTime: string
  ): { hasConflict: boolean; conflictType: string | null; } => {
    // Get employee availabilities
    const availabilities = getEmployeeAvailabilities(employeeId);
    
    // Check for conflicts with unavailable periods
    const unavailablePeriods = availabilities.filter(a => 
      a.type === 'UNAVAILABLE' && 
      (
        // For recurring availabilities, check day of week
        (a.recurrence !== 'ONCE' && a.dayOfWeek === day) ||
        // For one-time availabilities, check if it's for the specific date
        // This would require converting the day to an actual date based on the current week
        // For now, we'll just check recurring unavailabilities
        false
      )
    );
    
    for (const period of unavailablePeriods) {
      // Check if shift overlaps with unavailable period
      if (
        (startTime >= period.startTime && startTime < period.endTime) ||
        (endTime > period.startTime && endTime <= period.endTime) ||
        (startTime <= period.startTime && endTime >= period.endTime)
      ) {
        return { 
          hasConflict: true, 
          conflictType: 'UNAVAILABLE' 
        };
      }
    }
    
    // Check for conflicts with limited availability periods
    const limitedPeriods = availabilities.filter(a => 
      a.type === 'LIMITED' && 
      (
        (a.recurrence !== 'ONCE' && a.dayOfWeek === day) ||
        false
      )
    );
    
    for (const period of limitedPeriods) {
      // Check if shift overlaps with limited period
      if (
        (startTime >= period.startTime && startTime < period.endTime) ||
        (endTime > period.startTime && endTime <= period.endTime) ||
        (startTime <= period.startTime && endTime >= period.endTime)
      ) {
        return { 
          hasConflict: true, 
          conflictType: 'LIMITED' 
        };
      }
    }
    
    // No conflicts found
    return { hasConflict: false, conflictType: null };
  };

  return (
    <AppContext.Provider
      value={{
        restaurants,
        employees,
        schedules,
        currentRestaurant,
        currentTab,
        setCurrentTab,
        setCurrentRestaurant,
        getRestaurantEmployees,
        getRestaurantSchedule,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        addShift,
        updateShift,
        deleteShift,
        showAuthModal,
        setShowAuthModal,
        addRestaurant,
        updateRestaurant,
        deleteRestaurant,
        settings,
        updateSettings,
        lastScheduleSave,
        // CRITICAL: New methods for employee preferences and availability
        addEmployeePreference,
        updateEmployeePreference,
        getEmployeePreferences,
        addEmployeeAvailability,
        deleteEmployeeAvailability,
        getEmployeeAvailabilities,
        checkAvailabilityConflicts
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};