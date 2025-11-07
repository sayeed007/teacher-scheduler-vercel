'use client';

import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

interface InlineEditableNumberProps {
  value: number;
  onSave: (value: number) => Promise<void>;
  min?: number;
  max?: number;
  className?: string;
  align?: 'left' | 'center' | 'right';
  showSteppers?: boolean;
  disabled?: boolean;
}

export function InlineEditableNumber({
  value,
  onSave,
  min = 0,
  max = 999,
  className = '',
  align = 'center',
  showSteppers = true,
  disabled = false
}: InlineEditableNumberProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update edit value when prop value changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value.toString());
    }
  }, [value, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (!disabled && !isEditing) {
      setIsEditing(true);
      setError(null);
    }
  };

  const validateAndSave = async (newValue: string) => {
    const num = parseInt(newValue);

    // Validation
    if (isNaN(num)) {
      setError('Invalid number');
      return false;
    }

    if (num < min) {
      setError(`Min: ${min}`);
      return false;
    }

    if (num > max) {
      setError(`Max: ${max}`);
      return false;
    }

    // Only save if value changed
    if (num !== value) {
      setIsSaving(true);
      setError(null);
      try {
        await onSave(num);
        setIsEditing(false);
        return true;
      } catch (error) {
        const err = error as Error | { message?: string };
        setError(err.message || 'Save failed');
        return false;
      } finally {
        setIsSaving(false);
      }
    } else {
      setIsEditing(false);
      return true;
    }
  };

  const handleBlur = () => {
    if (!isSaving) {
      validateAndSave(editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      validateAndSave(editValue);
    } else if (e.key === 'Escape') {
      setEditValue(value.toString());
      setIsEditing(false);
      setError(null);
    } else if (e.key === 'ArrowUp' && showSteppers) {
      e.preventDefault();
      const num = parseInt(editValue) || 0;
      if (num < max) {
        setEditValue((num + 1).toString());
      }
    } else if (e.key === 'ArrowDown' && showSteppers) {
      e.preventDefault();
      const num = parseInt(editValue) || 0;
      if (num > min) {
        setEditValue((num - 1).toString());
      }
    }
  };

  const handleIncrement = async () => {
    const num = parseInt(editValue) || 0;
    if (num < max) {
      const newValue = (num + 1).toString();
      setEditValue(newValue);
      if (!isEditing) {
        await validateAndSave(newValue);
      }
    }
  };

  const handleDecrement = async () => {
    const num = parseInt(editValue) || 0;
    if (num > min) {
      const newValue = (num - 1).toString();
      setEditValue(newValue);
      if (!isEditing) {
        await validateAndSave(newValue);
      }
    }
  };

  if (isEditing) {
    return (
      <div className="relative group">
        <input
          ref={inputRef}
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          min={min}
          max={max}
          disabled={isSaving}
          className={clsx(
            'w-full px-2 py-1 text-sm border-2 border-blue-500 rounded',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            `text-${align}`,
            error ? 'border-red-500' : '',
            isSaving && 'bg-gray-50',
            className
          )}
        />
        {error && (
          <div className="absolute z-10 top-full left-0 mt-1 text-xs text-red-600 bg-white border border-red-300 rounded px-2 py-1 shadow-sm whitespace-nowrap">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'relative group cursor-pointer px-2 py-1',
        'hover:bg-blue-50 hover:ring-1 hover:ring-blue-300 rounded transition-all',
        disabled && 'cursor-not-allowed opacity-60',
        `text-${align}`,
        className
      )}
      onClick={handleClick}
      title={disabled ? undefined : 'Click to edit (↑↓ to adjust)'}
    >
      <div className="flex items-center justify-center gap-1">
        <span className={clsx('font-medium', isSaving && 'opacity-50')}>
          {isSaving ? '...' : value}
        </span>
        {showSteppers && !disabled && (
          <div className="opacity-0 group-hover:opacity-100 flex flex-col transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleIncrement();
              }}
              disabled={value >= max || isSaving}
              className="text-xs text-gray-500 hover:text-blue-600 disabled:text-gray-300 leading-none"
              title="Increment"
            >
              ▲
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDecrement();
              }}
              disabled={value <= min || isSaving}
              className="text-xs text-gray-500 hover:text-blue-600 disabled:text-gray-300 leading-none"
              title="Decrement"
            >
              ▼
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
