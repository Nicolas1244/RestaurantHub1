import React, { useState, useEffect } from 'react';
import { X, Download, Printer, Eye, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import SchedulePDF from './SchedulePDF';
import { Employee, Shift, Restaurant } from '../../types';
import { useTranslation } from 'react-i18next';
import { getWeek } from 'date-fns';
import toast from 'react-hot-toast';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant;
  employees: Employee[];
  shifts: Shift[];
  weekStartDate: Date;
  viewType: 'all' | 'cuisine' | 'salle';
}

const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  isOpen,
  onClose,
  restaurant,
  employees,
  shifts,
  weekStartDate,
  viewType
}) => {
  const { t, i18n } = useTranslation();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // CRITICAL: Filter data based on selected view type
  const getFilteredData = () => {
    console.log('🎯 PDFPreviewModal - Filtering data for view:', viewType);
    
    let filteredEmployees = employees;
    
    // Apply view-based filtering
    if (viewType === 'cuisine') {
      filteredEmployees = employees.filter(emp => emp.category === 'Cuisine');
    } else if (viewType === 'salle') {
      filteredEmployees = employees.filter(emp => emp.category === 'Salle');
    }
    
    // Filter shifts to match selected employees
    const filteredEmployeeIds = filteredEmployees.map(emp => emp.id);
    const filteredShifts = shifts.filter(shift => 
      filteredEmployeeIds.includes(shift.employeeId)
    );

    console.log('🎯 PDFPreviewModal - Filtered data:', {
      viewType,
      originalEmployees: employees.length,
      filteredEmployees: filteredEmployees.length,
      originalShifts: shifts.length,
      filteredShifts: filteredShifts.length,
      employeeIds: filteredEmployeeIds
    });

    return { filteredEmployees, filteredShifts };
  };

  // Generate PDF when modal opens or view changes
  useEffect(() => {
    if (isOpen) {
      // Clear previous PDF and regenerate when modal opens or view changes
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
      generatePDF();
    }
  }, [isOpen, viewType]);

  // Clean up URL when component unmounts or modal closes
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // Reset zoom and page when modal opens
  useEffect(() => {
    if (isOpen) {
      setZoomLevel(1);
      setCurrentPage(1);
    }
  }, [isOpen]);

  const generatePDF = async () => {
    setLoading(true);
    try {
      const { filteredEmployees, filteredShifts } = getFilteredData();
      
      console.log('🎯 Generating PDF with:', {
        viewType,
        employees: filteredEmployees.length,
        shifts: filteredShifts.length
      });

      const blob = await pdf(
        <SchedulePDF
          restaurant={restaurant}
          employees={filteredEmployees}
          shifts={filteredShifts}
          weekStartDate={weekStartDate}
          viewType={viewType}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      
      // Estimate total pages (this is approximate since we can't directly access PDF metadata)
      const estimatedPages = Math.ceil(filteredEmployees.length / 20) || 1;
      setTotalPages(estimatedPages);
      
      console.log('✅ PDF generated successfully');
    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      toast.error(i18n.language === 'fr' 
        ? 'Échec de la génération du PDF' 
        : 'Failed to generate PDF'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;

    const link = document.createElement('a');
    link.href = pdfUrl;
    
    // CRITICAL: Enhanced filename generation with French localization
    const weekNumber = getWeek(weekStartDate);
    const year = weekStartDate.getFullYear();
    
    // View type suffix with French localization
    let viewSuffix = '';
    if (viewType !== 'all') {
      if (i18n.language === 'fr') {
        viewSuffix = viewType === 'cuisine' ? '-cuisine' : '-salle';
      } else {
        viewSuffix = viewType === 'cuisine' ? '-kitchen' : '-dining';
      }
    }
    
    // Restaurant name sanitization
    const restaurantSlug = restaurant.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    // CRITICAL: French filename format
    const filename = i18n.language === 'fr'
      ? `planning-${restaurantSlug}-semaine${weekNumber}-${year}${viewSuffix}.pdf`
      : `schedule-${restaurantSlug}-week${weekNumber}-${year}${viewSuffix}.pdf`;
    
    link.download = filename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(i18n.language === 'fr' 
      ? 'PDF téléchargé avec succès' 
      : 'PDF downloaded successfully'
    );
  };

  const handlePrint = () => {
    if (!pdfUrl) return;
    
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  // CRITICAL: Zoom in function
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 2.5));
  };

  // CRITICAL: Zoom out function
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  // CRITICAL: Next page function
  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  // CRITICAL: Previous page function
  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  // CRITICAL: Get view type label with French localization
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

  // Get employee count for current view
  const getEmployeeCount = (): number => {
    const { filteredEmployees } = getFilteredData();
    return filteredEmployees.length;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-lg shadow-xl flex flex-col">
          {/* Header with French localization */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <Eye className="text-purple-600" size={24} />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {i18n.language === 'fr' ? 'Aperçu du Planning PDF' : 'Schedule PDF Preview'}
                </h2>
                <p className="text-sm text-gray-500">
                  {restaurant.name} - {i18n.language === 'fr' ? 'Semaine' : 'Week'} {getWeek(weekStartDate)} - {getViewTypeLabel()}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {getEmployeeCount()} {i18n.language === 'fr' ? 'employé(s)' : 'employee(s)'} • {getViewTypeLabel()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* CRITICAL: Zoom controls */}
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden mr-2">
                <button
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 0.5}
                  className="p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                  title={i18n.language === 'fr' ? 'Zoom arrière' : 'Zoom out'}
                >
                  <ZoomOut size={16} />
                </button>
                <div className="px-2 text-sm text-gray-700 border-l border-r border-gray-300">
                  {Math.round(zoomLevel * 100)}%
                </div>
                <button
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 2.5}
                  className="p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                  title={i18n.language === 'fr' ? 'Zoom avant' : 'Zoom in'}
                >
                  <ZoomIn size={16} />
                </button>
              </div>
              
              {/* CRITICAL: Page navigation */}
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden mr-4">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1}
                  className="p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                  title={i18n.language === 'fr' ? 'Page précédente' : 'Previous page'}
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="px-2 text-sm text-gray-700 border-l border-r border-gray-300">
                  {currentPage} / {totalPages}
                </div>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                  className="p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                  title={i18n.language === 'fr' ? 'Page suivante' : 'Next page'}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              
              <button
                onClick={handlePrint}
                disabled={!pdfUrl || loading}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                title={i18n.language === 'fr' ? 'Imprimer' : 'Print'}
              >
                <Printer size={16} className="mr-2" />
                {i18n.language === 'fr' ? 'Imprimer' : 'Print'}
              </button>
              
              <button
                onClick={handleDownload}
                disabled={!pdfUrl || loading}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                <Download size={16} className="mr-2" />
                {i18n.language === 'fr' ? 'Télécharger' : 'Download'}
              </button>
              
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* PDF Preview */}
          <div className="flex-1 p-6 bg-gray-100 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">
                    {i18n.language === 'fr' ? 'Génération du PDF en cours...' : 'Generating PDF...'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {getViewTypeLabel()} • {getEmployeeCount()} {i18n.language === 'fr' ? 'employé(s)' : 'employee(s)'}
                  </p>
                </div>
              </div>
            ) : pdfUrl ? (
              <div className="flex justify-center h-full">
                <iframe
                  src={pdfUrl}
                  className="border border-gray-300 rounded-lg shadow-inner bg-white"
                  title="PDF Preview"
                  style={{ 
                    width: `${100 * zoomLevel}%`, 
                    height: '100%',
                    maxWidth: '100%',
                    transformOrigin: 'top center'
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    {i18n.language === 'fr' 
                      ? 'Impossible de charger l\'aperçu PDF' 
                      : 'Unable to load PDF preview'
                    }
                  </p>
                  <button
                    onClick={generatePDF}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    {i18n.language === 'fr' ? 'Réessayer' : 'Retry'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer with additional info */}
          <div className="px-6 py-3 border-t bg-gray-50 rounded-b-lg">
            <p className="text-xs text-gray-500 text-center">
              {i18n.language === 'fr' 
                ? `PDF optimisé pour impression A4 paysage • ${getViewTypeLabel()} • ${getEmployeeCount()} employé(s)`
                : `PDF optimized for A4 landscape printing • ${getViewTypeLabel()} • ${getEmployeeCount()} employee(s)`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFPreviewModal;