'use client';

import { useState, useRef, useEffect } from 'react';
import { COLOR_PRESETS } from '@/lib/validations/catalog-schema';
import clsx from 'clsx';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  error?: string;
}

export function ColorPicker({ value, onChange, label, error }: ColorPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [customColor, setCustomColor] = useState(value);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCustomColor(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    }

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPicker]);

  const handlePresetClick = (color: string) => {
    onChange(color);
    setCustomColor(color);
    setShowPicker(false);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
      onChange(color);
    }
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      {/* Color Display Button */}
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className={clsx(
          'w-full h-10 px-3 py-2 border rounded-md flex items-center justify-between',
          'focus:outline-none focus:ring-2 focus:ring-blue-500',
          error ? 'border-red-500' : 'border-gray-300',
          'hover:border-gray-400 transition-colors'
        )}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded border border-gray-300"
            style={{ backgroundColor: value }}
          />
          <span className="text-sm font-mono">{value}</span>
        </div>
        <svg
          className={clsx('w-4 h-4 transition-transform', showPicker && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Picker Dropdown */}
      {showPicker && (
        <div
          ref={pickerRef}
          className="absolute z-50 mt-2 w-72 bg-white border border-gray-300 rounded-lg shadow-lg p-4"
        >
          {/* Preset Colors */}
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-700 mb-2">Presets</p>
            <div className="grid grid-cols-5 gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.hex}
                  type="button"
                  onClick={() => handlePresetClick(preset.hex)}
                  className={clsx(
                    'w-full aspect-square rounded-md border-2 transition-all hover:scale-110',
                    value === preset.hex ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
                  )}
                  style={{ backgroundColor: preset.hex }}
                  title={preset.name}
                />
              ))}
            </div>
          </div>

          {/* Custom Color Input */}
          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-700 mb-2">Custom Color</p>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={value}
                onChange={(e) => {
                  onChange(e.target.value);
                  setCustomColor(e.target.value);
                }}
                className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={customColor}
                onChange={handleCustomColorChange}
                placeholder="#RRGGBB"
                className="flex-1 px-2 py-1.5 text-sm font-mono border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={7}
              />
            </div>
            {customColor && !/^#[0-9A-Fa-f]{6}$/.test(customColor) && (
              <p className="mt-1 text-xs text-red-600">
                Invalid hex color format
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
