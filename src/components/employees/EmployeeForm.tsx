import React, { useState, useEffect } from 'react';
import { X, Mail, Calendar, MapPin, Globe, User, DollarSign, Briefcase, Clock, Heart, Calendar as CalendarIcon, Repeat } from 'lucide-react';
import { Employee, POSITIONS, EMPLOYEE_CATEGORIES, EmployeeCategory, EMPLOYEE_STATUS, EmployeeStatus, formatFrenchPhoneNumber, formatSocialSecurityNumber } from '../../types';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

interface EmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee;
  onSave: (employee: Omit<Employee, 'id'>) => Promise<void>;
  onUpdate: (employee: Employee) => Promise<void>;
  restaurantId: string;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({
  isOpen,
  onClose,
  employee,
  onSave,
  onUpdate,
  restaurantId
}) => {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [socialSecurityNumber, setSocialSecurityNumber] = useState('');
  const [contractType, setContractType] = useState<'CDI' | 'CDD' | 'Extra'>('CDI');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [position, setPosition] = useState(POSITIONS[0]);
  const [customPosition, setCustomPosition] = useState('');
  const [isCustomPosition, setIsCustomPosition] = useState(false);
  const [category, setCategory] = useState<EmployeeCategory>('Salle');
  const [weeklyHours, setWeeklyHours] = useState(35);
  const [notificationDays, setNotificationDays] = useState(3);
  
  // CRITICAL: New fields for comprehensive employee directory
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [countryOfBirth, setCountryOfBirth] = useState('France');
  const [employeeStatus, setEmployeeStatus] = useState<EmployeeStatus>('Employe');
  const [hiringDate, setHiringDate] = useState('');
  const [hourlyRate, setHourlyRate] = useState<number>(12);
  const [grossMonthlySalary, setGrossMonthlySalary] = useState<number>(0);
  
  const [loading, setLoading] = useState(false);
  const [showCategoryPrompt, setShowCategoryPrompt] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  // CRITICAL: Position to category mapping
  const positionCategoryMap: Record<string, EmployeeCategory> = {
    'Operations Manager': 'Salle',
    'Barman/Barmaid': 'Salle',
    'Waiter(s)': 'Salle',
    // All other positions default to 'Cuisine'
  };

  useEffect(() => {
    if (employee) {
      setFirstName(employee.firstName);
      setLastName(employee.lastName);
      setStreetAddress(employee.streetAddress);
      setCity(employee.city);
      setPostalCode(employee.postalCode);
      setPhone(employee.phone);
      setEmail(employee.email || '');
      setSocialSecurityNumber(employee.socialSecurityNumber || '');
      setContractType(employee.contractType);
      setStartDate(employee.startDate);
      setEndDate(employee.endDate || '');
      
      // Check if position is in predefined list
      if (POSITIONS.includes(employee.position)) {
        setPosition(employee.position);
        setIsCustomPosition(false);
        setCustomPosition('');
      } else {
        // Handle custom position
        setIsCustomPosition(true);
        setCustomPosition(employee.position);
        setPosition('');
      }
      
      setCategory(employee.category);
      setWeeklyHours(employee.weeklyHours || 35);
      setNotificationDays(employee.notificationDays || 3);
      
      // CRITICAL: Set new fields from employee data
      setDateOfBirth(employee.dateOfBirth || '');
      setPlaceOfBirth(employee.placeOfBirth || '');
      setCountryOfBirth(employee.countryOfBirth || 'France');
      setEmployeeStatus(employee.employeeStatus || 'Employe');
      setHiringDate(employee.hiringDate || employee.startDate); // Default to startDate if hiringDate not set
      setHourlyRate(employee.hourlyRate || 12);
      setGrossMonthlySalary(employee.grossMonthlySalary || 0);
    } else {
      // Reset form for new employee
      setFirstName('');
      setLastName('');
      setStreetAddress('');
      setCity('');
      setPostalCode('');
      setPhone('');
      setEmail('');
      setSocialSecurityNumber('');
      setContractType('CDI');
      setStartDate('');
      setEndDate('');
      setPosition(POSITIONS[0]);
      setCustomPosition('');
      setIsCustomPosition(false);
      setCategory('Salle');
      setWeeklyHours(35);
      setNotificationDays(3);
      
      // CRITICAL: Reset new fields for new employee
      setDateOfBirth('');
      setPlaceOfBirth('');
      setCountryOfBirth('France');
      setEmployeeStatus('Employe');
      setHiringDate('');
      setHourlyRate(12);
      setGrossMonthlySalary(0);
    }
  }, [employee, isOpen]);

  // CRITICAL: Update notification days when contract type changes
  useEffect(() => {
    // Set default notification days based on contract type
    if (contractType === 'CDD' || contractType === 'Extra') {
      // Only set default if it's currently empty or if switching from CDI
      if (notificationDays === 30 || !employee) {
        setNotificationDays(3);
      }
    }
  }, [contractType, employee]);

  // CRITICAL: Auto-assign category based on selected position
  useEffect(() => {
    if (!isCustomPosition && position) {
      const mappedCategory = positionCategoryMap[position] || 'Cuisine';
      setCategory(mappedCategory);
    }
  }, [position, isCustomPosition]);
  
  // CRITICAL: Calculate gross monthly salary based on hourly rate and weekly hours
  useEffect(() => {
    if (hourlyRate && weeklyHours) {
      // French standard: weekly hours * 4.33 (average weeks per month) * hourly rate
      const calculatedSalary = weeklyHours * 4.33 * hourlyRate;
      setGrossMonthlySalary(Math.round(calculatedSalary * 100) / 100);
    }
  }, [hourlyRate, weeklyHours]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatFrenchPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handleSocialSecurityNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatSocialSecurityNumber(e.target.value);
    setSocialSecurityNumber(formatted);
  };

  // CRITICAL: Handle position selection change
  const handlePositionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    
    if (selectedValue === 'custom') {
      setIsCustomPosition(true);
      setPosition('');
      setShowCategoryPrompt(true);
    } else {
      setIsCustomPosition(false);
      setPosition(selectedValue);
      setCustomPosition('');
      // Auto-assign category based on position
      const mappedCategory = positionCategoryMap[selectedValue] || 'Cuisine';
      setCategory(mappedCategory);
    }
  };

  // CRITICAL: Email validation function
  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // CRITICAL: Handle hourly rate change with salary calculation
  const handleHourlyRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rate = parseFloat(e.target.value);
    setHourlyRate(rate);
    
    if (!isNaN(rate) && weeklyHours) {
      // French standard: weekly hours * 4.33 (average weeks per month) * hourly rate
      const calculatedSalary = weeklyHours * 4.33 * rate;
      setGrossMonthlySalary(Math.round(calculatedSalary * 100) / 100);
    }
  };
  
  // CRITICAL: Handle gross monthly salary change with hourly rate calculation
  const handleGrossMonthlySalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const salary = parseFloat(e.target.value);
    setGrossMonthlySalary(salary);
    
    if (!isNaN(salary) && weeklyHours) {
      // Calculate hourly rate from monthly salary
      const calculatedRate = salary / (weeklyHours * 4.33);
      setHourlyRate(Math.round(calculatedRate * 100) / 100);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // CRITICAL: Validate email format if provided
      if (email && !validateEmail(email)) {
        toast.error('Format d\'email invalide');
        setLoading(false);
        return;
      }

      // CRITICAL: Determine final position value
      const finalPosition = isCustomPosition ? customPosition : position;
      
      // CRITICAL: Validate custom position
      if (isCustomPosition && !customPosition.trim()) {
        toast.error('Veuillez saisir un poste personnalisé');
        setLoading(false);
        return;
      }

      const employeeData = {
        firstName,
        lastName,
        streetAddress,
        city,
        postalCode,
        phone,
        email: email || undefined,
        socialSecurityNumber,
        contractType,
        startDate,
        endDate: contractType !== 'CDI' ? endDate : null,
        position: finalPosition,
        category,
        weeklyHours,
        notificationDays,
        restaurantId,
        // CRITICAL: Include new fields
        dateOfBirth: dateOfBirth || undefined,
        placeOfBirth: placeOfBirth || undefined,
        countryOfBirth: countryOfBirth || undefined,
        employeeStatus,
        hiringDate: hiringDate || startDate, // Default to startDate if hiringDate not set
        hourlyRate,
        grossMonthlySalary
      };

      if (employee) {
        await onUpdate({ ...employeeData, id: employee.id });
      } else {
        await onSave(employeeData);
      }

      onClose();
    } catch (error) {
      toast.error(t('staff.employeeSaveFailed'));
      console.error('Error saving employee:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        
        <div className="relative w-full max-w-4xl rounded-lg bg-white p-8 shadow-xl">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-500"
          >
            <X size={20} />
          </button>

          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            {employee ? t('staff.editEmployee') : t('staff.addEmployee')}
          </h2>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                type="button"
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'personal'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('personal')}
              >
                <User className="inline-block mr-2" size={16} />
                {t('staff.personalInfo')}
              </button>
              <button
                type="button"
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'employment'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('employment')}
              >
                <Briefcase className="inline-block mr-2" size={16} />
                {t('staff.employmentInfo')}
              </button>
              <button
                type="button"
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'salary'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('salary')}
              >
                <DollarSign className="inline-block mr-2" size={16} />
                {t('staff.salaryInfo')}
              </button>
              <button
                type="button"
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'preferences'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('preferences')}
              >
                <Heart className="inline-block mr-2" size={16} />
                Préférences
              </button>
            </nav>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {activeTab === 'personal' && (
              <>
                {/* Personal Information Section */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Informations Personnelles</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                        {t('staff.firstName')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                        {t('staff.lastName')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                        <div className="flex items-center">
                          <Calendar size={16} className="mr-2 text-gray-400" />
                          Date de Naissance <span className="text-red-500">*</span>
                        </div>
                      </label>
                      <input
                        type="date"
                        id="dateOfBirth"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label htmlFor="placeOfBirth" className="block text-sm font-medium text-gray-700">
                        <div className="flex items-center">
                          <MapPin size={16} className="mr-2 text-gray-400" />
                          Lieu de Naissance <span className="text-red-500">*</span>
                        </div>
                      </label>
                      <input
                        type="text"
                        id="placeOfBirth"
                        value={placeOfBirth}
                        onChange={(e) => setPlaceOfBirth(e.target.value)}
                        required
                        placeholder="Ville de naissance"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="countryOfBirth" className="block text-sm font-medium text-gray-700">
                        <div className="flex items-center">
                          <Globe size={16} className="mr-2 text-gray-400" />
                          Pays de Naissance <span className="text-red-500">*</span>
                        </div>
                      </label>
                      <input
                        type="text"
                        id="countryOfBirth"
                        value={countryOfBirth}
                        onChange={(e) => setCountryOfBirth(e.target.value)}
                        required
                        placeholder="France"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="employeeStatus" className="block text-sm font-medium text-gray-700">
                        <div className="flex items-center">
                          <User size={16} className="mr-2 text-gray-400" />
                          Statut <span className="text-red-500">*</span>
                        </div>
                      </label>
                      <select
                        id="employeeStatus"
                        value={employeeStatus}
                        onChange={(e) => setEmployeeStatus(e.target.value as EmployeeStatus)}
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      >
                        {Object.entries(EMPLOYEE_STATUS).map(([key, value]) => (
                          <option key={key} value={key}>{value}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Coordonnées</h3>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      <div className="flex items-center">
                        <Mail size={16} className="mr-2 text-gray-400" />
                        Email
                        <span className="ml-1 text-sm text-gray-500">(optionnel)</span>
                      </div>
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="exemple@email.com"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Adresse email pour les communications professionnelles (optionnel)
                    </p>
                  </div>

                  <div className="mt-4">
                    <label htmlFor="socialSecurityNumber" className="block text-sm font-medium text-gray-700">
                      Numéro de SS <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="socialSecurityNumber"
                      value={socialSecurityNumber}
                      onChange={handleSocialSecurityNumberChange}
                      placeholder="1 66 06 66 666 666 66"
                      maxLength={21}
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Format: 1 66 06 66 666 666 66
                    </p>
                  </div>

                  <div className="mt-4">
                    <label htmlFor="streetAddress" className="block text-sm font-medium text-gray-700">
                      {t('staff.streetAddress')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="streetAddress"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                        {t('staff.city')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>

                    <div>
                      <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                        {t('staff.postalCode')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="postalCode"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      {t('staff.phoneNumber')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="06 12 34 56 78"
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Format: 06 12 34 56 78 ou +33 6 12 34 56 78
                    </p>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'employment' && (
              <>
                {/* Employment Information Section */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Informations d'Emploi</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="contractType" className="block text-sm font-medium text-gray-700">
                        {t('staff.contractType')} <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="contractType"
                        value={contractType}
                        onChange={(e) => setContractType(e.target.value as 'CDI' | 'CDD' | 'Extra')}
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      >
                        <option value="CDI">{t('contractTypes.cdi')}</option>
                        <option value="CDD">{t('contractTypes.cdd')}</option>
                        <option value="Extra">{t('contractTypes.extra')}</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="hiringDate" className="block text-sm font-medium text-gray-700">
                        <div className="flex items-center">
                          <Calendar size={16} className="mr-2 text-gray-400" />
                          Date d'embauche <span className="text-red-500">*</span>
                        </div>
                      </label>
                      <input
                        type="date"
                        id="hiringDate"
                        value={hiringDate}
                        onChange={(e) => setHiringDate(e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    {/* CRITICAL: Enhanced Position Selection with Custom Option */}
                    <div>
                      <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                        {t('staff.position')} <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="position"
                        value={isCustomPosition ? 'custom' : position}
                        onChange={handlePositionChange}
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      >
                        {POSITIONS.map((pos) => (
                          <option key={pos} value={pos}>
                            {t(`positions.${pos.toLowerCase().replace(/[^a-z]/g, '')}`)}</option>
                        ))}
                        <option value="custom">Autre / Personnalisé...</option>
                      </select>
                    </div>
                  </div>

                  {/* CRITICAL: Custom Position Input (shown only when custom is selected) */}
                  {isCustomPosition && (
                    <div className="mt-4">
                      <label htmlFor="customPosition" className="block text-sm font-medium text-gray-700">
                        Poste personnalisé <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="customPosition"
                        value={customPosition}
                        onChange={(e) => setCustomPosition(e.target.value)}
                        required
                        placeholder="Saisissez le poste personnalisé"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {/* CRITICAL: Category Selection (shown for custom positions or when editing) */}
                  {(isCustomPosition || showCategoryPrompt || employee) && (
                    <div className="mt-4">
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                        <div className="flex items-center justify-between">
                          <span>{t('staff.category')} <span className="text-red-500">*</span></span>
                          {!isCustomPosition && (
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              Auto-assigné
                            </span>
                          )}
                        </div>
                      </label>
                      <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value as EmployeeCategory)}
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      >
                        {Object.values(EMPLOYEE_CATEGORIES).map(cat => (
                          <option key={cat} value={cat}>{t(`categories.${cat.toLowerCase()}`)}</option>
                        ))}
                      </select>
                      
                      {isCustomPosition && (
                        <p className="mt-1 text-sm text-gray-500">
                          Veuillez sélectionner la catégorie pour ce poste personnalisé
                        </p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                        {t('staff.startDate')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="startDate"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>

                    {contractType !== 'CDI' && (
                      <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                          {t('staff.endDate')} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          id="endDate"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          required
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                        />
                      </div>
                    )}
                    
                    <div>
                      <label htmlFor="weeklyHours" className="block text-sm font-medium text-gray-700">
                        <div className="flex items-center">
                          <Clock size={16} className="mr-2 text-gray-400" />
                          Base Horaire (Hebdo) <span className="text-red-500">*</span>
                        </div>
                      </label>
                      <input
                        type="number"
                        id="weeklyHours"
                        value={weeklyHours}
                        onChange={(e) => setWeeklyHours(parseInt(e.target.value))}
                        min="1"
                        max="50"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Heures hebdomadaires contractuelles
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'salary' && (
              <>
                {/* Salary Information Section */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Informations Salariales</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700">
                        <div className="flex items-center">
                          <DollarSign size={16} className="mr-2 text-gray-400" />
                          Taux Horaire <span className="text-red-500">*</span>
                        </div>
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">€</span>
                        </div>
                        <input
                          type="number"
                          id="hourlyRate"
                          value={hourlyRate}
                          onChange={handleHourlyRateChange}
                          min="0"
                          step="0.01"
                          required
                          className="block w-full pl-7 pr-12 py-2 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">/heure</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="grossMonthlySalary" className="block text-sm font-medium text-gray-700">
                        <div className="flex items-center">
                          <Briefcase size={16} className="mr-2 text-gray-400" />
                          Salaire Brut Mensuel <span className="text-red-500">*</span>
                        </div>
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">€</span>
                        </div>
                        <input
                          type="number"
                          id="grossMonthlySalary"
                          value={grossMonthlySalary}
                          onChange={handleGrossMonthlySalaryChange}
                          min="0"
                          step="0.01"
                          required
                          className="block w-full pl-7 pr-12 py-2 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">/mois</span>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Calculé automatiquement: {weeklyHours}h/semaine × 4.33 semaines × {hourlyRate}€/h
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Note:</strong> Le salaire brut mensuel est calculé automatiquement en multipliant le taux horaire par la base horaire hebdomadaire et par 4.33 (nombre moyen de semaines par mois). Vous pouvez ajuster manuellement l'un ou l'autre.
                    </p>
                  </div>
                </div>

                {/* Notification Settings */}
                {contractType !== 'CDI' && (
                  <div>
                    <label htmlFor="notificationDays" className="block text-sm font-medium text-gray-700">
                      <div className="flex items-center justify-between">
                        <span>Jours avant fin de contrat</span>
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          Préavis automatique
                        </span>
                      </div>
                    </label>
                    <input
                      type="number"
                      id="notificationDays"
                      value={notificationDays}
                      onChange={(e) => setNotificationDays(parseInt(e.target.value) || 3)}
                      min="1"
                      max="90"
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="3"
                    />
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>📅 Notification automatique :</strong> Le système vous alertera {notificationDays} jour{notificationDays > 1 ? 's' : ''} avant la fin du contrat {contractType} de cet employé.
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Valeur par défaut : 3 jours (modifiable selon vos besoins)
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'preferences' && (
              <>
                {/* Preferences Section */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Préférences et Disponibilités</h3>
                  
                  <div className="p-4 bg-blue-50 rounded-lg mb-6">
                    <div className="flex items-start">
                      <Heart className="text-blue-500 mt-1 mr-3" size={20} />
                      <div>
                        <p className="text-sm text-blue-700">
                          <strong>Note importante :</strong> Les préférences et disponibilités sont gérées dans des sections dédiées accessibles depuis la page du personnel.
                        </p>
                        <p className="text-sm text-blue-700 mt-2">
                          Après avoir créé ou mis à jour cet employé, vous pourrez configurer ses préférences de travail et ses disponibilités depuis la liste du personnel.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center mb-3">
                        <Heart className="text-purple-600 mr-2" size={20} />
                        <h4 className="font-medium text-gray-800">Préférences de Travail</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Configurez les préférences de l'employé concernant les jours, les horaires et les postes de travail.
                      </p>
                      <div className="text-sm text-gray-500">
                        <p className="flex items-center mb-1">
                          <CalendarIcon size={14} className="mr-2 text-gray-400" />
                          Jours préférés
                        </p>
                        <p className="flex items-center mb-1">
                          <Clock size={14} className="mr-2 text-gray-400" />
                          Horaires préférés
                        </p>
                        <p className="flex items-center">
                          <Briefcase size={14} className="mr-2 text-gray-400" />
                          Postes préférés
                        </p>
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center mb-3">
                        <Calendar size={20} className="text-blue-600 mr-2" />
                        <h4 className="font-medium text-gray-800">Disponibilités</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Gérez les disponibilités et indisponibilités récurrentes ou ponctuelles de l'employé.
                      </p>
                      <div className="text-sm text-gray-500">
                        <p className="flex items-center mb-1">
                          <Clock size={14} className="mr-2 text-gray-400" />
                          Plages horaires disponibles
                        </p>
                        <p className="flex items-center mb-1">
                          <Repeat size={14} className="mr-2 text-gray-400" />
                          Récurrences (hebdomadaire, mensuelle)
                        </p>
                        <p className="flex items-center">
                          <X size={14} className="mr-2 text-gray-400" />
                          Indisponibilités spécifiques
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
              >
                {loading ? t('common.saving') : employee ? t('staff.updateEmployee') : t('staff.addEmployee')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeeForm;