import React, { useState } from 'react';
import { X, FileText, Users, ChefHat, Download, Eye, Printer } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import SchedulePDF from './SchedulePDF';
import { Employee, Shift, Restaurant } from '../../types';
import { useTranslation } from 'react-i18next';
import { getWeek } from 'date-fns';
import toast from 'react-hot-toast';

interface PDFExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant;
  employees: Employee[];
  shifts: Shift[];
  weekStartDate: Date;
  currentViewType: 'all' | 'cuisine' | 'salle';
}

type ExportViewType = 'all' | 'cuisine' | 'salle';

const PDFExportModal: React.FC<PDFExportModalProps> = ({
  isOpen,
  onClose,
  restaurant,
  employees,
  shifts,
  weekStartDate,
  currentViewType
}) => {
  const { t, i18n } = useTranslation();
  const [selectedView, setSelectedView] = useState<ExportViewType>(currentViewType);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // CRITICAL: Update selected view when current view changes
  React.useEffect(() => {
    setSelectedView(currentViewType);
  }, [currentViewType]);

  // CRITICAL: Clean up PDF URL when modal closes
  React.useEffect(() => {
    if (!isOpen && pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  }, [isOpen, pdfUrl]);

  // CRITICAL: Get filtered data based on selected view
  const getFilteredData = (viewType: ExportViewType) => {
    let filteredEmployees = employees;
    
    if (viewType === 'cuisine') {
      filteredEmployees = employees.filter(emp => emp.category === 'Cuisine');
    } else if (viewType === 'salle') {
      filteredEmployees = employees.filter(emp => emp.category === 'Salle');
    }
    
    const filteredEmployeeIds = filteredEmployees.map(emp => emp.id);
    const filteredShifts = shifts.filter(shift => 
      filteredEmployeeIds.includes(shift.employeeId)
    );

    return { filteredEmployees, filteredShifts };
  };

  // CRITICAL: Get view statistics
  const getViewStats = (viewType: ExportViewType) => {
    const { filteredEmployees, filteredShifts } = getFilteredData(viewType);
    return {
      employeeCount: filteredEmployees.length,
      shiftCount: filteredShifts.length
    };
  };

  // CRITICAL: Generate PDF with selected view
  const generatePDF = async (viewType: ExportViewType) => {
    setIsGenerating(true);
    
    try {
      const { filteredEmployees, filteredShifts } = getFilteredData(viewType);
      
      console.log('🎯 Generating PDF with view:', viewType, {
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

      // Clean up previous PDF URL
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }

      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      
      console.log('✅ PDF generated successfully');
    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      toast.error(i18n.language === 'fr' 
        ? 'Échec de la génération du PDF' 
        : 'Failed to generate PDF'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // CRITICAL: Handle view selection and immediate PDF generation
  const handleViewSelect = (viewType: ExportViewType) => {
    setSelectedView(viewType);
    generatePDF(viewType);
  };

  // CRITICAL: Handle download
  const handleDownload = () => {
    if (!pdfUrl) return;

    const link = document.createElement('a');
    link.href = pdfUrl;
    
    const weekNumber = getWeek(weekStartDate);
    const year = weekStartDate.getFullYear();
    
    let viewSuffix = '';
    if (selectedView !== 'all') {
      if (i18n.language === 'fr') {
        viewSuffix = selectedView === 'cuisine' ? '-cuisine' : '-salle';
      } else {
        viewSuffix = selectedView === 'cuisine' ? '-kitchen' : '-dining';
      }
    }
    
    const restaurantSlug = restaurant.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
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

  // CRITICAL: Handle print
  const handlePrint = () => {
    if (!pdfUrl) return;
    
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  // CRITICAL: Get view type labels
  const getViewTypeLabel = (viewType: ExportViewType): string => {
    switch (viewType) {
      case 'cuisine':
        return i18n.language === 'fr' ? 'Vue Cuisine' : 'Kitchen View';
      case 'salle':
        return i18n.language === 'fr' ? 'Vue Salle' : 'Dining Room View';
      default:
        return i18n.language === 'fr' ? 'Vue Globale' : 'Global View';
    }
  };

  // CRITICAL: View options with enhanced styling
  const viewOptions = [
    {
      value: 'all' as ExportViewType,
      label: i18n.language === 'fr' ? 'Vue Globale' : 'Global View',
      description: i18n.language === 'fr' ? 'Tous les employés (Cuisine + Salle)' : 'All employees (Kitchen + Dining)',
      icon: Users,
      color: 'blue'
    },
    {
      value: 'cuisine' as ExportViewType,
      label: i18n.language === 'fr' ? 'Vue Cuisine' : 'Kitchen View',
      description: i18n.language === 'fr' ? 'Employés de cuisine uniquement' : 'Kitchen staff only',
      icon: ChefHat,
      color: 'orange'
    },
    {
      value: 'salle' as ExportViewType,
      label: i18n.language === 'fr' ? 'Vue Salle' : 'Dining Room View',
      description: i18n.language === 'fr' ? 'Employés de salle uniquement' : 'Dining room staff only',
      icon: Users,
      color: 'purple'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
          {/* CRITICAL: Enhanced Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="text-blue-600" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {i18n.language === 'fr' ? 'Exporter le Planning PDF' : 'Export Schedule PDF'}
                </h2>
                <p className="text-sm text-gray-500">
                  {restaurant.name} - {i18n.language === 'fr' ? 'Semaine' : 'Week'} {getWeek(weekStartDate)}
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
              {/* CRITICAL: Left Panel - View Selection */}
              <div className="p-6 border-r border-gray-200">
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {i18n.language === 'fr' ? 'Choisir la vue à exporter' : 'Choose view to export'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {i18n.language === 'fr' 
                      ? 'Sélectionnez quels employés inclure dans le PDF'
                      : 'Select which employees to include in the PDF'
                    }
                  </p>
                </div>

                {/* CRITICAL: Enhanced View Selection Cards */}
                <div className="space-y-3">
                  {viewOptions.map((option) => {
                    const stats = getViewStats(option.value);
                    const isSelected = selectedView === option.value;
                    const IconComponent = option.icon;
                    
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleViewSelect(option.value)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                          isSelected 
                            ? `border-${option.color}-500 bg-${option.color}-50 shadow-lg` 
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isSelected 
                                ? `bg-${option.color}-100` 
                                : 'bg-gray-100'
                            }`}>
                              <IconComponent 
                                size={20} 
                                className={isSelected 
                                  ? `text-${option.color}-600` 
                                  : 'text-gray-600'
                                } 
                              />
                            </div>
                            <div className="flex-1">
                              <div className={`font-medium ${
                                isSelected ? `text-${option.color}-900` : 'text-gray-900'
                              }`}>
                                {option.label}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                {option.description}
                              </div>
                              <div className="text-xs text-gray-400 mt-2">
                                {stats.employeeCount} {i18n.language === 'fr' ? 'employé(s)' : 'employee(s)'} • {stats.shiftCount} {i18n.language === 'fr' ? 'service(s)' : 'shift(s)'}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <div className={`w-3 h-3 rounded-full bg-${option.color}-500 flex-shrink-0 mt-1`}></div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* CRITICAL: Current View Indicator */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    {i18n.language === 'fr' ? 'Vue actuelle du planning :' : 'Current schedule view:'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {getViewTypeLabel(currentViewType)}
                  </div>
                </div>
              </div>

              {/* CRITICAL: Right Panel - PDF Preview */}
              <div className="p-6 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {i18n.language === 'fr' ? 'Aperçu PDF' : 'PDF Preview'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {getViewTypeLabel(selectedView)} • {getViewStats(selectedView).employeeCount} {i18n.language === 'fr' ? 'employé(s)' : 'employee(s)'}
                  </p>
                </div>

                {/* CRITICAL: PDF Preview Area */}
                <div className="flex-1 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center min-h-[300px]">
                  {isGenerating ? (
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600 font-medium">
                        {i18n.language === 'fr' ? 'Génération du PDF...' : 'Generating PDF...'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {getViewTypeLabel(selectedView)}
                      </p>
                    </div>
                  ) : pdfUrl ? (
                    <div className="w-full h-full">
                      <iframe
                        src={pdfUrl}
                        className="w-full h-full rounded-lg"
                        title="PDF Preview"
                      />
                    </div>
                  ) : (
                    <div className="text-center">
                      <FileText size={48} className="text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {i18n.language === 'fr' 
                          ? 'Sélectionnez une vue pour générer l\'aperçu PDF'
                          : 'Select a view to generate PDF preview'
                        }
                      </p>
                    </div>
                  )}
                </div>

                {/* CRITICAL: Action Buttons */}
                {pdfUrl && !isGenerating && (
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handlePrint}
                      className="flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Printer size={16} className="mr-2" />
                      {i18n.language === 'fr' ? 'Imprimer' : 'Print'}
                    </button>
                    
                    <button
                      onClick={handleDownload}
                      className="flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download size={16} className="mr-2" />
                      {i18n.language === 'fr' ? 'Télécharger' : 'Download'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CRITICAL: Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <p className="text-xs text-gray-500 text-center">
              {i18n.language === 'fr' 
                ? 'PDF optimisé pour impression A4 paysage • Toutes les données sont filtrées selon la vue sélectionnée'
                : 'PDF optimized for A4 landscape printing • All data is filtered according to selected view'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFExportModal;