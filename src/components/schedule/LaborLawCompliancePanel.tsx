import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, Calendar, Users, Shield, ChevronDown, ChevronUp, Info, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../contexts/AppContext';
import { 
  FrenchLaborLawValidator, 
  LaborLawViolation, 
  RestPeriodAnalysis,
  formatViolationMessage,
  getViolationIcon,
  getViolationColor,
  ViolationSeverity
} from '../../lib/laborLawValidation';
import { toastNotificationService } from '../notifications/ToastNotificationService';
import { Employee, Shift } from '../../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface LaborLawCompliancePanelProps {
  employees: Employee[];
  shifts: Shift[];
  weekStartDate: Date;
  isVisible: boolean;
  onToggle: () => void;
}

const LaborLawCompliancePanel: React.FC<LaborLawCompliancePanelProps> = ({
  employees,
  shifts,
  weekStartDate,
  isVisible,
  onToggle
}) => {
  const { t, i18n } = useTranslation();
  const [validator, setValidator] = useState<FrenchLaborLawValidator | null>(null);
  const [analysisResults, setAnalysisResults] = useState<RestPeriodAnalysis[]>([]);
  const [violations, setViolations] = useState<LaborLawViolation[]>([]);
  const [isCompliant, setIsCompliant] = useState(true);
  const [selectedViolation, setSelectedViolation] = useState<LaborLawViolation | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<ViolationSeverity | 'all'>('all');

  // CRITICAL: Run validation and show toast notifications when data changes
  useEffect(() => {
    if (employees.length > 0) {
      console.log('🔍 Running French Labor Law validation...');
      
      const newValidator = new FrenchLaborLawValidator(employees, shifts, weekStartDate);
      const results = newValidator.validateWeeklySchedule();
      const allViolations = newValidator.getAllViolations();
      const compliant = newValidator.isScheduleCompliant();

      setValidator(newValidator);
      setAnalysisResults(results);
      setViolations(allViolations);
      setIsCompliant(compliant);

      // CRITICAL: Show toast notifications for critical violations only
      const criticalViolations = allViolations.filter(v => v.severity === 'critical');
      criticalViolations.forEach(violation => {
        toastNotificationService.showLaborLawViolation(
          violation.employeeName,
          violation.type,
          violation.message,
          violation.severity
        );
      });

      console.log('⚖️ Validation complete:', {
        employees: employees.length,
        violations: allViolations.length,
        criticalViolations: criticalViolations.length,
        compliant
      });
    }
  }, [employees, shifts, weekStartDate]);

  // CRITICAL: Filter violations by severity
  const filteredViolations = violations.filter(violation => 
    filterSeverity === 'all' || violation.severity === filterSeverity
  );

  // CRITICAL: Get violation counts by severity
  const violationCounts = {
    critical: violations.filter(v => v.severity === 'critical').length,
    warning: violations.filter(v => v.severity === 'warning').length,
    info: violations.filter(v => v.severity === 'info').length,
    total: violations.length
  };

  // CRITICAL: Get compliance status display
  const getComplianceStatus = () => {
    if (violationCounts.critical > 0) {
      return {
        icon: <AlertTriangle className="text-red-600" size={20} />,
        text: 'Non-conforme',
        color: 'text-red-600',
        bgColor: 'bg-red-50 border-red-200'
      };
    } else if (violationCounts.warning > 0) {
      return {
        icon: <AlertTriangle className="text-orange-600" size={20} />,
        text: 'Attention requise',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 border-orange-200'
      };
    } else {
      return {
        icon: <CheckCircle className="text-green-600" size={20} />,
        text: 'Conforme',
        color: 'text-green-600',
        bgColor: 'bg-green-50 border-green-200'
      };
    }
  };

  const complianceStatus = getComplianceStatus();

  // CRITICAL: Format week range for display
  const formatWeekRange = (): string => {
    const endDate = new Date(weekStartDate);
    endDate.setDate(endDate.getDate() + 6);
    
    const startFormatted = format(weekStartDate, 'd MMMM', { locale: fr });
    const endFormatted = format(endDate, 'd MMMM yyyy', { locale: fr });
    
    return `${startFormatted} - ${endFormatted}`.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* CRITICAL: Compliance Header - Always Visible */}
      <div 
        className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${complianceStatus.bgColor}`}
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm">
              <Shield className="text-blue-600" size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {complianceStatus.icon}
                <h3 className={`font-semibold ${complianceStatus.color}`}>
                  Conformité Code du Travail
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                {formatWeekRange()} • {employees.length} employé(s) analysé(s)
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* CRITICAL: Violation Summary Badges */}
            {violationCounts.critical > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                {violationCounts.critical} critique(s)
              </div>
            )}
            {violationCounts.warning > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                {violationCounts.warning} attention
              </div>
            )}
            {violationCounts.total === 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                <CheckCircle size={12} />
                Conforme
              </div>
            )}
            
            {isVisible ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </div>

      {/* CRITICAL: Detailed Compliance Panel - Expandable */}
      {isVisible && (
        <div className="p-4 space-y-4">
          {/* CRITICAL: Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900">{employees.length}</div>
              <div className="text-sm text-gray-600">Employés</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900">{shifts.length}</div>
              <div className="text-sm text-gray-600">Services</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className={`text-lg font-semibold ${violationCounts.total > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {violationCounts.total}
              </div>
              <div className="text-sm text-gray-600">Violations</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className={`text-lg font-semibold ${isCompliant ? 'text-green-600' : 'text-red-600'}`}>
                {isCompliant ? '✓' : '✗'}
              </div>
              <div className="text-sm text-gray-600">Conformité</div>
            </div>
          </div>

          {/* CRITICAL: Violations List */}
          {violations.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Violations détectées</h4>
                
                {/* CRITICAL: Severity Filter */}
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value as ViolationSeverity | 'all')}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="all">Toutes ({violations.length})</option>
                  <option value="critical">Critiques ({violationCounts.critical})</option>
                  <option value="warning">Attention ({violationCounts.warning})</option>
                  <option value="info">Info ({violationCounts.info})</option>
                </select>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredViolations.map((violation) => (
                  <div
                    key={violation.id}
                    className={`p-3 border rounded-lg cursor-pointer hover:shadow-sm transition-all ${getViolationColor(violation.severity)}`}
                    onClick={() => setSelectedViolation(violation)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">{getViolationIcon(violation.severity)}</span>
                          <span className="font-medium text-sm">{violation.employeeName}</span>
                          {violation.day !== undefined && (
                            <span className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
                              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][violation.day]}
                            </span>
                          )}
                        </div>
                        <p className="text-sm">{violation.message}</p>
                        <p className="text-xs mt-1 opacity-75">{violation.suggestion}</p>
                      </div>
                      <Info size={16} className="text-gray-400 flex-shrink-0 ml-2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CRITICAL: No Violations - Compliance Confirmation */}
          {violations.length === 0 && (
            <div className="text-center py-6">
              <CheckCircle className="text-green-600 mx-auto mb-3" size={48} />
              <h4 className="font-medium text-green-900 mb-2">Planning conforme</h4>
              <p className="text-sm text-green-700">
                Aucune violation du Code du travail détectée pour cette semaine.
                Tous les employés respectent les temps de repos et limites horaires.
              </p>
            </div>
          )}

          {/* CRITICAL: Legal References */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">Références légales</h5>
            <div className="text-sm text-blue-800 space-y-1">
              <div>• Repos quotidien : 11h minimum (Art. L3131-1)</div>
              <div>• Repos hebdomadaire : 35h consécutives (Art. L3132-2)</div>
              <div>• Durée quotidienne : 10h maximum (Art. L3121-18)</div>
              <div>• Durée hebdomadaire : 48h maximum (Art. L3121-20)</div>
              <div>• Jours consécutifs : 6 maximum (Art. L3132-1)</div>
              <div>• Convention collective CHR applicable</div>
            </div>
          </div>
        </div>
      )}

      {/* CRITICAL: Violation Detail Modal */}
      {selectedViolation && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setSelectedViolation(null)} />
            
            <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">Détail de la violation</h3>
                <button
                  onClick={() => setSelectedViolation(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                <div className={`p-3 rounded-lg ${getViolationColor(selectedViolation.severity)}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span>{getViolationIcon(selectedViolation.severity)}</span>
                    <span className="font-medium">{selectedViolation.employeeName}</span>
                  </div>
                  <p className="text-sm">{selectedViolation.message}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">💡 Suggestion de correction</h4>
                  <p className="text-sm text-gray-700">{selectedViolation.suggestion}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">📖 Référence légale</h4>
                  <p className="text-sm text-gray-700">{selectedViolation.legalReference}</p>
                </div>
                
                {selectedViolation.day !== undefined && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">📅 Jour concerné</h4>
                    <p className="text-sm text-gray-700">
                      {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'][selectedViolation.day]}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t bg-gray-50">
                <button
                  onClick={() => setSelectedViolation(null)}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Compris
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LaborLawCompliancePanel;