import React, { useState } from 'react';
import { Building2, MapPin, Phone, Globe, Edit, Trash2 } from 'lucide-react';
import { Restaurant } from '../../types';
import { useTranslation } from 'react-i18next';

interface RestaurantListProps {
  restaurants: Restaurant[];
  onEditRestaurant: (restaurant: Restaurant) => void;
  onDeleteRestaurant: (restaurantId: string) => void;
}

const RestaurantList: React.FC<RestaurantListProps> = ({
  restaurants,
  onEditRestaurant,
  onDeleteRestaurant,
}) => {
  const { t } = useTranslation();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDeleteClick = (restaurant: Restaurant) => {
    setDeleteConfirmId(restaurant.id);
  };

  const handleConfirmDelete = (restaurantId: string) => {
    onDeleteRestaurant(restaurantId);
    setDeleteConfirmId(null);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmId(null);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.map((restaurant) => (
          <div
            key={restaurant.id}
            className="bg-white rounded-lg shadow-sm overflow-hidden"
          >
            {/* CRITICAL FIX: Enlarged logo display without gray borders */}
            <div className="relative h-64 flex items-center justify-center bg-white">
              {restaurant.image ? (
                <img
                  src={restaurant.image}
                  alt={restaurant.name}
                  className="object-contain"
                  style={{
                    width: 'auto',
                    height: 'auto',
                    maxWidth: '280px',
                    maxHeight: '240px',
                    minWidth: '200px',
                    minHeight: '160px'
                  }}
                />
              ) : (
                <div className="flex items-center justify-center">
                  <Building2 size={80} className="text-gray-300" />
                </div>
              )}
              
              {/* Action buttons positioned in top-right corner */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => onEditRestaurant(restaurant)}
                  className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors border border-gray-200"
                  title={t('common.edit')}
                >
                  <Edit size={16} className="text-gray-600" />
                </button>
                
                {/* CRITICAL: Delete button */}
                <button
                  onClick={() => handleDeleteClick(restaurant)}
                  className="p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors border border-gray-200"
                  title="Supprimer"
                >
                  <Trash2 size={16} className="text-red-600" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {restaurant.commercialName || restaurant.name}
                </h3>
                {restaurant.legalName && restaurant.legalName !== restaurant.commercialName && (
                  <p className="text-sm text-gray-500">{restaurant.legalName}</p>
                )}
              </div>

              <div className="space-y-2">
                {(restaurant.streetAddress || restaurant.city) && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin size={16} className="text-gray-400 mt-1 shrink-0" />
                    <p className="text-gray-600">
                      {restaurant.streetAddress && (
                        <>
                          {restaurant.streetAddress}
                          <br />
                        </>
                      )}
                      {restaurant.postalCode && restaurant.city && (
                        <>
                          {restaurant.postalCode} {restaurant.city}
                          <br />
                        </>
                      )}
                      {restaurant.country && restaurant.country}
                    </p>
                  </div>
                )}

                {restaurant.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={16} className="text-gray-400" />
                    <p className="text-gray-600">{restaurant.phone}</p>
                  </div>
                )}

                {restaurant.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe size={16} className="text-gray-400" />
                    <a
                      href={restaurant.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {restaurant.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>

              {restaurant.manager && (restaurant.manager.firstName || restaurant.manager.lastName) && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    {t('restaurants.manager')}
                  </h4>
                  <div className="space-y-1">
                    {(restaurant.manager.firstName || restaurant.manager.lastName) && (
                      <p className="text-sm text-gray-800">
                        {restaurant.manager.firstName} {restaurant.manager.lastName}
                      </p>
                    )}
                    {restaurant.manager.phone && (
                      <p className="text-sm text-gray-600">{restaurant.manager.phone}</p>
                    )}
                    {restaurant.manager.email && (
                      <p className="text-sm text-gray-600">{restaurant.manager.email}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* CRITICAL: Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={handleCancelDelete} />
            
            <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 size={20} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Supprimer le restaurant
                  </h3>
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-6">
                Êtes-vous sûr de vouloir supprimer ce restaurant ? Cette action est irréversible.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => handleConfirmDelete(deleteConfirmId)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RestaurantList;