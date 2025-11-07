import { useLocalStorage } from './useLocalStorage';
import { PersistedSchedulerState } from '@/types/scheduler';

const DEFAULT_STATE: PersistedSchedulerState = {
  collapsedCourseGroups: [],
  collapsedDivisions: [],
  sortBy: null,
  prepsThreshold: 3, // Default threshold for CPT/Prep count
  lastAccessed: new Date().toISOString(),
};

/**
 * Hook for managing persisted scheduler UI state
 */
export function usePersistedSchedulerState() {
  const [state, setState] = useLocalStorage<PersistedSchedulerState>(
    'scheduler-ui-state',
    DEFAULT_STATE
  );

  // Toggle course group collapse state
  const toggleCourseGroup = (groupId: string) => {
    setState(prev => {
      const isCollapsed = prev.collapsedCourseGroups.includes(groupId);
      return {
        ...prev,
        collapsedCourseGroups: isCollapsed
          ? prev.collapsedCourseGroups.filter(id => id !== groupId)
          : [...prev.collapsedCourseGroups, groupId],
        lastAccessed: new Date().toISOString(),
      };
    });
  };

  // Toggle division collapse state
  const toggleDivision = (division: 'MS' | 'HS') => {
    setState(prev => {
      const isCollapsed = prev.collapsedDivisions.includes(division);
      return {
        ...prev,
        collapsedDivisions: isCollapsed
          ? prev.collapsedDivisions.filter(d => d !== division)
          : [...prev.collapsedDivisions, division],
        lastAccessed: new Date().toISOString(),
      };
    });
  };

  // Set sort column
  const setSortBy = (column: string | null) => {
    setState(prev => ({
      ...prev,
      sortBy: column,
      lastAccessed: new Date().toISOString(),
    }));
  };

  // Set preps threshold
  const setPrepsThreshold = (threshold: number) => {
    setState(prev => ({
      ...prev,
      prepsThreshold: threshold,
      lastAccessed: new Date().toISOString(),
    }));
  };

  // Reset to default state
  const reset = () => {
    setState(DEFAULT_STATE);
  };

  return {
    state,
    toggleCourseGroup,
    toggleDivision,
    setSortBy,
    setPrepsThreshold,
    reset,
  };
}
