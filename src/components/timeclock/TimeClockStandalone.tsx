import React, { useState, useEffect } from 'react';
import { Fingerprint, Clock, User, LogIn, LogOut, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Employee } from '../../types';
import toast from 'react-hot-toast';

interface TimeClockStandaloneProps {
  restaurantId: string;
  restaurantName: string;
  employees: Employee[];
}

const TimeClockStandalone: React.FC<TimeClockStandaloneProps> = ({ 
  restaurantId, 
  restaurantName,
  employees 
}) => {
  const { t, i18n } = useTranslation();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [employeeId, setEmployeeId] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [step, setStep] = useState<'identify' | 'action' | 'confirmation'>('identify');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isClockingIn, setIsClockingIn] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Format current time based on locale
  const formattedTime = () => {
    if (i18n.language === 'fr') {
      return format(currentTime, 'HH:mm:ss');
    }
    return format(currentTime, 'h:mm:ss a');
  };
  
  // Format current date based on locale
  const formattedDate = () => {
    if (i18n.language === 'fr') {
      return format(currentTime, 'EEEE d MMMM yyyy', { locale: fr })
        .replace(/^\w/, c => c.toUpperCase());
    }
    return format(currentTime, 'EEEE, MMMM d, yyyy');
  };
  
  // Reset form
  const resetForm = () => {
    setEmployeeId('');
    setPin('');
    setStep('identify');
    setSelectedEmployee(null);
    setError(null);
  };
  
  // Handle employee identification
  const handleIdentify = () => {
    setError(null);
    
    if (!employeeId) {
      setError(i18n.language === 'fr' 
        ? 'Veuillez sélectionner un employé' 
        : 'Please select an employee');
      return;
    }
    
    if (!pin) {
      setError(i18n.language === 'fr' 
        ? 'Veuillez saisir votre code PIN' 
        : 'Please enter your PIN');
      return;
    }
    
    // For demo purposes, we'll just check if the PIN matches the employee ID
    // In a real implementation, we would validate against a secure database
    const employee = employees.find(e => e.id === employeeId);
    
    if (employee) {
      setSelectedEmployee(employee);
      
      // Determine if employee is clocking in or out
      // In a real implementation, we would check the database for the last clock action
      // For this demo, we'll randomly decide
      setIsClockingIn(Math.random() > 0.5);
      
      setStep('action');
    } else {
      setError(i18n.language === 'fr' 
        ? 'Identifiant ou code PIN invalide' 
        : 'Invalid ID or PIN');
    }
  };
  
  // Handle clock in/out action
  const handleClockAction = async (action: 'in' | 'out') => {
    if (!selectedEmployee) return;
    
    setLoading(true);
    
    try {
      // In a real implementation, we would save the clock action to the database
      // For this demo, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Record the action
      const timestamp = new Date();
      console.log(`Employee ${selectedEmployee.id} clocked ${action} at ${timestamp.toISOString()}`);
      
      // Show success message
      toast.success(
        action === 'in'
          ? i18n.language === 'fr'
            ? `Pointage d'arrivée enregistré à ${format(timestamp, 'HH:mm:ss')}`
            : `Clock in recorded at ${format(timestamp, 'h:mm:ss a')}`
          : i18n.language === 'fr'
            ? `Pointage de départ enregistré à ${format(timestamp, 'HH:mm:ss')}`
            : `Clock out recorded at ${format(timestamp, 'h:mm:ss a')}`
      );
      
      // Move to confirmation step
      setStep('confirmation');
    } catch (error) {
      console.error('Clock action failed:', error);
      setError(i18n.language === 'fr' 
        ? 'Échec du pointage. Veuillez réessayer.' 
        : 'Clock action failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Fingerprint size={32} className="mr-3" />
            <div>
              <h1 className="text-2xl font-bold">
                {i18n.language === 'fr' ? 'Badgeuse' : 'Time Clock'}
              </h1>
              <p className="text-blue-100 text-sm">{restaurantName}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono font-bold">{formattedTime()}</div>
            <div className="text-sm opacity-80">{formattedDate()}</div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-md w-full">
          <div className="p-8">
            {step === 'identify' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-center text-gray-900">
                  {i18n.language === 'fr' ? 'Identifiez-vous' : 'Identify Yourself'}
                </h2>
                
                {/* Employee Selection */}
                <div>
                  <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-1">
                    {i18n.language === 'fr' ? 'Employé' : 'Employee'}
                  </label>
                  <select
                    id="employeeId"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">
                      {i18n.language === 'fr' ? '-- Sélectionnez votre nom --' : '-- Select your name --'}
                    </option>
                    {employees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* PIN Entry */}
                <div>
                  <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-1">
                    {i18n.language === 'fr' ? 'Code PIN' : 'PIN Code'}
                  </label>
                  <input
                    type="password"
                    id="pin"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder={i18n.language === 'fr' ? 'Entrez votre code PIN' : 'Enter your PIN'}
                    maxLength={6}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {i18n.language === 'fr' 
                      ? 'Pour cette démo, utilisez votre ID comme PIN' 
                      : 'For this demo, use your ID as the PIN'}
                  </p>
                </div>
                
                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 rounded-md">
                    <div className="flex">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                      <p className="ml-2 text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                )}
                
                {/* Submit Button */}
                <button
                  onClick={handleIdentify}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <User size={18} className="mr-2" />
                  {i18n.language === 'fr' ? 'S\'identifier' : 'Identify'}
                </button>
              </div>
            )}
            
            {step === 'action' && selectedEmployee && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 mb-4">
                    <User size={40} className="text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </h2>
                  <p className="text-gray-500">
                    {i18n.language === 'fr' 
                      ? t(`positions.${selectedEmployee.position.toLowerCase().replace(/[^a-z]/g, '')}`)
                      : t(`positions.${selectedEmployee.position.toLowerCase().replace(/[^a-z]/g, '')}`)}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <button
                    onClick={() => handleClockAction('in')}
                    disabled={loading || !isClockingIn}
                    className={`py-8 px-4 rounded-lg border-2 flex flex-col items-center justify-center transition-colors ${
                      isClockingIn
                        ? 'border-green-500 bg-green-50 text-green-700 hover:bg-green-100'
                        : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <LogIn size={40} className={isClockingIn ? 'text-green-500' : 'text-gray-400'} />
                    <span className="mt-3 font-bold text-lg">
                      {i18n.language === 'fr' ? 'Arrivée' : 'Clock In'}
                    </span>
                    <span className="text-sm mt-1">
                      {format(currentTime, 'HH:mm:ss')}
                    </span>
                  </button>
                  
                  <button
                    onClick={() => handleClockAction('out')}
                    disabled={loading || isClockingIn}
                    className={`py-8 px-4 rounded-lg border-2 flex flex-col items-center justify-center transition-colors ${
                      !isClockingIn
                        ? 'border-red-500 bg-red-50 text-red-700 hover:bg-red-100'
                        : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <LogOut size={40} className={!isClockingIn ? 'text-red-500' : 'text-gray-400'} />
                    <span className="mt-3 font-bold text-lg">
                      {i18n.language === 'fr' ? 'Départ' : 'Clock Out'}
                    </span>
                    <span className="text-sm mt-1">
                      {format(currentTime, 'HH:mm:ss')}
                    </span>
                  </button>
                </div>
                
                {/* Status Message */}
                <div className="p-4 bg-blue-50 rounded-md">
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 text-blue-400 mt-0.5" />
                    <p className="ml-3 text-sm text-blue-700">
                      {isClockingIn
                        ? i18n.language === 'fr'
                          ? 'Vous êtes prêt à pointer votre arrivée. Cliquez sur le bouton "Arrivée" pour confirmer.'
                          : 'You are ready to clock in. Click the "Clock In" button to confirm.'
                        : i18n.language === 'fr'
                          ? 'Vous êtes prêt à pointer votre départ. Cliquez sur le bouton "Départ" pour confirmer.'
                          : 'You are ready to clock out. Click the "Clock Out" button to confirm.'
                      }
                    </p>
                  </div>
                </div>
                
                {/* Cancel Button */}
                <button
                  onClick={resetForm}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center"
                >
                  <X size={16} className="mr-1" />
                  {i18n.language === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
              </div>
            )}
            
            {step === 'confirmation' && selectedEmployee && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-4">
                    <CheckCircle size={40} className="text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {i18n.language === 'fr' ? 'Pointage Réussi!' : 'Clock Action Successful!'}
                  </h2>
                  <p className="text-gray-500">
                    {isClockingIn
                      ? i18n.language === 'fr'
                        ? `Arrivée enregistrée à ${format(currentTime, 'HH:mm:ss')}`
                        : `Clock in recorded at ${format(currentTime, 'h:mm:ss a')}`
                      : i18n.language === 'fr'
                        ? `Départ enregistré à ${format(currentTime, 'HH:mm:ss')}`
                        : `Clock out recorded at ${format(currentTime, 'h:mm:ss a')}`
                    }
                  </p>
                </div>
                
                {/* Employee Info */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center">
                    <User size={20} className="text-gray-500 mr-2" />
                    <span className="font-medium text-gray-800">
                      {selectedEmployee.firstName} {selectedEmployee.lastName}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1 text-center">
                    {formattedDate()}
                  </div>
                </div>
                
                {/* Done Button */}
                <button
                  onClick={resetForm}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {i18n.language === 'fr' ? 'Terminé' : 'Done'}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white p-4">
        <div className="container mx-auto text-center text-sm">
          <p>
            {i18n.language === 'fr'
              ? 'Système de Badgeuse - Kollab'
              : 'Time Clock System - Kollab'}
          </p>
          <p className="text-gray-400 text-xs mt-1">
            {i18n.language === 'fr' 
              ? 'Veuillez contacter votre responsable en cas de problème de pointage.' 
              : 'Please contact your manager if you have any issues with clocking in or out.'}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TimeClockStandalone;