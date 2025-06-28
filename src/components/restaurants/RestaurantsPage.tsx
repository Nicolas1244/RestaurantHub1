import React, { useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { Restaurant } from '../../types';
import RestaurantList from './RestaurantList';
import RestaurantForm from './RestaurantForm';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const RestaurantsPage: React.FC = () => {
  const { t } = useTranslation();
  const { restaurants, addRestaurant, updateRestaurant, deleteRestaurant } = useAppContext();
  const [showRestaurantForm, setShowRestaurantForm] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | undefined>(undefined);

  const handleAddRestaurant = () => {
    setSelectedRestaurant(undefined);
    setShowRestaurantForm(true);
  };

  const handleEditRestaurant = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowRestaurantForm(true);
  };

  // CRITICAL: Implement save functionality
  const handleSaveRestaurant = async (restaurantData: Omit<Restaurant, 'id'>) => {
    try {
      await addRestaurant(restaurantData);
      setShowRestaurantForm(false);
      toast.success(t('restaurants.createSuccess'));
    } catch (error) {
      console.error('Error adding restaurant:', error);
      toast.error(t('restaurants.saveFailed'));
    }
  };

  // CRITICAL: Implement update functionality
  const handleUpdateRestaurant = async (restaurant: Restaurant) => {
    try {
      await updateRestaurant(restaurant);
      setShowRestaurantForm(false);
      toast.success(t('restaurants.updateSuccess'));
    } catch (error) {
      console.error('Error updating restaurant:', error);
      toast.error(t('restaurants.saveFailed'));
    }
  };

  // CRITICAL: Implement delete functionality
  const handleDeleteRestaurant = async (restaurantId: string) => {
    try {
      await deleteRestaurant(restaurantId);
      toast.success('Restaurant supprimé avec succès');
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      toast.error('Échec de la suppression du restaurant');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Building2 className="text-blue-600" size={28} />
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {t('restaurants.management')}
            </h2>
            <p className="text-gray-500">
              {t('restaurants.managementDescription')}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleAddRestaurant}
          className="flex items-center px-4 py-2 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
        >
          <Plus size={18} className="mr-1" />
          {t('restaurants.addRestaurant')}
        </button>
      </div>

      <RestaurantList
        restaurants={restaurants}
        onEditRestaurant={handleEditRestaurant}
        onDeleteRestaurant={handleDeleteRestaurant}
      />

      {showRestaurantForm && (
        <RestaurantForm
          isOpen={showRestaurantForm}
          onClose={() => setShowRestaurantForm(false)}
          restaurant={selectedRestaurant}
          onSave={handleSaveRestaurant}
          onUpdate={handleUpdateRestaurant}
        />
      )}
    </div>
  );
};

export default RestaurantsPage;