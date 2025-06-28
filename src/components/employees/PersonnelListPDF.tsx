import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Employee, Restaurant, POSITIONS } from '../../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PersonnelListPDFProps {
  employees: Employee[];
  restaurant: Restaurant;
  filters: {
    nameFilter: string;
    positionFilter: string[];
    contractTypeFilter: string[];
    statusFilter: 'all' | 'active' | 'inactive';
  };
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 20,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  
  // Header Section
  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  restaurantLogo: {
    width: 60,
    height: 60,
    objectFit: 'contain',
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  restaurantAddress: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 8,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  generationInfo: {
    fontSize: 9,
    color: '#9ca3af',
    marginBottom: 8,
  },
  
  // Filter Information Section
  filterSection: {
    backgroundColor: '#f8fafc',
    border: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 6,
  },
  filterInfo: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
  },
  filterActive: {
    fontSize: 9,
    color: '#059669',
    fontWeight: 'bold',
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
    minHeight: 32,
    alignItems: 'center',
  },
  tableRowInactive: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    minHeight: 32,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    minHeight: 36,
  },
  
  // CRITICAL: Column widths optimized for single page
  nameCell: {
    width: '20%',
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
  },
  positionCell: {
    width: '18%',
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
  },
  contractCell: {
    width: '12%',
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
    textAlign: 'center',
  },
  statusCell: {
    width: '10%',
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
    textAlign: 'center',
  },
  periodCell: {
    width: '20%',
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
  },
  contactCell: {
    width: '20%',
    padding: 6,
    borderRightWidth: 0,
  },
  
  // Text Styles
  headerText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  employeeName: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 1,
  },
  employeeNameInactive: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#9ca3af',
    marginBottom: 1,
  },
  cellText: {
    fontSize: 8,
    color: '#374151',
    lineHeight: 1.2,
  },
  cellTextInactive: {
    fontSize: 8,
    color: '#9ca3af',
    lineHeight: 1.2,
  },
  statusActive: {
    fontSize: 8,
    color: '#059669',
    fontWeight: 'bold',
  },
  statusInactive: {
    fontSize: 8,
    color: '#dc2626',
    fontWeight: 'bold',
  },
  contractBadge: {
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 7,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  contractCDI: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  contractCDD: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  contractExtra: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  
  // Summary Section
  summarySection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    border: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 6,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  summaryLabel: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 2,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    borderTop: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
});

