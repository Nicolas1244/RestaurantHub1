import { Shift } from '../types';
import toast from 'react-hot-toast';

// Constants for auto-save configuration
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds
const INACTIVITY_TIMEOUT = 3000; // 3 seconds of inactivity before saving

export class ScheduleAutoSaveService {
  private static instance: ScheduleAutoSaveService;
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private inactivityTimer: NodeJS.Timeout | null = null;
  private lastSaveTime: number = 0;
  private pendingChanges: boolean = false;
  private saveCallback: ((shifts: Shift[]) => void) | null = null;
  private currentShifts: Shift[] = [];
  private isEnabled: boolean = true;
  private language: 'en' | 'fr' = 'fr';

  private constructor() {}

  public static getInstance(): ScheduleAutoSaveService {
    if (!ScheduleAutoSaveService.instance) {
      ScheduleAutoSaveService.instance = new ScheduleAutoSaveService();
    }
    return ScheduleAutoSaveService.instance;
  }

  /**
   * Initialize the auto-save service
   * @param saveCallback Function to call when auto-saving
   * @param initialShifts Initial shifts data
   * @param language UI language ('en' or 'fr')
   */
  public initialize(
    saveCallback: (shifts: Shift[]) => void,
    initialShifts: Shift[] = [],
    language: 'en' | 'fr' = 'fr'
  ): void {
    this.saveCallback = saveCallback;
    this.currentShifts = [...initialShifts];
    this.language = language;
    this.startAutoSaveTimer();
    
    console.log('🔄 Schedule auto-save service initialized');
    
    // Setup beforeunload handler to save before page close/refresh
    window.addEventListener('beforeunload', this.handleBeforeUnload);
  }

  /**
   * Update the current shifts data and mark as having pending changes
   * @param shifts Updated shifts data
   */
  public updateShifts(shifts: Shift[]): void {
    this.currentShifts = [...shifts];
    this.pendingChanges = true;
    this.resetInactivityTimer();
    
    // If it's been more than 5 minutes since last save, save immediately
    const timeSinceLastSave = Date.now() - this.lastSaveTime;
    if (timeSinceLastSave > 5 * 60 * 1000) {
      this.saveNow();
    }
  }

  /**
   * Force an immediate save
   */
  public saveNow(): void {
    if (!this.saveCallback || !this.pendingChanges) return;
    
    try {
      this.saveCallback(this.currentShifts);
      this.lastSaveTime = Date.now();
      this.pendingChanges = false;
      
      // Show subtle notification
      this.showSaveNotification(true);
      
      console.log('✅ Schedule auto-saved successfully');
    } catch (error) {
      console.error('❌ Schedule auto-save failed:', error);
      this.showSaveNotification(false);
    }
  }

  /**
   * Enable or disable auto-save
   * @param enabled Whether auto-save should be enabled
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    
    if (enabled) {
      this.startAutoSaveTimer();
    } else {
      this.stopAutoSaveTimer();
    }
    
    console.log(`🔄 Schedule auto-save ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Update the UI language
   * @param language UI language ('en' or 'fr')
   */
  public setLanguage(language: 'en' | 'fr'): void {
    this.language = language;
  }

  /**
   * Clean up resources when component unmounts
   */
  public cleanup(): void {
    // Save any pending changes before cleanup
    if (this.pendingChanges) {
      this.saveNow();
    }
    
    this.stopAutoSaveTimer();
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    console.log('🧹 Schedule auto-save service cleaned up');
  }

  /**
   * Start the auto-save timer
   */
  private startAutoSaveTimer(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    
    this.autoSaveTimer = setInterval(() => {
      if (this.isEnabled && this.pendingChanges) {
        this.saveNow();
      }
    }, AUTO_SAVE_INTERVAL);
  }

  /**
   * Stop the auto-save timer
   */
  private stopAutoSaveTimer(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  /**
   * Reset the inactivity timer
   */
  private resetInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    
    this.inactivityTimer = setTimeout(() => {
      if (this.isEnabled && this.pendingChanges) {
        this.saveNow();
      }
    }, INACTIVITY_TIMEOUT);
  }

  /**
   * Show a subtle notification about the save status
   * @param success Whether the save was successful
   */
  private showSaveNotification(success: boolean): void {
    if (success) {
      toast(
        this.language === 'fr' ? 'Planning sauvegardé' : 'Schedule saved',
        {
          icon: '✅',
          duration: 2000,
          style: {
            background: '#f0fdf4',
            color: '#166534',
            border: '1px solid #dcfce7'
          },
          position: 'bottom-right',
          id: 'schedule-autosave-success'
        }
      );
    } else {
      toast(
        this.language === 'fr' 
          ? 'Échec de la sauvegarde automatique' 
          : 'Auto-save failed',
        {
          icon: '⚠️',
          duration: 3000,
          style: {
            background: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fee2e2'
          },
          position: 'bottom-right',
          id: 'schedule-autosave-error'
        }
      );
    }
  }

  /**
   * Handle beforeunload event to save before page close/refresh
   */
  private handleBeforeUnload = (event: BeforeUnloadEvent): void => {
    if (this.pendingChanges) {
      // Try to save before unload
      this.saveNow();
      
      // Modern browsers ignore this message but require a return value
      // to trigger the confirmation dialog
      event.preventDefault();
      event.returnValue = '';
    }
  };
}

// Export singleton instance
export const scheduleAutoSaveService = ScheduleAutoSaveService.getInstance();