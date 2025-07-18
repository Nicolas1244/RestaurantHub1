import React, { useState, useRef } from 'react';
import { X, Printer, Download, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { parseISO } from 'date-fns';
import { Restaurant, Employee, Shift } from '../../types';
import SchedulePDF from './SchedulePDF';
import { useReactToPrint } from 'react-to-print';
import { pdf } from '@react-pdf/renderer';
import { useAppContext } from '../../contexts/AppContext';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant;
  employees: Employee[];
  shifts: Shift[];
  weekStartDate: string;
  viewType: 'all' | 'cuisine' | 'salle';
}

export const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  isOpen,
  onClose,
  restaurant,
  employees,
  shifts,
  weekStartDate,
  viewType
}) => {
  const { t, i18n } = useTranslation();
  const { settings } = useAppContext();
  const [isGenerating, setIsGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const weekStartDateObj = parseISO(weekStartDate);

  const filteredEmployees = viewType === 'all' 
    ? employees 
    : employees.filter(emp => {
        if (viewType === 'cuisine') return emp.category === 'Cuisine';
        if (viewType === 'salle') return emp.category === 'Salle';
        return true;
      });

  const filteredShifts = shifts.filter(shift => 
    filteredEmployees.some(emp => emp.id === shift.employeeId)
  );

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `${i18n.language === 'fr' ? 'Planning Hebdomadaire' : 'Weekly Schedule'} - ${restaurant.name}`,
  });

  if (!isOpen) return null;

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const blob = await pdf(
        <SchedulePDF
          restaurant={restaurant}
          employees={filteredEmployees}
          shifts={filteredShifts}
          weekStartDate={weekStartDateObj}
          viewType={viewType}
          payBreakTimes={settings?.payBreakTimes}
          language={i18n.language as 'en' | 'fr'}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const weekNumber = Math.ceil((new Date(weekStartDate).getTime() - new Date(new Date(weekStartDate).getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
      const year = new Date(weekStartDate).getFullYear();
      const restaurantSlug = restaurant.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const viewSuffix = viewType === 'cuisine' ? '-cuisine' : viewType === 'salle' ? '-salle' : '';
      
      link.download = `planning-${restaurantSlug}-semaine${weekNumber}-${year}${viewSuffix}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Close the modal after successful download
      onClose();
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {i18n.language === 'fr' ? 'Aperçu PDF - Planning Hebdomadaire' : 'PDF Preview - Weekly Schedule'} - {restaurant.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-auto max-h-[calc(90vh-140px)]">
          <div ref={printRef}>
            <SchedulePDF
              restaurant={restaurant}
              employees={filteredEmployees}
              shifts={filteredShifts}
              weekStartDate={weekStartDateObj}
              viewType={viewType}
              payBreakTimes={settings?.payBreakTimes}
              language={i18n.language as 'en' | 'fr'}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            {i18n.language === 'fr' ? 'Imprimer' : 'Print'}
          </button>

          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {i18n.language === 'fr' ? 'Télécharger' : 'Download'}
          </button>
        </div>
      </div>
    </div>
  );
};