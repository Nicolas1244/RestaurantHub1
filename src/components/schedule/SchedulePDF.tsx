import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Employee, Shift, Restaurant, POSITIONS } from '../../types';
import { format, addDays, getWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { calculateEmployeeWeeklySummary, formatHours, formatHoursDiff } from '../../lib/scheduleUtils';

interface SchedulePDFProps {
  restaurant: Restaurant;
  employees: Employee[];
  shifts: Shift[];
  weekStartDate: Date;
  viewType: 'all' | 'cuisine' | 'salle';
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 15,
    fontSize: 8,
    fontFamily: 'Helvetica',
  },
  
  // Header Section - Optimized for single page
  header: {
    marginBottom: 12,
    borderBottom: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    width: 80,
    alignItems: 'center',
  },
  restaurantLogo: {
    width: 70,
    height: 70,
    objectFit: 'contain',
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 3,
  },
  restaurantAddress: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 6,
  },
  weekInfo: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 3,
  },
  
  // Main Title - Centered and prominent
  mainTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  
  // View Type Indicator - Compact
  viewTypeContainer: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#f3f4f6',
    border: 1,
    borderColor: '#d1d5db',
    borderRadius: 3,
    padding: 6,
  },
  viewTypeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
  },
  
  // Table Styles - Optimized for single page
  table: {
    display: 'table',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginTop: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    minHeight: 24, // Reduced from 30
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#f9fafb',
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    minHeight: 28, // Reduced from 35
  },
  
  // CRITICAL: Optimized column widths for single page with signature column
  employeeCell: {
    width: '11%', // Reduced from 12%
    padding: 4, // Reduced from 6
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
  },
  dayCell: {
    width: '8.5%', // Reduced from 10%
    padding: 3, // Reduced from 4
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
    textAlign: 'center',
  },
  summaryCell: {
    width: '16%', // Reduced from 18%
    padding: 4, // Reduced from 6
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
  },
  // CRITICAL: Signature column - EMPTY BOX ONLY
  signatureCell: {
    width: '8%', // New column for signatures
    padding: 4,
    borderRightWidth: 0,
    textAlign: 'center',
    // REMOVED: All content styling - keeping only the empty cell
  },
  
  // Text Styles - Optimized for readability
  headerText: {
    fontSize: 7, // Reduced from 9
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 1.2,
  },
  employeeName: {
    fontSize: 7, // Reduced from 9
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 1,
    lineHeight: 1.1,
  },
  employeePosition: {
    fontSize: 6, // Reduced from 7
    color: '#6b7280',
    marginBottom: 1,
    lineHeight: 1.1,
  },
  employeeContract: {
    fontSize: 6, // Reduced from 7
    color: '#9ca3af',
    lineHeight: 1.1,
  },
  shiftTime: {
    fontSize: 6, // Reduced from 8
    color: '#374151',
    marginBottom: 0.5,
    lineHeight: 1.1,
  },
  statusText: {
    fontSize: 6, // Reduced from 7
    color: '#dc2626',
    fontStyle: 'italic',
    lineHeight: 1.1,
  },
  // CRITICAL: Compact summary styling for single page
  summaryTitle: {
    fontSize: 6, // Reduced from 8
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 1,
    lineHeight: 1.1,
  },
  summaryValue: {
    fontSize: 7, // Reduced from 9
    fontWeight: 'bold',
    color: '#1f2937',
    lineHeight: 1.1,
  },
  summaryDetail: {
    fontSize: 5, // Reduced from 7
    color: '#6b7280',
    marginTop: 0.5,
    lineHeight: 1.1,
  },
  // CRITICAL: Pro-rated indicator styling
  proRatedIndicator: {
    fontSize: 5,
    color: '#d97706',
    fontStyle: 'italic',
    marginTop: 0.5,
    lineHeight: 1.1,
  },
  // CRITICAL: Compact summary layout
  summarySection: {
    marginBottom: 2, // Reduced spacing
  },
  summaryInline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 1,
  },
  
  // CRITICAL: REMOVED all signature styling - keeping only header text
  signatureHeaderText: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 1.2,
  },
  
  // Footer - Compact
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    right: 15,
    textAlign: 'center',
    fontSize: 7, // Reduced from 8
    color: '#9ca3af',
    borderTop: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 6, // Reduced from 10
  },
});

const SchedulePDF: React.FC<SchedulePDFProps> = ({
  restaurant,
  employees,
  shifts,
  weekStartDate,
  viewType
}) => {
  const { t, i18n } = useTranslation();

  // CRITICAL: French day names mapping
  const getDayName = (dayIndex: number): string => {
    const days = i18n.language === 'fr' 
      ? ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE']
      : ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    return days[dayIndex] || `Jour ${dayIndex}`;
  };

  // Helper function to format week range with full French localization
  const formatWeekRange = (startDate: Date): string => {
    const endDate = addDays(startDate, 6);
    
    if (i18n.language === 'fr') {
      const startFormatted = format(startDate, 'd MMMM', { locale: fr });
      const endFormatted = format(endDate, 'd MMMM yyyy', { locale: fr });
      // CRITICAL: Capitalize month names in French
      const startCapitalized = startFormatted.replace(/\b\w/g, (char) => char.toUpperCase());
      const endCapitalized = endFormatted.replace(/\b\w/g, (char) => char.toUpperCase());
      return `${startCapitalized} - ${endCapitalized}`;
    } else {
      const startFormatted = format(startDate, 'MMM d');
      const endFormatted = format(endDate, 'MMM d, yyyy');
      return `${startFormatted} - ${endFormatted}`;
    }
  };

  // CRITICAL: Full French localization for view type labels
  const getViewTypeLabel = (): string => {
    switch (viewType) {
      case 'cuisine':
        return i18n.language === 'fr' ? 'Vue Cuisine' : 'Kitchen View';
      case 'salle':
        return i18n.language === 'fr' ? 'Vue Salle' : 'Dining Room View';
      default:
        return i18n.language === 'fr' ? 'Vue Globale' : 'Global View';
    }
  };

  // Helper function to get shifts for employee and day
  const getShiftsForDay = (employeeId: string, day: number) => {
    return shifts.filter(shift => 
      shift.employeeId === employeeId && 
      shift.day === day
    );
  };

  // Helper function to format shift display
  const formatShiftDisplay = (dayShifts: Shift[]): { times: string[]; status: string | null } => {
    const times: string[] = [];
    let status: string | null = null;

    dayShifts.forEach(shift => {
      if (shift.status) {
        status = shift.status;
      } else if (shift.start && shift.end) {
        times.push(`${shift.start}-${shift.end}`);
      }
    });

    return { times, status };
  };

  // CRITICAL: French localization for status labels
  const getStatusLabel = (status: string): string => {
    const statusLabels: Record<string, string> = {
      'WEEKLY_REST': 'Repos Hebdo',
      'CP': 'CP',
      'PUBLIC_HOLIDAY': 'Férié',
      'SICK_LEAVE': 'Maladie',
      'ACCIDENT': 'Accident',
      'ABSENCE': 'Absence'
    };
    return statusLabels[status] || status;
  };

  // Format restaurant address
  const formatRestaurantAddress = (): string => {
    const addressParts = [];
    if (restaurant.streetAddress) addressParts.push(restaurant.streetAddress);
    if (restaurant.postalCode && restaurant.city) {
      addressParts.push(`${restaurant.postalCode} ${restaurant.city}`);
    } else if (restaurant.city) {
      addressParts.push(restaurant.city);
    }
    if (restaurant.country) addressParts.push(restaurant.country);
    
    return addressParts.length > 0 ? addressParts.join(', ') : restaurant.location;
  };

  const weekNumber = getWeek(weekStartDate);
  const year = weekStartDate.getFullYear();
  const weekRange = formatWeekRange(weekStartDate);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header Section with Logo */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.restaurantName}>{restaurant.name}</Text>
            <Text style={styles.restaurantAddress}>{formatRestaurantAddress()}</Text>
            <Text style={styles.weekInfo}>
              {i18n.language === 'fr' ? 'Semaine' : 'Week'} {weekNumber}, {year} - {weekRange}
            </Text>
          </View>
          
          {/* Restaurant Logo */}
          {restaurant.image && (
            <View style={styles.headerRight}>
              <Image
                src={restaurant.image}
                style={styles.restaurantLogo}
              />
            </View>
          )}
        </View>

        {/* Main Title - Centered and Localized */}
        <Text style={styles.mainTitle}>
          {i18n.language === 'fr' ? 'Planning Hebdomadaire' : 'Weekly Schedule'}
        </Text>

        {/* View Type Indicator */}
        <View style={styles.viewTypeContainer}>
          <Text style={styles.viewTypeText}>{getViewTypeLabel()}</Text>
        </View>

        {/* Schedule Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={styles.employeeCell}>
              <Text style={styles.headerText}>
                {i18n.language === 'fr' ? 'EMPLOYÉ' : 'EMPLOYEE'}
              </Text>
            </View>
            
            {/* Day Headers with French localization */}
            {Array.from({ length: 7 }, (_, index) => {
              const date = addDays(weekStartDate, index);
              const dayName = getDayName(index);
              const dayDate = format(date, 'd MMM', { 
                locale: i18n.language === 'fr' ? fr : undefined 
              });
              
              return (
                <View key={index} style={styles.dayCell}>
                  <Text style={styles.headerText}>
                    {dayName}
                  </Text>
                  <Text style={[styles.headerText, { fontSize: 6, marginTop: 1 }]}>
                    {i18n.language === 'fr' ? dayDate.replace(/\b\w/g, (char) => char.toUpperCase()) : dayDate}
                  </Text>
                </View>
              );
            })}
            
            <View style={styles.summaryCell}>
              <Text style={styles.headerText}>
                {i18n.language === 'fr' ? 'RÉSUMÉ\nHEBDOMADAIRE' : 'WEEKLY\nSUMMARY'}
              </Text>
            </View>

            {/* CRITICAL: Signature Column Header - ONLY HEADER TEXT */}
            <View style={styles.signatureCell}>
              <Text style={styles.signatureHeaderText}>
                {i18n.language === 'fr' ? 'ÉMARGEMENT' : 'SIGNATURE'}
              </Text>
            </View>
          </View>

          {/* Employee Rows */}
          {employees.map((employee) => {
            const employeeShifts = shifts.filter(s => s.employeeId === employee.id);
            
            // CRITICAL: Use enhanced calculation with pro-rated hours
            const { 
              totalWorkedHours,
              totalAssimilatedHours,
              totalPublicHolidayHours,
              hoursDiff,
              shiftCount,
              proRatedContractHours
            } = calculateEmployeeWeeklySummary(
              employeeShifts, 
              employee.weeklyHours || 35,
              employee.startDate,  // CRITICAL: Pass employee contract dates
              employee.endDate,    // CRITICAL: Pass employee contract dates
              weekStartDate        // CRITICAL: Pass week start date
            );

            // CRITICAL: Check if pro-rated hours differ from full contract
            const isProRated = Math.abs(proRatedContractHours - (employee.weeklyHours || 35)) > 0.1;

            return (
              <View key={employee.id} style={styles.tableRow}>
                {/* Employee Info */}
                <View style={styles.employeeCell}>
                  <Text style={styles.employeeName}>
                    {employee.firstName} {employee.lastName}
                  </Text>
                  <Text style={styles.employeePosition}>
                    {getPositionDisplay(employee.position)}
                  </Text>
                  <Text style={styles.employeeContract}>
                    {employee.weeklyHours || 35}H - {employee.contractType}
                    {/* CRITICAL: Show pro-rated indicator in PDF */}
                    {isProRated && (
                      <Text style={styles.proRatedIndicator}>
                        {'\n'}Pro-rata: {formatHours(proRatedContractHours)}
                      </Text>
                    )}
                  </Text>
                </View>

                {/* Daily Shifts */}
                {Array.from({ length: 7 }, (_, dayIndex) => {
                  const dayShifts = getShiftsForDay(employee.id, dayIndex);
                  const { times, status } = formatShiftDisplay(dayShifts);

                  return (
                    <View key={dayIndex} style={styles.dayCell}>
                      {status ? (
                        <Text style={styles.statusText}>
                          {getStatusLabel(status)}
                        </Text>
                      ) : (
                        times.map((time, timeIndex) => (
                          <Text key={timeIndex} style={styles.shiftTime}>
                            {time}
                          </Text>
                        ))
                      )}
                    </View>
                  );
                })}

                {/* CRITICAL: Enhanced Weekly Summary with Pro-rated Hours Display */}
                <View style={styles.summaryCell}>
                  <View style={styles.summarySection}>
                    <View style={styles.summaryInline}>
                      <Text style={styles.summaryTitle}>
                        {i18n.language === 'fr' ? 'Travaillées:' : 'Worked:'}
                      </Text>
                      <Text style={styles.summaryValue}>
                        {formatHours(totalWorkedHours)}
                      </Text>
                    </View>
                    {totalAssimilatedHours > 0 && (
                      <Text style={styles.summaryDetail}>
                        + {formatHours(totalAssimilatedHours)} CP
                      </Text>
                    )}
                    {totalPublicHolidayHours > 0 && (
                      <Text style={styles.summaryDetail}>
                        {formatHours(totalPublicHolidayHours)} Férié
                      </Text>
                    )}
                  </View>

                  <View style={styles.summarySection}>
                    <View style={styles.summaryInline}>
                      <Text style={styles.summaryTitle}>
                        {i18n.language === 'fr' ? 'Écart:' : 'Diff:'}
                        {/* CRITICAL: Show pro-rated indicator in PDF */}
                        {isProRated && (
                          <Text style={styles.proRatedIndicator}> (Pro-rata)</Text>
                        )}
                      </Text>
                      <Text style={[
                        styles.summaryValue,
                        { color: hoursDiff > 0 ? '#dc2626' : hoursDiff < 0 ? '#2563eb' : '#374151' }
                      ]}>
                        {formatHoursDiff(hoursDiff)}
                      </Text>
                    </View>
                    {/* CRITICAL: Show pro-rated base hours for transparency */}
                    {isProRated && (
                      <Text style={styles.proRatedIndicator}>
                        Base: {formatHours(proRatedContractHours)}
                      </Text>
                    )}
                  </View>

                  <View style={styles.summarySection}>
                    <View style={styles.summaryInline}>
                      <Text style={styles.summaryTitle}>
                        {i18n.language === 'fr' ? 'Services:' : 'Shifts:'}
                      </Text>
                      <Text style={styles.summaryValue}>
                        {shiftCount}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* CRITICAL: EMPTY Signature Column - NO CONTENT, JUST THE CELL */}
                <View style={styles.signatureCell}>
                  {/* COMPLETELY EMPTY - No signature lines, no content */}
                </View>
              </View>
            );
          })}
        </View>

        {/* Footer with French localization */}
        <Text style={styles.footer}>
          {i18n.language === 'fr' 
            ? `Planning généré le ${format(new Date(), 'd MMMM yyyy à HH:mm', { locale: fr }).replace(/\b\w/g, (char) => char.toUpperCase())} - ${restaurant.name}`
            : `Schedule generated on ${format(new Date(), 'MMMM d, yyyy at HH:mm')} - ${restaurant.name}`
          }
        </Text>
      </Page>
    </Document>
  );
};

// CRITICAL FIX: Check if position is in predefined list before translating
const getPositionDisplay = (position: string): string => {
  // For predefined positions, use the position key for translation
  if (POSITIONS.includes(position)) {
    const translations: Record<string, string> = {
      'Operations Manager': 'Directeur / Directrice d\'Exploitation',
      'Chef de Cuisine': 'Chef de Cuisine',
      'Second de Cuisine': 'Second de Cuisine',
      'Chef de Partie': 'Chef de Partie',
      'Commis de Cuisine': 'Commis de Cuisine',
      'Plongeur': 'Plongeur',
      'Barman/Barmaid': 'Barman/Barmaid',
      'Waiter(s)': 'Serveur(se)'
    };
    return translations[position] || position;
  } else {
    // For custom positions, display directly
    return position;
  }
};

export default SchedulePDF;