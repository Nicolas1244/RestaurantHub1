import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Employee, POSITIONS } from '../../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface StaffRegisterProps {
  employees: Employee[];
  restaurantName: string;
  restaurantLogo?: string;
}

const styles = StyleSheet.create({
  // Cover Page Styles - EXACT replication of CASA FAITOUT layout
  coverPage: {
    padding: 0,
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    position: 'relative',
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantLogo: {
    maxWidth: 200,
    maxHeight: 200,
    objectFit: 'contain',
  },
  coverTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2c3e50',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  coverSubtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#34495e',
    marginBottom: 40,
  },
  restaurantNameCover: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e74c3c',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  coverDate: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 60,
  },
  
  // Data Page Styles
  dataPage: {
    padding: 30,
    fontSize: 10,
    backgroundColor: '#ffffff',
  },
  pageHeader: {
    marginBottom: 25,
    borderBottom: 2,
    borderBottomColor: '#2c3e50',
    paddingBottom: 15,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  pageSubtitle: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  activeEmployeesCount: {
    fontSize: 12,
    color: '#2c3e50',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  
  // Table Styles - EXACT structure matching PDF
  table: {
    display: 'table',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 2,
    borderColor: '#2c3e50',
    marginTop: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#2c3e50',
    minHeight: 35,
    alignItems: 'center',
  },
  tableRowDeparted: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#2c3e50',
    minHeight: 35,
    alignItems: 'center',
    backgroundColor: '#f8f9fa', // CRITICAL: Light gray background for departed employees
  },
  tableHeader: {
    backgroundColor: '#ecf0f1',
    borderBottomWidth: 2,
    borderBottomColor: '#2c3e50',
    minHeight: 40,
  },
  tableCell: {
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#2c3e50',
    fontSize: 9,
    textAlign: 'left',
    verticalAlign: 'middle',
  },
  tableCellHeader: {
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#2c3e50',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2c3e50',
    textTransform: 'uppercase',
  },
  
  // CRITICAL: Updated column widths to accommodate new "Contrat" column
  colNom: { width: '12%' },
  colPrenom: { width: '12%' },
  colPoste: { width: '18%' },
  colContractType: { width: '10%' }, // CRITICAL: Adjusted width for "Contrat"
  colSecuriteSociale: { width: '20%' }, // Slightly increased to compensate
  colDateEntree: { width: '14%' },
  colDateSortie: { width: '14%' },
  
  // Footer
  pageFooter: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#7f8c8d',
    borderTop: 1,
    borderTopColor: '#bdc3c7',
    paddingTop: 10,
  },
});

const StaffRegister: React.FC<StaffRegisterProps> = ({ employees, restaurantName, restaurantLogo }) => {
  // Helper function to format dates in French for PDF
  const formatPDFDate = (dateString: string): string => {
    const date = new Date(dateString);
    // French format: "17 Juin 2025" with proper capitalization
    const formattedDate = format(date, 'd MMMM yyyy', { locale: fr });
    return formattedDate.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // CRITICAL: French position translation function
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
        // Legacy mappings
        'Manager': 'Directeur / Directrice d\'Exploitation',
        'Chef': 'Chef de Cuisine',
        'Sous Chef': 'Second de Cuisine',
        'Line Cook': 'Commis de Cuisine',
        'Server': 'Serveur(se)',
        'Host/Hostess': 'Chef de Partie',
        'Bartender': 'Barman/Barmaid',
        'Busser': 'Commis Débarrasseur',
        'Dishwasher': 'Plongeur',
      };
      
      return translations[position] || position;
    } else {
      // For custom positions, display directly
      return position;
    }
  };

  // Helper function to format social security number for display
  const formatSSN = (ssn?: string): string => {
    if (!ssn) return 'Non renseigné';
    return ssn;
  };

  // CRITICAL: Calculate active employees count
  const getActiveEmployeesCount = (employees: Employee[]): number => {
    const today = new Date();
    return employees.filter(employee => {
      const startDate = new Date(employee.startDate);
      const endDate = employee.endDate ? new Date(employee.endDate) : null;
      
      const isStarted = startDate <= today;
      const isNotEnded = !endDate || endDate >= today;
      
      return isStarted && isNotEnded;
    }).length;
  };

  // CRITICAL: EXACT logic for determining departed employees
  const isEmployeeDeparted = (employee: Employee): boolean => {
    if (!employee.endDate) return false;
    
    const today = new Date();
    const endDate = new Date(employee.endDate);
    
    // CRITICAL: Employee is departed ONLY if end date is STRICTLY PRIOR TO today
    // This means: endDate < today (not endDate <= today)
    return endDate < today;
  };

  // CRITICAL: Sort employees by start date (ascending), then by last name
  const sortedEmployees = [...employees].sort((a, b) => {
    const dateComparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    if (dateComparison !== 0) {
      return dateComparison;
    }
    return a.lastName.localeCompare(b.lastName);
  });

  // Generate current date for document
  const currentDate = format(new Date(), 'd MMMM yyyy', { locale: fr })
    .replace(/\b\w/g, (char) => char.toUpperCase());

  const activeEmployeesCount = getActiveEmployeesCount(employees);

  return (
    <Document>
      {/* COVER PAGE - EXACT replication of CASA FAITOUT layout */}
      <Page size="A4" style={styles.coverPage}>
        {/* CRITICAL: Restaurant Logo Display */}
        {restaurantLogo && (
          <View style={styles.logoContainer}>
            <Image
              src={restaurantLogo}
              style={styles.restaurantLogo}
            />
          </View>
        )}
        
        {/* Main Title */}
        <Text style={styles.coverTitle}>
          REGISTRE DU PERSONNEL
        </Text>
        
        {/* Restaurant Name - Dynamic and Bold */}
        <Text style={styles.coverSubtitle}>
          de <Text style={styles.restaurantNameCover}>{restaurantName.toUpperCase()}</Text>
        </Text>
        
        {/* Generation Date */}
        <Text style={styles.coverDate}>
          Document généré le {currentDate}
        </Text>
      </Page>

      {/* DATA PAGE - Employee table with EXACT structure from PDF */}
      <Page size="A4" style={styles.dataPage}>
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>
            Registre du personnel de <Text style={{ fontWeight: 'bold' }}>{restaurantName}</Text>
          </Text>
          <Text style={styles.pageSubtitle}>
            Liste des employés - Généré le {currentDate}
          </Text>
          {/* CRITICAL: Active employees counter */}
          <Text style={styles.activeEmployeesCount}>
            Nombre d'employés en cours d'activité : {activeEmployeesCount}
          </Text>
        </View>

        {/* Employee Table - EXACT structure with new column */}
        <View style={styles.table}>
          {/* Table Header Row */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={[styles.tableCellHeader, styles.colNom]}>
              <Text>NOM</Text>
            </View>
            <View style={[styles.tableCellHeader, styles.colPrenom]}>
              <Text>PRÉNOM</Text>
            </View>
            <View style={[styles.tableCellHeader, styles.colPoste]}>
              <Text>POSTE</Text>
            </View>
            {/* CRITICAL: Shortened "Type de Contrat" to "Contrat" */}
            <View style={[styles.tableCellHeader, styles.colContractType]}>
              <Text>CONTRAT</Text>
            </View>
            {/* CRITICAL: Shortened header */}
            <View style={[styles.tableCellHeader, styles.colSecuriteSociale]}>
              <Text>NUMÉRO SS</Text>
            </View>
            <View style={[styles.tableCellHeader, styles.colDateEntree]}>
              <Text>DATE{'\n'}D'ENTRÉE</Text>
            </View>
            <View style={[styles.tableCellHeader, styles.colDateSortie]}>
              <Text>DATE{'\n'}DE SORTIE</Text>
            </View>
          </View>

          {/* Employee Data Rows - SORTED by start date with EXACT departed employee styling */}
          {sortedEmployees.map((employee, index) => {
            const isDeparted = isEmployeeDeparted(employee);
            
            return (
              <View 
                key={index} 
                style={isDeparted ? styles.tableRowDeparted : styles.tableRow}
              >
                <View style={[styles.tableCell, styles.colNom]}>
                  <Text>{employee.lastName.toUpperCase()}</Text>
                </View>
                <View style={[styles.tableCell, styles.colPrenom]}>
                  <Text>{employee.firstName}</Text>
                </View>
                <View style={[styles.tableCell, styles.colPoste]}>
                  {/* CRITICAL FIX: Check if position is in predefined list before translating */}
                  <Text>{translatePosition(employee.position)}</Text>
                </View>
                {/* CRITICAL: Contract type column */}
                <View style={[styles.tableCell, styles.colContractType]}>
                  <Text>{employee.contractType}</Text>
                </View>
                <View style={[styles.tableCell, styles.colSecuriteSociale]}>
                  <Text>{formatSSN(employee.socialSecurityNumber)}</Text>
                </View>
                <View style={[styles.tableCell, styles.colDateEntree]}>
                  {/* CRITICAL: French date formatting */}
                  <Text>{formatPDFDate(employee.startDate)}</Text>
                </View>
                <View style={[styles.tableCell, styles.colDateSortie]}>
                  <Text>
                    {employee.endDate ? formatPDFDate(employee.endDate) : '-'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Page Footer */}
        <Text style={styles.pageFooter}>
          Registre du personnel - {restaurantName} - Page {employees.length > 0 ? '2' : '1'}
        </Text>
      </Page>
    </Document>
  );
};

export default StaffRegister;