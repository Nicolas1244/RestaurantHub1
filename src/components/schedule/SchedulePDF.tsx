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
  payBreakTimes?: boolean;
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 15,
    fontSize: 8,
    fontFamily: 'Helvetica',
  },
  
  // Header Section - Professional layout
  header: {
    marginBottom: 15,
    borderBottom: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  restaurantLogo: {
    width: 50,
    height: 50,
    objectFit: 'contain',
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 3,
  },
  restaurantAddress: {
    fontSize: 9,
    color: '#6b7280',
  },
  
  // Center title
  mainTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  weekRange: {
    fontSize: 12,
    color: '#4b5563',
    textAlign: 'center',
  },
  
  // View type indicator
  viewTypeContainer: {
    backgroundColor: '#f3f4f6',
    border: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    padding: 8,
    alignItems: 'center',
  },
  viewTypeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
  },
  
  // Table Styles - Optimized for A4 landscape
  table: {
    display: 'table',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    minHeight: 28,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#f9fafb',
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    minHeight: 32,
  },
  
  // Column widths optimized for signature column
  employeeCell: {
    width: '12%',
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
  },
  dayCell: {
    width: '9%',
    padding: 3,
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
    textAlign: 'center',
  },
  summaryCell: {
    width: '16%',
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
  },
  signatureCell: {
    width: '8%',
    padding: 4,
    borderRightWidth: 0,
    textAlign: 'center',
  },
  
  // Text Styles
  headerText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 1.2,
  },
  employeeName: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 1,
    lineHeight: 1.1,
  },
  employeePosition: {
    fontSize: 7,
    color: '#6b7280',
    marginBottom: 1,
    lineHeight: 1.1,
  },
  employeeContract: {
    fontSize: 6,
    color: '#9ca3af',
    lineHeight: 1.1,
  },
  shiftTime: {
    fontSize: 7,
    color: '#374151',
    marginBottom: 0.5,
    lineHeight: 1.1,
  },
  statusText: {
    fontSize: 7,
    color: '#dc2626',
    fontStyle: 'italic',
    lineHeight: 1.1,
  },
  summaryTitle: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 1,
    lineHeight: 1.1,
  },
  summaryValue: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1f2937',
    lineHeight: 1.1,
  },
  summaryDetail: {
    fontSize: 6,
    color: '#6b7280',
    marginTop: 0.5,
    lineHeight: 1.1,
  },
  proRatedIndicator: {
    fontSize: 5,
    color: '#d97706',
    fontStyle: 'italic',
    marginTop: 0.5,
    lineHeight: 1.1,
  },
  summarySection: {
    marginBottom: 2,
  },
  summaryInline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 1,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    right: 15,
    textAlign: 'center',
    fontSize: 7,
    color: '#9ca3af',
    borderTop: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
});

const SchedulePDF: React.FC<SchedulePDFProps> = ({
  restaurant,
  employees,
  shifts,
  weekStartDate,
  viewType,
  payBreakTimes = true
}) => {
  const { t, i18n } = useTranslation();

  // Get day names based on language
  const getDayName = (dayIndex: number): string => {
    const days = i18n.language === 'fr' 
      ? ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE']
      : ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    return days[dayIndex] || `Day ${dayIndex}`;
  };

  // Format week range with proper localization
  const formatWeekRange = (startDate: Date): string => {
    const endDate = addDays(startDate, 6);
    
    if (i18n.language === 'fr') {
      const startFormatted = format(startDate, 'd MMMM', { locale: fr });
      const endFormatted = format(endDate, 'd MMMM yyyy', { locale: fr });
      const startCapitalized = startFormatted.replace(/\b\w/g, (char) => char.toUpperCase());
      const endCapitalized = endFormatted.replace(/\b\w/g, (char) => char.toUpperCase());
      return `${t('pdf.week')} ${i18n.language === 'fr' ? 'du' : 'from'} ${startCapitalized} ${i18n.language === 'fr' ? 'au' : 'to'} ${endCapitalized}`;
    } else {
      const startFormatted = format(startDate, 'MMM d');
      const endFormatted = format(endDate, 'MMM d, yyyy');
      return `${t('pdf.week')} from ${startFormatted} to ${endFormatted}`;
    }
  };

  // Get view type label with translation
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

  // Get shifts for employee and day
  const getShiftsForDay = (employeeId: string, day: number) => {
    return shifts.filter(shift => 
      shift.employeeId === employeeId && 
      shift.day === day
    );
  };

  // Format shift display
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

  // Get status label with translation
  const getStatusLabel = (status: string): string => {
    const statusLabels: Record<string, string> = {
      'WEEKLY_REST': i18n.language === 'fr' ? 'Repos Hebdo' : 'Weekly Rest',
      'CP': 'CP',
      'PUBLIC_HOLIDAY': i18n.language === 'fr' ? 'Férié' : 'Holiday',
      'SICK_LEAVE': i18n.language === 'fr' ? 'Maladie' : 'Sick Leave',
      'ACCIDENT': i18n.language === 'fr' ? 'Accident' : 'Accident',
      'ABSENCE': i18n.language === 'fr' ? 'Absence' : 'Absence'
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

  // Translate position
  const getPositionDisplay = (position: string): string => {
    if (POSITIONS.includes(position)) {
      const translations: Record<string, string> = {
        'Operations Manager': i18n.language === 'fr' ? 'Directeur / Directrice d\'Exploitation' : 'Operations Manager',
        'Chef de Cuisine': 'Chef de Cuisine',
        'Second de Cuisine': i18n.language === 'fr' ? 'Second de Cuisine' : 'Sous Chef',
        'Chef de Partie': 'Chef de Partie',
        'Commis de Cuisine': i18n.language === 'fr' ? 'Commis de Cuisine' : 'Commis Chef',
        'Plongeur': i18n.language === 'fr' ? 'Plongeur' : 'Dishwasher',
        'Barman/Barmaid': i18n.language === 'fr' ? 'Barman/Barmaid' : 'Bartender',
        'Waiter(s)': i18n.language === 'fr' ? 'Serveur(se)' : 'Server'
      };
      return translations[position] || position;
    } else {
      return position;
    }
  };

  const weekNumber = getWeek(weekStartDate);
  const year = weekStartDate.getFullYear();

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Professional Header */}
        <View style={styles.header}>
          {/* Left: Restaurant Info */}
          <View style={styles.headerLeft}>
            {restaurant.image && (
              <Image
                src={restaurant.image}
                style={styles.restaurantLogo}
              />
            )}
            <Text style={styles.restaurantName}>{restaurant.name}</Text>
            <Text style={styles.restaurantAddress}>{formatRestaurantAddress()}</Text>
          </View>
          
          {/* Center: Main Title */}
          <View style={styles.headerCenter}>
            <Text style={styles.mainTitle}>
              {i18n.language === 'fr' ? 'Planning Hebdomadaire' : 'Weekly Schedule'}
            </Text>
            <Text style={styles.weekRange}>
              {formatWeekRange(weekStartDate)}
            </Text>
          </View>

          {/* Right: View Type */}
          <View style={styles.headerRight}>
            <View style={styles.viewTypeContainer}>
              <Text style={styles.viewTypeText}>{getViewTypeLabel()}</Text>
            </View>
          </View>
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
            
            {/* Day Headers */}
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
                  <Text style={{...styles.headerText, fontSize: 6, marginTop: 1}}>
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

            {/* Signature Column Header */}
            <View style={styles.signatureCell}>
              <Text style={styles.headerText}>
                {i18n.language === 'fr' ? 'ÉMARGEMENT' : 'SIGNATURE'}
              </Text>
            </View>
          </View>

          {/* Employee Rows */}
          {employees.map((employee) => {
            const employeeShifts = shifts.filter(s => s.employeeId === employee.id);
            
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
              employee.startDate,
              employee.endDate,
              weekStartDate,
              payBreakTimes ?? true
            );

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

                {/* Weekly Summary */}
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
                      <Text style={[styles.summaryDetail, { color: '#DC2626', fontWeight: 'bold', marginTop: 2 }]}>
                        {i18n.language === 'fr' 
                          ? `dont ${formatHours(totalPublicHolidayHours)} majorées 100%`
                          : `including ${formatHours(totalPublicHolidayHours)} with 100% premium`}
                      </Text>
                    )}
                  </View>

                  <View style={styles.summarySection}>
                    <View style={styles.summaryInline}>
                      <Text style={styles.summaryTitle}>
                        {i18n.language === 'fr' ? 'Écart:' : 'Diff:'}
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

                {/* Signature Column - Empty for manual signatures */}
                <View style={styles.signatureCell}>
                  {/* Empty cell for manual signatures */}
                </View>
              </View>
            );
          })}
        </View>

        {/* Footer */}
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

export default SchedulePDF;