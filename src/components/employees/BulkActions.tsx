import React from 'react';
import { FileText } from 'lucide-react';
import { Employee } from '../../types';
import { useTranslation } from 'react-i18next';

interface BulkActionsProps {
  employees: Employee[];
}

const BulkActions: React.FC<BulkActionsProps> = ({ employees }) => {
  const { t } = useTranslation();

  // CRITICAL: BulkActions component is now simplified - only shows employee count
  // Export functionality has been moved to the main EmployeeList component
  // This maintains the component structure while removing the XLS export

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center text-sm text-gray-600">
        <FileText size={16} className="mr-1" />
        <span>{employees.length} employé(s) affiché(s)</span>
      </div>
    </div>
  );
};

export default BulkActions;