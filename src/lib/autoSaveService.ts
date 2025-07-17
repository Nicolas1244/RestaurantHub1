// CRITICAL: Generic Auto-Save Service for all data modifications
import toast from 'react-hot-toast';

// Constants for auto-save configuration
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds
const INACTIVITY_TIMEOUT = 3000; // 3 seconds of inactivity before saving

export type AutoSaveDataType = 'restaurant' | 'employee' | 'document';

export interface AutoSaveData {
  type: AutoSaveDataType;
  id?: string;
  data: any;
  operation: 'create' | 'update' | 'delete';
}

export class AutoSaveService {
  private static instance: AutoSaveService;
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private inactivityTimer: NodeJS.Timeout | null = null;
  private lastSaveTime: number = 0;
  private pendingChanges: Map<string, AutoSaveData> = new Map();
  private saveCallbacks: Map<AutoSaveDataType, (data: AutoSaveData) => Promise<void>> = new Map();
  private isEnabled: boolean = true;
  private language: 'en' | 'fr' = 'fr';

  private constructor() {}

  public static getInstance(): AutoSaveService {
    if (!AutoSaveService.instance) {
      AutoSaveService.instance = new AutoSaveService();
    }
    return AutoSaveService.instance;
  }

  /**
   * Initialize the auto-save service
   */
  public initialize(language: 'en' | 'fr' = 'fr'): void {
    this.language = language;
    this.startAutoSaveTimer();
    
    console.log('🔄 Auto-save service initialized');
    
    // Setup beforeunload handler to save before page close/refresh
    window.addEventListener('beforeunload', this.handleBeforeUnload);
  }

  /**
   * Register a save callback for a specific data type
   */
  public registerSaveCallback(
    type: AutoSaveDataType,
    callback: (data: AutoSaveData) => Promise<void>
  ): void {
    this.saveCallbacks.set(type, callback);
  }

  /**
   * Queue data for auto-save
   */
  public queueSave(data: AutoSaveData): void {
    if (!this.isEnabled) return;

    const key = `${data.type}-${data.id || 'new'}`;
    this.pendingChanges.set(key, data);
    this.resetInactivityTimer();
    
    console.log(`📝 Queued ${data.operation} for ${data.type}:`, data.id);
  }

  /**
   * Force an immediate save of all pending changes
   */
  public async saveNow(): Promise<void> {
    if (this.pendingChanges.size === 0) return;
    
    const changes = Array.from(this.pendingChanges.values());
    this.pendingChanges.clear();
    
    try {
      // Group changes by type and process them
      const changesByType = new Map<AutoSaveDataType, AutoSaveData[]>();
      
      changes.forEach(change => {
        if (!changesByType.has(change.type)) {
          changesByType.set(change.type, []);
        }
        changesByType.get(change.type)!.push(change);
      });

      // Process each type of change
      for (const [type, typeChanges] of changesByType) {
        const callback = this.saveCallbacks.get(type);
        if (callback) {
          for (const change of typeChanges) {
            await callback(change);
          }
        }
      }
      
      this.lastSaveTime = Date.now();
      this.showSaveNotification(true, changes.length);
      
      console.log('✅ Auto-saved', changes.length, 'changes successfully');
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
      this.showSaveNotification(false, changes.length);
      
      // Re-queue failed changes
      changes.forEach(change => {
        const key = `${change.type}-${change.id || 'new'}`;
        this.pendingChanges.set(key, change);
      });
    }
  }

  /**
   * Enable or disable auto-save
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    
    if (enabled) {
      this.startAutoSaveTimer();
    } else {
      this.stopAutoSaveTimer();
    }
    
    console.log(`🔄 Auto-save ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Update the UI language
   */
  public setLanguage(language: 'en' | 'fr'): void {
    this.language = language;
  }

  /**
   * Get pending changes count
   */
  public getPendingChangesCount(): number {
    return this.pendingChanges.size;
  }

  /**
   * Clear all pending changes
   */
  public clearPendingChanges(): void {
    this.pendingChanges.clear();
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    // Save any pending changes before cleanup
    if (this.pendingChanges.size > 0) {
      this.saveNow();
    }
    
    this.stopAutoSaveTimer();
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    console.log('🧹 Auto-save service cleaned up');
  }

  /**
   * Start the auto-save timer
   */
  private startAutoSaveTimer(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    
    this.autoSaveTimer = setInterval(() => {
      if (this.isEnabled && this.pendingChanges.size > 0) {
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
      if (this.isEnabled && this.pendingChanges.size > 0) {
        this.saveNow();
      }
    }, INACTIVITY_TIMEOUT);
  }

  /**
   * Show a subtle notification about the save status
   */
  private showSaveNotification(success: boolean, changeCount: number): void {
    if (success) {
      toast(
        this.language === 'fr' 
          ? `${changeCount} modification${changeCount > 1 ? 's' : ''} sauvegardée${changeCount > 1 ? 's' : ''}` 
          : `${changeCount} change${changeCount > 1 ? 's' : ''} saved`,
        {
          icon: '✅',
          duration: 2000,
          style: {
            background: '#f0fdf4',
            color: '#166534',
            border: '1px solid #dcfce7'
          },
          position: 'bottom-right',
          id: 'auto-save-success'
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
          id: 'auto-save-error'
        }
      );
    }
  }

  /**
   * Handle beforeunload event to save before page close/refresh
   */
  private handleBeforeUnload = (event: BeforeUnloadEvent): void => {
    if (this.pendingChanges.size > 0) {
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
export const autoSaveService = AutoSaveService.getInstance();