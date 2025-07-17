import React, { useState, useRef } from 'react';
import { X, Printer, Download, Archive, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Restaurant, Employee, Shift } from '../../types';
import { SchedulePDF } from './SchedulePDF';
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
  const { t } = useTranslation();
  const { settings } = useAppContext();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const filteredEmployees = viewType === 'all' 
    ? employees 
    : employees.filter(emp => {
        if (viewType === 'cuisine') return emp.category === 'cuisine';
        if (viewType === 'salle') return emp.category === 'salle';
        return true;
      });

  const filteredShifts = shifts.filter(shift => 
    filteredEmployees.some(emp => emp.id === shift.employeeId)
  );

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `${t('pdf.scheduleTitle')} - ${restaurant.name}`,
  });

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const blob = await pdf(
        <SchedulePDF
          restaurant={restaurant}
          employees={filteredEmployees}
          shifts={filteredShifts}
          weekStartDate={weekStartDate}
          viewType={viewType}
          payBreakTimes={settings.payBreakTimes}
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
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      console.log('Preparing PDF for archiving...');
      
      const blob = await pdf(
        <SchedulePDF
          restaurant={restaurant}
          employees={filteredEmployees}
          shifts={filteredShifts}
          weekStartDate={weekStartDate}
          viewType={viewType}
          payBreakTimes={settings.payBreakTimes}
        />
      ).toBlob();

      const weekNumber = Math.ceil((new Date(weekStartDate).getTime() - new Date(new Date(weekStartDate).getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
      const year = new Date(weekStartDate).getFullYear();
      const restaurantSlug = restaurant.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const viewSuffix = viewType === 'cuisine' ? '-cuisine' : viewType === 'salle' ? '-salle' : '';
      
      const filename = `planning-${restaurantSlug}-semaine${weekNumber}-${year}${viewSuffix}.pdf`;
      
      console.log('PDF prepared for archiving:', {
        filename,
        size: blob.size,
        type: blob.type,
        employees: filteredEmployees.length,
        shifts: filteredShifts.length
      });

      // TODO: Implement actual archiving to Documents section
      // This should store the PDF blob with metadata in the documents system
      
      // For now, show success message
      console.log('Archive preparation completed successfully');
      
    } catch (error) {
      console.error('Error preparing PDF for archive:', error);
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{t('pdf.scheduleTitle')} - {restaurant.name}</h2>
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
              weekStartDate={weekStartDate}
              viewType={viewType}
              payBreakTimes={settings.payBreakTimes}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            {t('common.print', 'Imprimer')}
          </button>

          <button
            onClick={handleArchive}
            disabled={isArchiving}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            title={t('documents.archiveToDocuments', 'Archiver dans Documents')}
          >
            {isArchiving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Archive className="w-4 h-4" />
            )}
            {t('schedule.archive', 'Archiver')}
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
            {t('common.download', 'Télécharger')}
          </button>
        </div>
      </div>
    </div>
  );
};