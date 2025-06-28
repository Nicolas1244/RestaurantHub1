import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Copy, FileText, Users, ChefHat } from 'lucide-react';
import { format, getWeek, setWeek, addWeeks, startOfWeek } from 'date-fns';
import { useTranslation } from 'react-i18next';
import PDFExportModal from './PDFExportModal';
import PDFPreviewModal from './PDFPreviewModal';
import { Employee, Shift, Restaurant } from '../../types';

interface ScheduleHeaderProps {
  weekStartDate: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onDuplicateWeek: () => void;
  onWeekSelect: (date: Date) => void;
  restaurant: Restaurant;
  employees: Employee[];
  shifts: Shift[];
  viewType: 'all' | 'cuisine' | 'salle';
}

type ExportViewType = 'all' | 'cuisine' | 'salle';

const ScheduleHeader: React.FC<ScheduleHeaderProps> = ({
  weekStartDate,
  onPrevWeek,
  onNextWeek,
  onToday,
  onDuplicateWeek,
  onWeekSelect,
  restaurant,
  employees,
  shifts,
  viewType
}) => {
  const { t, i18n } = useTranslation();
  const [showWeekPicker, setShowWeekPicker] = useState(false);
  const [showPDFExportModal, setShowPDFExportModal] = useState(false);
  const [showPDFPreviewModal, setShowPDFPreviewModal] = useState(false);
  const [selectedExportView, setSelectedExportView] = useState<ExportViewType>(viewType);
  const currentWeek = getWeek(weekStartDate);
  const currentYear = weekStartDate.getFullYear();

  // CRITICAL: Update selected export view when current view changes
  React.useEffect(() => {
    setSelectedExportView(viewType);
  }, [viewType]);

  const handleWeekSelect = (weekNumber: number) => {
    const newDate = startOfWeek(setWeek(new Date(currentYear, 0), weekNumber), { weekStartsOn: 1 });
    onWeekSelect(newDate);
    setShowWeekPicker(false);
  };

  // CRITICAL: Open PDF preview modal
  const handleOpenPDFPreview = () => {
    setShowPDFPreviewModal(true);
  };

  // Generate array of week numbers for the current year
  const weeks = Array.from({ length: 53 }, (_, i) => i + 1);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <button
            onClick={onToday}
            className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {t('buttons.today')}
          </button>

          <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={onPrevWeek}
              className="p-2 bg-white hover:bg-gray-50 focus:outline-none"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowWeekPicker(!showWeekPicker)}
                className="px-3 py-2 bg-white border-l border-r border-gray-300 flex items-center gap-2 hover:bg-gray-50"
              >
                <CalendarIcon size={18} className="text-blue-600" />
                <span className="text-sm font-medium">
                  {t('common.week')} {currentWeek}, {currentYear}
                </span>
                <ChevronRight size={18} className="rotate-90" />
              </button>

              {showWeekPicker && (
                <div className="absolute top-full left-0 mt-1 w-64 max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <div className="grid grid-cols-4 gap-1 p-2">
                    {weeks.map(week => (
                      <button
                        key={week}
                        onClick={() => handleWeekSelect(week)}
                        className={`p-2 text-sm rounded ${
                          week === currentWeek
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {week}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onNextWeek}
              className="p-2 bg-white hover:bg-gray-50 focus:outline-none"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onDuplicateWeek}
            className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
          >
            <Copy size={18} />
            {t('buttons.duplicateWeek')}
          </button>

          {/* CRITICAL: Enhanced Export Button - Opens preview modal with consistent purple color */}
          <button
            onClick={handleOpenPDFPreview}
            className="px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center gap-2 transition-colors"
          >
            <FileText size={18} />
            {t('common.exportPDF')}
          </button>
        </div>
      </div>

      {/* CRITICAL: PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={showPDFPreviewModal}
        onClose={() => setShowPDFPreviewModal(false)}
        restaurant={restaurant}
        employees={employees}
        shifts={shifts}
        weekStartDate={weekStartDate}
        viewType={viewType}
      />

      {/* Keep the export modal for backward compatibility */}
      <PDFExportModal
        isOpen={showPDFExportModal}
        onClose={() => setShowPDFExportModal(false)}
        restaurant={restaurant}
        employees={employees}
        shifts={shifts}
        weekStartDate={weekStartDate}
        currentViewType={viewType}
      />
    </>
  );
};

export default ScheduleHeader;