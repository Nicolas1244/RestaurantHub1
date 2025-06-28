import React, { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { Employee } from '../../types';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface DirectoryExportButtonProps {
  employees: Employee[];
  restaurantName: string;
  className?: string;
}

const DirectoryExportButton: React.FC<DirectoryExportButtonProps> = ({
  employees,
  restaurantName,
  className = ''
}) => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    
    try {
      // Show loading toast
      const loadingToast = toast.loading(
        i18n.language === 'fr' 
          ? 'Génération du répertoire en cours...' 
          : 'Generating directory...'
      );
      
      // Format date for display
      const formatDate = (dateString: string | undefined): string => {
        if (!dateString) return '-';
        try {
          const date = new Date(dateString);
          return format(date, 'dd/MM/yyyy');
        } catch (error) {
          return '-';
        }
      };
      
      // CRITICAL FIX: Calculate monthly hours from weekly hours using the correct formula
      const calculateMonthlyHours = (weeklyHours: number): number => {
        // Correct formula: (Weekly Hours * 52) / 12 = 151.67 for 35 hours
        return Math.round(((weeklyHours * 52) / 12) * 100) / 100;
      };
      
      // Prepare data for export
      const data = employees.map(employee => ({
        'Nom': employee.lastName,
        'Prénom': employee.firstName,
        'Date de Naissance': formatDate(employee.dateOfBirth),
        'Lieu de Naissance': employee.placeOfBirth || '-',
        'Pays de Naissance': employee.countryOfBirth || 'France',
        'Statut': employee.employeeStatus || 'Employé(e)',
        'Poste': employee.position,
        'Email': employee.email || '-',
        'Adresse': employee.streetAddress,
        'Code Postal': employee.postalCode,
        'Ville': employee.city,
        'Téléphone': employee.phone,
        'Numéro de SS': employee.socialSecurityNumber || '-',
        'Type de Contrat': employee.contractType,
        'Date d\'embauche': formatDate(employee.hiringDate || employee.startDate),
        'Date de début': formatDate(employee.startDate),
        'Date de fin': employee.endDate ? formatDate(employee.endDate) : (employee.contractType === 'CDI' ? 'N/A' : '-'),
        'Base Horaire (Hebdo)': employee.weeklyHours || 35,
        'Heures Mensuelles': calculateMonthlyHours(employee.weeklyHours || 35),
        'Taux Horaire': employee.hourlyRate || '-',
        'Salaire Brut Mensuel': employee.grossMonthlySalary || '-'
      }));
      
      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Répertoire');
      
      // Generate filename
      const fileName = `repertoire-complet-${restaurantName.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      
      // Write to file and trigger download
      XLSX.writeFile(wb, fileName);
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success(
        i18n.language === 'fr' 
          ? 'Répertoire exporté avec succès' 
          : 'Directory exported successfully'
      );
    } catch (error) {
      console.error('Failed to export directory:', error);
      toast.error(
        i18n.language === 'fr' 
          ? 'Échec de l\'exportation du répertoire' 
          : 'Failed to export directory'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className={`flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          {i18n.language === 'fr' ? 'Exportation...' : 'Exporting...'}
        </>
      ) : (
        <>
          <Download size={16} className="mr-2" />
          Exporter le Répertoire Complet
        </>
      )}
    </button>
  );
};

export default DirectoryExportButton;