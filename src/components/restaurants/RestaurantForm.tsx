import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { Restaurant } from '../../types';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

interface RestaurantFormProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant?: Restaurant;
  onSave: (restaurant: Omit<Restaurant, 'id'>) => Promise<void>;
  onUpdate: (restaurant: Restaurant) => Promise<void>;
}

const RestaurantForm: React.FC<RestaurantFormProps> = ({
  isOpen,
  onClose,
  restaurant,
  onSave,
  onUpdate,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  
  // CRITICAL: Enhanced form state with mandatory address fields
  const [imageUrl, setImageUrl] = useState('');
  const [commercialName, setCommercialName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [siret, setSiret] = useState('');
  // CRITICAL: Address fields are now mandatory
  const [streetAddress, setStreetAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('France');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [managerFirstName, setManagerFirstName] = useState('');
  const [managerLastName, setManagerLastName] = useState('');
  const [managerPhone, setManagerPhone] = useState('');
  const [managerEmail, setManagerEmail] = useState('');

  useEffect(() => {
    if (restaurant) {
      setImageUrl(restaurant.image || '');
      setCommercialName(restaurant.commercialName || restaurant.name || '');
      setLegalName(restaurant.legalName || '');
      setSiret(restaurant.siret || '');
      setStreetAddress(restaurant.streetAddress || '');
      setPostalCode(restaurant.postalCode || '');
      setCity(restaurant.city || '');
      setCountry(restaurant.country || 'France');
      setPhone(restaurant.phone || '');
      setWebsite(restaurant.website || '');
      if (restaurant.manager) {
        setManagerFirstName(restaurant.manager.firstName || '');
        setManagerLastName(restaurant.manager.lastName || '');
        setManagerPhone(restaurant.manager.phone || '');
        setManagerEmail(restaurant.manager.email || '');
      }
    } else {
      // Reset form for new restaurant
      setImageUrl('');
      setCommercialName('');
      setLegalName('');
      setSiret('');
      setStreetAddress('');
      setPostalCode('');
      setCity('');
      setCountry('France');
      setPhone('');
      setWebsite('');
      setManagerFirstName('');
      setManagerLastName('');
      setManagerPhone('');
      setManagerEmail('');
    }
  }, [restaurant, isOpen]);

  // CRITICAL: Image upload functionality
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner un fichier image valide (JPEG, PNG, etc.)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La taille du fichier ne doit pas dépasser 5MB');
        return;
      }

      // Create object URL for preview
      const objectUrl = URL.createObjectURL(file);
      setImageUrl(objectUrl);
      
      toast.success('Image téléchargée avec succès');
    }
  };

  // CRITICAL: Enhanced validation with mandatory address fields
  const validateForm = (): boolean => {
    // Check mandatory fields
    if (!commercialName.trim()) {
      toast.error('Le nom commercial est obligatoire');
      return false;
    }
    
    if (!legalName.trim()) {
      toast.error('La raison sociale est obligatoire');
      return false;
    }

    // CRITICAL: Validate mandatory address fields for weather integration
    if (!streetAddress.trim()) {
      toast.error('L\'adresse est obligatoire pour les prévisions météo');
      return false;
    }

    if (!postalCode.trim()) {
      toast.error('Le code postal est obligatoire pour les prévisions météo');
      return false;
    }

    if (!city.trim()) {
      toast.error('La ville est obligatoire pour les prévisions météo');
      return false;
    }

    if (!country.trim()) {
      toast.error('Le pays est obligatoire pour les prévisions météo');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // CRITICAL: Enhanced validation
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // CRITICAL: Build complete location string for weather service
      const fullLocation = `${streetAddress}, ${postalCode} ${city}, ${country}`;
      
      const restaurantData = {
        name: commercialName, // Use commercial name as the main name
        commercialName,
        legalName,
        location: fullLocation, // CRITICAL: Enhanced location for weather
        image: imageUrl,
        siret: siret || undefined,
        // CRITICAL: All address fields are now mandatory and included
        streetAddress,
        postalCode,
        city,
        country,
        phone: phone || undefined,
        website: website || undefined,
        manager: (managerFirstName || managerLastName || managerPhone || managerEmail) ? {
          firstName: managerFirstName || '',
          lastName: managerLastName || '',
          phone: managerPhone || '',
          email: managerEmail || '',
        } : undefined,
      };

      if (restaurant) {
        await onUpdate({ ...restaurantData, id: restaurant.id });
        toast.success(t('restaurants.updateSuccess'));
      } else {
        await onSave(restaurantData);
        toast.success(t('restaurants.createSuccess'));
      }

      // CRITICAL: Notify about weather integration
      toast.success('Prévisions météo configurées pour cette localisation', { duration: 4000 });

      onClose();
    } catch (error) {
      toast.error(t('restaurants.saveFailed'));
      console.error('Error saving restaurant:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        
        <div className="relative w-full max-w-3xl rounded-lg bg-white shadow-xl">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {restaurant ? t('restaurants.editRestaurant') : t('restaurants.addRestaurant')}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* CRITICAL: Image Upload Component */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('restaurants.logo')}
                </label>
                <div className="flex items-center space-x-4">
                  {/* Image Preview */}
                  <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Restaurant logo preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <ImageIcon size={32} className="text-gray-400" />
                    )}
                  </div>
                  
                  {/* Upload Button */}
                  <div className="flex-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Upload size={16} className="mr-2" />
                      Télécharger une image
                    </button>
                    <p className="mt-2 text-sm text-gray-500">
                      <strong>Dimension optimale :</strong> 200px x 200px<br />
                      Formats acceptés : JPEG, PNG (max 5MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* CRITICAL: Mandatory Fields */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('restaurants.commercialName')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={commercialName}
                    onChange={(e) => setCommercialName(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Nom affiché au public"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('restaurants.legalName')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Raison sociale officielle"
                  />
                </div>

                {/* CRITICAL: Optional Fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('restaurants.siret')}
                  </label>
                  <input
                    type="text"
                    value={siret}
                    onChange={(e) => setSiret(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Optionnel"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('restaurants.phone')}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Optionnel"
                  />
                </div>
              </div>

              {/* CRITICAL: Mandatory Address Section for Weather Integration */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  {t('restaurants.address')}
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                    Requis pour la météo
                  </span>
                </h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('restaurants.street')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Adresse complète du restaurant"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Exemple : 2B rue de l'Ourcq
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('restaurants.postalCode')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="75019"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('restaurants.city')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Paris"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('restaurants.country')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="France"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('restaurants.website')}
                    </label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="https://example.com (optionnel)"
                    />
                  </div>
                </div>

                {/* CRITICAL: Weather Integration Info */}
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-800">
                        Intégration Météo Automatique
                      </h4>
                      <p className="text-sm text-blue-700 mt-1">
                        L'adresse complète sera utilisée pour afficher automatiquement les prévisions météo 
                        dans le planning hebdomadaire. Assurez-vous que l'adresse est précise pour des 
                        prévisions localisées.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Manager Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {t('restaurants.managerInfo')}
                </h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('restaurants.managerFirstName')}
                    </label>
                    <input
                      type="text"
                      value={managerFirstName}
                      onChange={(e) => setManagerFirstName(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Optionnel"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('restaurants.managerLastName')}
                    </label>
                    <input
                      type="text"
                      value={managerLastName}
                      onChange={(e) => setManagerLastName(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Optionnel"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('restaurants.managerPhone')}
                    </label>
                    <input
                      type="tel"
                      value={managerPhone}
                      onChange={(e) => setManagerPhone(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Optionnel"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('restaurants.managerEmail')}
                    </label>
                    <input
                      type="email"
                      value={managerEmail}
                      onChange={(e) => setManagerEmail(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Optionnel"
                    />
                  </div>
                </div>
              </div>
            </div>

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
                {loading
                  ? t('common.saving')
                  : restaurant
                  ? t('common.update')
                  : t('common.create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RestaurantForm;