import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Employee, POSITIONS, EMPLOYEE_STATUS } from '../../types';
import { format, parseISO, differenceInYears } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DirectoryPDFProps {
  employees: Employee[];
  restaurantName: string;
  columnVisibility: Record<string, boolean>;
  restaurant: any; // Using any to accommodate the restaurant object
}

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 8,
  },
  header: {
    marginBottom: 20,
    borderBottom: 1,
    borderBottomColor: '#2563eb',
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
  },
  headerLogo: {
    width: 60,
    height: 60,
    objectFit: 'contain',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 12,
    color: '#4b5563',
    marginBottom: 5,
  },
  restaurantInfo: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 5,
  },
  siretInfo: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 5,
  },
  dateInfo: {
    fontSize: 8,
    color: '#9ca3af',
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableRowEven: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#2563eb',
  },
  tableHeaderCell: {
    padding: 5,
    fontSize: 8,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'left',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  tableCell: {
    padding: 5,
    fontSize: 8,
    color: '#4b5563',
    textAlign: 'left',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  tableCellBold: {
    padding: 5,
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'left',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  contractBadge: {
    padding: '2 5',
    borderRadius: 10,
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
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 8,
    textAlign: 'center',
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    fontSize: 8,
    color: '#9ca3af',
  },
});

const DirectoryPDF: React.FC<DirectoryPDFProps> = ({ employees, restaurantName, columnVisibility, restaurant }) => {
  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0;
    return differenceInYears(new Date(), parseISO(dateOfBirth));
  };
  
  // Calculate monthly hours from weekly hours
  const calculateMonthlyHours = (weeklyHours: number): number => {
    // CRITICAL FIX: Use correct formula for monthly hours calculation
    return Math.round(((weeklyHours * 52) / 12) * 100) / 100;
  };
  
  // Format date
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '-';
    
    try {
      const date = parseISO(dateString);
      return format(date, 'dd/MM/yyyy');
    } catch (error) {
      return '-';
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number | undefined): string => {
    if (amount === undefined) return '-';
    return `${amount.toFixed(2)} €`;
  };
  
  // Get visible columns
  const visibleColumns = Object.entries(columnVisibility)
    .filter(([_, isVisible]) => isVisible)
    .map(([column]) => column);
  
  // Get column width based on number of visible columns
  const getColumnWidth = (column: string): string => {
    // Fixed widths for certain columns
    const fixedWidths: Record<string, string> = {
      lastName: '10%',
      firstName: '10%',
      dateOfBirth: '8%',
      placeOfBirth: '8%',
      countryOfBirth: '8%',
      employeeStatus: '7%',
      position: '10%',
      email: '12%',
      address: '12%',
      postalCode: '7%',
      city: '8%',
      phone: '8%',
      socialSecurityNumber: '10%',
      contractType: '7%',
      hiringDate: '8%',
      endDate: '8%',
      weeklyHours: '7%',
      monthlyHours: '7%',
      hourlyRate: '7%',
      grossMonthlySalary: '8%',
    };
    
    return fixedWidths[column] || '8%';
  };
  
  // Get column header
  const getColumnHeader = (column: string): string => {
    const headers: Record<string, string> = {
      lastName: 'NOM',
      firstName: 'PRÉNOM',
      dateOfBirth: 'DATE DE NAISSANCE',
      placeOfBirth: 'LIEU DE NAISSANCE',
      countryOfBirth: 'PAYS DE NAISSANCE',
      employeeStatus: 'STATUT',
      position: 'POSTE',
      email: 'EMAIL',
      address: 'ADRESSE',
      postalCode: 'CODE POSTAL',
      city: 'VILLE',
      phone: 'TÉLÉPHONE',
      socialSecurityNumber: 'NUMÉRO DE SS',
      contractType: 'TYPE DE CONTRAT',
      hiringDate: 'DATE D\'EMBAUCHE',
      endDate: 'DATE DE FIN',
      weeklyHours: 'BASE HORAIRE',
      monthlyHours: 'HEURES MENSUELLES',
      hourlyRate: 'TAUX HORAIRE',
      grossMonthlySalary: 'SALAIRE BRUT',
    };
    
    return headers[column] || column.toUpperCase();
  };
  
  // Get cell value
  const getCellValue = (employee: Employee, column: string): string | React.ReactNode => {
    switch (column) {
      case 'lastName':
        return employee.lastName;
      case 'firstName':
        return employee.firstName;
      case 'dateOfBirth':
        return employee.dateOfBirth ? `${formatDate(employee.dateOfBirth)} (${calculateAge(employee.dateOfBirth)} ans)` : '-';
      case 'placeOfBirth':
        return employee.placeOfBirth || '-';
      case 'countryOfBirth':
        return employee.countryOfBirth || 'France';
      case 'employeeStatus':
        return EMPLOYEE_STATUS[employee.employeeStatus as keyof typeof EMPLOYEE_STATUS] || 'Employé(e)';
      case 'position':
        // CRITICAL FIX: Check if position is in predefined list before translating
        if (POSITIONS.includes(employee.position)) {
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
          return translations[employee.position] || employee.position;
        } else {
          return employee.position;
        }
      case 'email':
        return employee.email || '-';
      case 'address':
        return employee.streetAddress;
      case 'postalCode':
        return employee.postalCode;
      case 'city':
        return employee.city;
      case 'phone':
        return employee.phone;
      case 'socialSecurityNumber':
        return employee.socialSecurityNumber || '-';
      case 'contractType':
        return employee.contractType;
      case 'hiringDate':
        return formatDate(employee.hiringDate || employee.startDate);
      case 'endDate':
        return employee.endDate ? formatDate(employee.endDate) : (employee.contractType === 'CDI' ? 'N/A' : '-');
      case 'weeklyHours':
        return `${employee.weeklyHours || 35}h`;
      case 'monthlyHours':
        return `${calculateMonthlyHours(employee.weeklyHours || 35)}h`;
      case 'hourlyRate':
        return employee.hourlyRate ? formatCurrency(employee.hourlyRate) : '-';
      case 'grossMonthlySalary':
        return employee.grossMonthlySalary ? formatCurrency(employee.grossMonthlySalary) : '-';
      default:
        return '-';
    }
  };
  
  // Get contract badge style
  const getContractBadgeStyle = (contractType: string) => {
    switch (contractType) {
      case 'CDI':
        return { ...styles.contractBadge, ...styles.contractCDI };
      case 'CDD':
        return { ...styles.contractBadge, ...styles.contractCDD };
      case 'Extra':
        return { ...styles.contractBadge, ...styles.contractExtra };
      default:
        return styles.contractBadge;
    }
  };
  
  // Format restaurant address
  const formatRestaurantAddress = (): string => {
    if (!restaurant) return '';
    
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
  
  // Current date for header
  const currentDate = format(new Date(), 'd MMMM yyyy', { locale: fr })
    .replace(/\b\w/g, (char) => char.toUpperCase());
  
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header with Logo */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Répertoire Complet du Personnel</Text>
            <Text style={styles.subtitle}>{restaurantName}</Text>
            <Text style={styles.restaurantInfo}>{formatRestaurantAddress()}</Text>
            <Text style={styles.siretInfo}>{restaurant?.siret ? `SIRET: ${restaurant.siret}` : ''}</Text>
            <Text style={styles.dateInfo}>Document généré le {currentDate}</Text>
          </View>
          
          {/* Restaurant Logo */}
          {restaurant?.image && (
            <Image
              src={restaurant.image}
              style={styles.headerLogo}
            />
          )}
        </View>
        
        {/* Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            {visibleColumns.map((column) => (
              <View key={column} style={[styles.tableHeaderCell, { width: getColumnWidth(column) }]}>
                <Text>{getColumnHeader(column)}</Text>
              </View>
            ))}
          </View>
          
          {/* Table Rows */}
          {employees.map((employee, index) => (
            <View key={employee.id} style={index % 2 === 0 ? styles.tableRow : styles.tableRowEven}>
              {visibleColumns.map((column) => (
                <View key={column} style={[
                  column === 'lastName' || column === 'firstName' ? styles.tableCellBold : styles.tableCell, 
                  { width: getColumnWidth(column) }
                ]}>
                  {column === 'contractType' ? (
                    <Text style={getContractBadgeStyle(employee.contractType)}>
                      {employee.contractType}
                    </Text>
                  ) : (
                    <Text>{getCellValue(employee, column)}</Text>
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>
        
        {/* Footer */}
        <Text style={styles.footer}>
          Répertoire Complet du Personnel - {restaurantName} - Document généré le {currentDate}
        </Text>
        
        {/* Page Number */}
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} / ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
};

export default DirectoryPDF;