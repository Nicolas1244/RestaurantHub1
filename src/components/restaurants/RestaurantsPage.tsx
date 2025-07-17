import React, { useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { autoSaveService } from '../../lib/autoSaveService';
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

  // Initialize auto-save service
  React.useEffect(() => {
    autoSaveService.initialize(i18n.language as 'en' | 'fr');
    
    // Register save callback for restaurants
    autoSaveService.registerSaveCallback('restaurant', async (data) => {
      try {
        switch (data.operation) {
          case 'create':
            await addRestaurant(data.data);
            break;
          case 'update':
            await updateRestaurant(data.data);
            break;
          case 'delete':
            await deleteRestaurant(data.id!);
            break;
        }
      } catch (error) {
        console.error('Auto-save failed for restaurant:', error);
        throw error;
      }
    });
    
    return () => {
      autoSaveService.cleanup();
    };
  }, [addRestaurant, updateRestaurant, deleteRestaurant, i18n.language]);
  const handleAddRestaurant = () => {
    setSelectedRestaurant(undefined);
    setShowRestaurantForm(true);
  };

  const handleEditRestaurant = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowRestaurantForm(true);
  };

  // CRITICAL: Auto-save implementation for restaurant creation
  const handleSaveRestaurant = async (restaurantData: Omit<Restaurant, 'id'>) => {
    try {
      // Queue for auto-save instead of immediate save
      autoSaveService.queueSave({
        type: 'restaurant',
        data: restaurantData,
        operation: 'create'
      });
      
      // Force immediate save for form submission
      await autoSaveService.saveNow();
      setShowRestaurantForm(false);
    } catch (error) {
      console.error('Error adding restaurant:', error);
      toast.error(t('restaurants.saveFailed'));
    }
  };

  // CRITICAL: Auto-save implementation for restaurant updates
  const handleUpdateRestaurant = async (restaurant: Restaurant) => {
    try {
      // Queue for auto-save instead of immediate save
      autoSaveService.queueSave({
        type: 'restaurant',
        id: restaurant.id,
        data: restaurant,
        operation: 'update'
      });
      
      // Force immediate save for form submission
      await autoSaveService.saveNow();
      setShowRestaurantForm(false);
    } catch (error) {
      console.error('Error updating restaurant:', error);
      toast.error(t('restaurants.saveFailed'));
    }
  };

  // CRITICAL: Auto-save implementation for restaurant deletion
  const handleDeleteRestaurant = async (restaurantId: string) => {
    try {
      // Queue for auto-save instead of immediate save
      autoSaveService.queueSave({
        type: 'restaurant',
        id: restaurantId,
        data: null,
        operation: 'delete'
      });
      
      // Force immediate save for deletion
      await autoSaveService.saveNow();
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