const PersonnelListPDF: React.FC<PersonnelListPDFProps> = ({
  employees,
  restaurant,
  filters
}) => {
  // Helper function to determine if employee is active
  const isEmployeeActive = (employee: Employee): boolean => {
    const today = new Date();
    const startDate = new Date(employee.startDate);
    const endDate = employee.endDate ? new Date(employee.endDate) : null;

    const hasStarted = startDate <= today;
    const hasNotEnded = !endDate || endDate >= today;

    return hasStarted && hasNotEnded;
  };

  // Helper function to format dates in French
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const formattedDate = format(date, 'd MMMM yyyy', { locale: fr });
    return formattedDate.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Helper function to format contract period
  const formatContractPeriod = (startDate: string, endDate: string | null): string => {
    const formattedStart = formatDate(startDate);
    
    if (endDate) {
      const formattedEnd = formatDate(endDate);
      return `${formattedStart} - ${formattedEnd}`;
    }
    
    return formattedStart;
  };

  // Helper function to translate positions to French
  const translatePosition = (position: string): string => {
    // CRITICAL FIX: Check if position is in predefined list before translating
    if (POSITIONS.includes(position)) {
      const translations: Record<string, string> = {
        'Operations Manager': 'Directeur / Directrice d\'Exploitation',
        'Chef de Cuisine': 'Chef de Cuisine',
        'Second de Cuisine': 'Second de Cuisine',
        'Chef de Partie': 'Chef de Partie',
        'Commis de Cuisine': 'Commis de Cuisine',
        'Plongeur': 'Plongeur',
        'Barman/Barmaid': 'Barman/Barmaid',
        'Waiter(s)': 'Serveur(se)',
      };
      
      return translations[position] || position;
    } else {
      // For custom positions, display directly
      return position;
    }
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

  // Get filter summary
  const getFilterSummary = (): string[] => {
    const summary: string[] = [];
    
    if (filters.statusFilter === 'active') {
      summary.push('Employés actifs uniquement');
    } else if (filters.statusFilter === 'inactive') {
      summary.push('Employés inactifs uniquement');
    }
    
    if (filters.nameFilter) {
      summary.push(`Recherche: "${filters.nameFilter}"`);
    }
    
    if (filters.positionFilter.length > 0) {
      summary.push(`Postes: ${filters.positionFilter.join(', ')}`);
    }
    
    if (filters.contractTypeFilter.length > 0) {
      summary.push(`Contrats: ${filters.contractTypeFilter.join(', ')}`);
    }
    
    return summary;
  };

  // Calculate summary statistics
  const activeEmployees = employees.filter(emp => isEmployeeActive(emp)).length;
  const inactiveEmployees = employees.length - activeEmployees;
  const cdiCount = employees.filter(emp => emp.contractType === 'CDI').length;
  const cddCount = employees.filter(emp => emp.contractType === 'CDD').length;
  const extraCount = employees.filter(emp => emp.contractType === 'Extra').length;

  const currentDate = format(new Date(), 'd MMMM yyyy à HH:mm', { locale: fr })
    .replace(/\b\w/g, (char) => char.toUpperCase());

  const filterSummary = getFilterSummary();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.restaurantName}>{restaurant.name}</Text>
            <Text style={styles.restaurantAddress}>{formatRestaurantAddress()}</Text>
            <Text style={styles.documentTitle}>Liste du Personnel</Text>
            <Text style={styles.generationInfo}>
              Généré le {currentDate}
            </Text>
          </View>
          
          {restaurant.image && (
            <View style={styles.headerRight}>
              <Image
                src={restaurant.image}
                style={styles.restaurantLogo}
              />
            </View>
          )}
        </View>

        {/* Filter Information */}
        {filterSummary.length > 0 && (
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Filtres appliqués :</Text>
            {filterSummary.map((filter, index) => (
              <Text key={index} style={styles.filterActive}>• {filter}</Text>
            ))}
            <Text style={styles.filterInfo}>
              Résultats : {employees.length} employé(s) affiché(s)
            </Text>
          </View>
        )}

        {/* Personnel Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={styles.nameCell}>
              <Text style={styles.headerText}>Nom et Prénom</Text>
            </View>
            <View style={styles.positionCell}>
              <Text style={styles.headerText}>Poste</Text>
            </View>
            <View style={styles.contractCell}>
              <Text style={styles.headerText}>Contrat</Text>
            </View>
            <View style={styles.statusCell}>
              <Text style={styles.headerText}>Statut</Text>
            </View>
            <View style={styles.periodCell}>
              <Text style={styles.headerText}>Période de Contrat</Text>
            </View>
            <View style={styles.contactCell}>
              <Text style={styles.headerText}>Contact</Text>
            </View>
          </View>

          {/* Employee Rows */}
          {employees.map((employee) => {
            const isActive = isEmployeeActive(employee);
            
            return (
              <View 
                key={employee.id} 
                style={isActive ? styles.tableRow : styles.tableRowInactive}
              >
                {/* Name */}
                <View style={styles.nameCell}>
                  <Text style={isActive ? styles.employeeName : styles.employeeNameInactive}>
                    {employee.lastName.toUpperCase()}, {employee.firstName}
                  </Text>
                </View>

                {/* Position */}
                <View style={styles.positionCell}>
                  <Text style={isActive ? styles.cellText : styles.cellTextInactive}>
                    {translatePosition(employee.position)}
                  </Text>
                </View>

                {/* Contract Type */}
                <View style={styles.contractCell}>
                  <View style={[
                    styles.contractBadge,
                    employee.contractType === 'CDI' ? styles.contractCDI :
                    employee.contractType === 'CDD' ? styles.contractCDD :
                    styles.contractExtra
                  ]}>
                    <Text>{employee.contractType}</Text>
                  </View>
                </View>

                {/* Status */}
                <View style={styles.statusCell}>
                  <Text style={isActive ? styles.statusActive : styles.statusInactive}>
                    {isActive ? 'ACTIF' : 'INACTIF'}
                  </Text>
                </View>

                {/* Contract Period */}
                <View style={styles.periodCell}>
                  <Text style={isActive ? styles.cellText : styles.cellTextInactive}>
                    {formatContractPeriod(employee.startDate, employee.endDate)}
                  </Text>
                </View>

                {/* Contact */}
                <View style={styles.contactCell}>
                  <Text style={isActive ? styles.cellText : styles.cellTextInactive}>
                    {employee.phone}
                  </Text>
                  <Text style={[isActive ? styles.cellText : styles.cellTextInactive, { fontSize: 7, marginTop: 1 }]}>
                    {employee.city}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Summary Statistics */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Résumé</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{employees.length}</Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#059669' }]}>{activeEmployees}</Text>
              <Text style={styles.summaryLabel}>Actifs</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#dc2626' }]}>{inactiveEmployees}</Text>
              <Text style={styles.summaryLabel}>Inactifs</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#059669' }]}>{cdiCount}</Text>
              <Text style={styles.summaryLabel}>CDI</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#d97706' }]}>{cddCount}</Text>
              <Text style={styles.summaryLabel}>CDD</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#dc2626' }]}>{extraCount}</Text>
              <Text style={styles.summaryLabel}>Extra</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Liste du Personnel - {restaurant.name} - Généré le {currentDate}
        </Text>
      </Page>
    </Document>
  );
};

export default PersonnelListPDF;