import React, { useState } from 'react';
import { Plus, Copy, Trash2 } from 'lucide-react';
import { ShiftTemplate, DAYS_OF_WEEK, POSITIONS } from '../../types';
import { useTranslation } from 'react-i18next';

interface ShiftTemplatesProps {
  templates: ShiftTemplate[];
  onSave: (template: Omit<ShiftTemplate, 'id'>) => void;
  onDelete: (templateId: string) => void;
  onApply: (template: ShiftTemplate) => void;
}

const ShiftTemplates: React.FC<ShiftTemplatesProps> = ({
  templates,
  onSave,
  onDelete,
  onApply
}) => {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('17:00');
  const [position, setPosition] = useState(POSITIONS[0]);
  const [weeklyPattern, setWeeklyPattern] = useState<Record<number, boolean>>(
    DAYS_OF_WEEK.reduce((acc, _, index) => ({ ...acc, [index]: false }), {})
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      description,
      start,
      end,
      position,
      weeklyPattern,
      type: 'morning',
      restaurantId: ''
    });
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          {t('schedule.shiftTemplates')}
        </h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <Plus size={16} className="mr-1" />
          {t('schedule.newTemplate')}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-md shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('schedule.templateName')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('schedule.templateDescription')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('schedule.startTime')}
              </label>
              <input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('schedule.endTime')}
              </label>
              <input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('schedule.position')}
            </label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              {POSITIONS.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('schedule.repeatOn')}
            </label>
            <div className="flex gap-2">
              {DAYS_OF_WEEK.map((day, index) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setWeeklyPattern(prev => ({
                    ...prev,
                    [index]: !prev[index]
                  }))}
                  className={`w-8 h-8 rounded-full text-sm font-medium ${
                    weeklyPattern[index]
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {day[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              {t('common.save')}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => (
          <div
            key={template.id}
            className="bg-white p-4 rounded-md shadow-sm border border-gray-200"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium text-gray-900">{template.name}</h4>
                {template.description && (
                  <p className="text-sm text-gray-500">{template.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onApply(template)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title={t('schedule.applyTemplate')}
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() => onDelete(template.id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                  title={t('common.delete')}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p>{template.position}</p>
              <p>{template.start} - {template.end}</p>
            </div>

            <div className="mt-2 flex gap-1">
              {DAYS_OF_WEEK.map((day, index) => (
                <span
                  key={day}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    template.weeklyPattern[index]
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {day[0]}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShiftTemplates;