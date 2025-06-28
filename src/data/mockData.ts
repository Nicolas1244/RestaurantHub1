import { Restaurant, Employee, Schedule, Shift, ContractType } from '../types';

export const mockRestaurants: Restaurant[] = [
  {
    id: '1',
    name: 'Ocean Breeze',
    location: '123 Coastal Drive',
    image: 'https://images.pexels.com/photos/6270541/pexels-photo-6270541.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  },
  {
    id: '2',
    name: 'Urban Plate',
    location: '456 Downtown Ave',
    image: 'https://images.pexels.com/photos/827528/pexels-photo-827528.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  },
  {
    id: '3',
    name: 'Garden Table',
    location: '789 Green Valley Rd',
    image: 'https://images.pexels.com/photos/2253643/pexels-photo-2253643.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  }
];

// CRITICAL: Updated mock employees with email addresses for testing
export const mockEmployees: Employee[] = [
  {
    id: '1',
    restaurantId: '1',
    firstName: 'Alex',
    lastName: 'Johnson',
    position: 'Operations Manager', // Updated to new position
    category: 'Salle',
    streetAddress: '123 Main St',
    city: 'New York',
    postalCode: '10001',
    phone: '(555) 123-4567',
    email: 'alex.johnson@oceanbreeze.com', // CRITICAL: Added email
    contractType: 'CDI',
    startDate: '2024-01-01',
    endDate: null,
    weeklyHours: 35,
    notificationDays: 30,
    // CRITICAL: New fields for comprehensive employee directory
    dateOfBirth: '1985-05-15',
    placeOfBirth: 'Paris',
    countryOfBirth: 'France',
    employeeStatus: 'Cadre',
    hiringDate: '2024-01-01',
    hourlyRate: 25,
    grossMonthlySalary: 3791.25,
    socialSecurityNumber: '1 85 05 75 123 456 78'
  },
  {
    id: '2',
    restaurantId: '1',
    firstName: 'Sam',
    lastName: 'Williams',
    position: 'Chef de Cuisine', // Updated to new position
    category: 'Cuisine',
    streetAddress: '456 Oak Ave',
    city: 'New York',
    postalCode: '10002',
    phone: '(555) 234-5678',
    email: 'sam.williams@oceanbreeze.com', // CRITICAL: Added email
    contractType: 'CDD',
    startDate: '2024-01-01',
    endDate: '2025-06-30', // Extended to test contract end validation
    weeklyHours: 35,
    notificationDays: 30,
    // CRITICAL: New fields for comprehensive employee directory
    dateOfBirth: '1990-08-22',
    placeOfBirth: 'Lyon',
    countryOfBirth: 'France',
    employeeStatus: 'Cadre',
    hiringDate: '2024-01-01',
    hourlyRate: 18,
    grossMonthlySalary: 2729.70,
    socialSecurityNumber: '1 90 08 69 234 567 89'
  },
  {
    id: '3',
    restaurantId: '1',
    firstName: 'Riley',
    lastName: 'Martinez',
    position: 'Waiter(s)', // Updated to new position
    category: 'Salle',
    streetAddress: '789 Pine St',
    city: 'New York',
    postalCode: '10003',
    phone: '(555) 345-6789',
    // CRITICAL: No email for this employee to test optional field
    contractType: 'Extra',
    startDate: '2025-01-15', // Future start date for testing
    endDate: '2025-03-31',
    weeklyHours: 35,
    notificationDays: 14,
    // CRITICAL: New fields for comprehensive employee directory
    dateOfBirth: '1995-03-10',
    placeOfBirth: 'Marseille',
    countryOfBirth: 'France',
    employeeStatus: 'Employe',
    hiringDate: '2025-01-15',
    hourlyRate: 12.5,
    grossMonthlySalary: 1895.63,
    socialSecurityNumber: '1 95 03 13 345 678 90'
  },
  {
    id: '4',
    restaurantId: '2',
    firstName: 'Jordan',
    lastName: 'Lee',
    position: 'Barman/Barmaid', // Updated to new position
    category: 'Salle',
    streetAddress: '321 Elm St',
    city: 'New York',
    postalCode: '10004',
    phone: '(555) 456-7890',
    email: 'jordan.lee@urbanplate.com', // CRITICAL: Added email
    contractType: 'CDI',
    startDate: '2024-01-01',
    endDate: null,
    weeklyHours: 35,
    notificationDays: 30,
    // CRITICAL: New fields for comprehensive employee directory
    dateOfBirth: '1988-11-05',
    placeOfBirth: 'Bordeaux',
    countryOfBirth: 'France',
    employeeStatus: 'Employe',
    hiringDate: '2024-01-01',
    hourlyRate: 14,
    grossMonthlySalary: 2123.10,
    socialSecurityNumber: '1 88 11 33 456 789 01'
  },
  {
    id: '5',
    restaurantId: '2',
    firstName: 'Casey',
    lastName: 'Smith',
    position: 'Chef de Partie', // Updated to new position
    category: 'Salle',
    streetAddress: '654 Maple Ave',
    city: 'New York',
    postalCode: '10005',
    phone: '(555) 567-8901',
    email: 'casey.smith@urbanplate.com', // CRITICAL: Added email
    contractType: 'CDD',
    startDate: '2024-02-01',
    endDate: '2025-08-31',
    weeklyHours: 35,
    notificationDays: 30,
    // CRITICAL: New fields for comprehensive employee directory
    dateOfBirth: '1992-07-18',
    placeOfBirth: 'Nantes',
    countryOfBirth: 'France',
    employeeStatus: 'Employe',
    hiringDate: '2024-02-01',
    hourlyRate: 15,
    grossMonthlySalary: 2274.75,
    socialSecurityNumber: '1 92 07 44 567 890 12'
  },
  // CRITICAL: Add test employee with contract starting mid-week (June 17, 2025)
  {
    id: '6',
    restaurantId: '1',
    firstName: 'Nicolas',
    lastName: 'Blass',
    position: 'Commis de Cuisine',
    category: 'Cuisine',
    streetAddress: '123 Test St',
    city: 'Paris',
    postalCode: '75001',
    phone: '06 12 34 56 78',
    email: 'nicolas.blass@oceanbreeze.com', // CRITICAL: Added email
    contractType: 'CDD',
    startDate: '2025-01-17', // Starts mid-week for testing
    endDate: '2025-03-20',
    weeklyHours: 35,
    notificationDays: 30,
    // CRITICAL: New fields for comprehensive employee directory
    dateOfBirth: '1998-04-25',
    placeOfBirth: 'Paris',
    countryOfBirth: 'France',
    employeeStatus: 'Employe',
    hiringDate: '2025-01-17',
    hourlyRate: 13,
    grossMonthlySalary: 1971.45,
    socialSecurityNumber: '1 98 04 75 123 456 78'
  }
];

const currentDate = new Date();
const getWeekStartDate = (date: Date) => {
  const day = date.getDay();
  const diff = date.getDate() - day;
  return new Date(date.setDate(diff)).toISOString().split('T')[0];
};

export const generateMockShifts = (): Shift[] => {
  const shifts: Shift[] = [];
  
  shifts.push(
    {
      id: '1',
      restaurantId: '1',
      employeeId: '1',
      day: 1,
      start: '08:00',
      end: '16:00',
      position: 'Operations Manager',
      color: '#3B82F6',
      type: 'morning'
    },
    {
      id: '2',
      restaurantId: '1',
      employeeId: '1',
      day: 2,
      start: '08:00',
      end: '16:00',
      position: 'Operations Manager',
      color: '#3B82F6',
      type: 'morning'
    },
    {
      id: '3',
      restaurantId: '1',
      employeeId: '2',
      day: 1,
      start: '16:00',
      end: '23:00',
      position: 'Chef de Cuisine',
      color: '#EF4444',
      type: 'evening'
    },
    {
      id: '4',
      restaurantId: '1',
      employeeId: '2',
      day: 2,
      start: '16:00',
      end: '23:00',
      position: 'Chef de Cuisine',
      color: '#EF4444',
      type: 'evening'
    },
    // CRITICAL: Remove shifts for Riley (id: '3') as they start in the future
    // {
    //   id: '5',
    //   restaurantId: '1',
    //   employeeId: '3',
    //   day: 3,
    //   start: '16:00',
    //   end: '23:00',
    //   position: 'Waiter(s)',
    //   color: '#10B981',
    //   type: 'evening'
    // },
    // Add shifts for Nicolas (id: '6') who should be active
    {
      id: '11',
      restaurantId: '1',
      employeeId: '6',
      day: 3,
      start: '09:00',
      end: '17:00',
      position: 'Commis de Cuisine',
      color: '#10B981',
      type: 'morning'
    }
  );
  
  shifts.push(
    {
      id: '7',
      restaurantId: '2',
      employeeId: '4',
      day: 5,
      start: '16:00',
      end: '23:00',
      position: 'Barman/Barmaid',
      color: '#8B5CF6',
      type: 'evening'
    },
    {
      id: '8',
      restaurantId: '2',
      employeeId: '4',
      day: 6,
      start: '16:00',
      end: '23:00',
      position: 'Barman/Barmaid',
      color: '#8B5CF6',
      type: 'evening'
    },
    {
      id: '9',
      restaurantId: '2',
      employeeId: '5',
      day: 1,
      start: '08:00',
      end: '16:00',
      position: 'Chef de Partie',
      color: '#F59E0B',
      type: 'morning'
    },
    {
      id: '10',
      restaurantId: '2',
      employeeId: '5',
      day: 2,
      start: '08:00',
      end: '16:00',
      position: 'Chef de Partie',
      color: '#F59E0B',
      type: 'morning'
    }
  );
  
  return shifts;
};

export const mockSchedules: Schedule[] = [
  {
    id: '1',
    restaurantId: '1',
    weekStartDate: getWeekStartDate(currentDate),
    shifts: generateMockShifts().filter(shift => shift.restaurantId === '1')
  },
  {
    id: '2',
    restaurantId: '2',
    weekStartDate: getWeekStartDate(currentDate),
    shifts: generateMockShifts().filter(shift => shift.restaurantId === '2')
  }
];