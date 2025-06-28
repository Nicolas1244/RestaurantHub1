import toast from 'react-hot-toast';
import { Employee } from '../../types';
import { differenceInDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';

// CRITICAL: Toast notification service for elegant, non-intrusive alerts
export class ToastNotificationService {
  private static instance: ToastNotificationService;
  private activeNotifications = new Set<string>();
  private notificationTimers = new Map<string, NodeJS.Timeout>();

  private constructor() {}

  public static getInstance(): ToastNotificationService {
    if (!ToastNotificationService.instance) {
      ToastNotificationService.instance = new ToastNotificationService();
    }
    return ToastNotificationService.instance;
  }

  // CRITICAL: Contract end notifications with CHR compliance
  public checkContractEndNotifications(employees: Employee[], language: 'en' | 'fr' = 'fr'): void {
    const today = new Date();

    employees.forEach(employee => {
      if (employee.contractType === 'CDI' || !employee.endDate) return;

      const endDate = new Date(employee.endDate);
      const daysRemaining = differenceInDays(endDate, today);
      const notificationId = `contract-${employee.id}`;

      // Only show notifications for future end dates within notification period
      if (daysRemaining > 0 && daysRemaining <= (employee.notificationDays || 30)) {
        this.showContractEndNotification(employee, daysRemaining, language, notificationId);
      }
    });
  }

  // CRITICAL: Labor law compliance notifications
  public showLaborLawViolation(
    employeeName: string, 
    violationType: 'daily_rest' | 'weekly_rest' | 'max_hours' | 'consecutive_days',
    message: string,
    severity: 'critical' | 'warning' | 'info' = 'warning'
  ): void {
    const notificationId = `labor-${violationType}-${employeeName}`;
    
    if (this.activeNotifications.has(notificationId)) return;

    const icons = {
      daily_rest: '😴',
      weekly_rest: '📅',
      max_hours: '⏰',
      consecutive_days: '🔄'
    };

    const styles = {
      critical: {
        background: '#FEE2E2',
        border: '1px solid #FECACA',
        color: '#991B1B',
      },
      warning: {
        background: '#FEF3C7',
        border: '1px solid #FDE68A',
        color: '#92400E',
      },
      info: {
        background: '#DBEAFE',
        border: '1px solid #BFDBFE',
        color: '#1E40AF',
      }
    };

    // CRITICAL FIX: Ensure the icon is defined before concatenating with the message
    const icon = icons[violationType] || '';
    
    toast(
      `${icon} Code du travail: ${message}`,
      {
        duration: severity === 'critical' ? 10000 : 6000,
        id: notificationId,
        style: styles[severity],
      }
    );

    this.activeNotifications.add(notificationId);
    
    // Auto-remove from active set after duration
    const timer = setTimeout(() => {
      this.activeNotifications.delete(notificationId);
      this.notificationTimers.delete(notificationId);
    }, severity === 'critical' ? 10000 : 6000);
    
    this.notificationTimers.set(notificationId, timer);
  }

  // CRITICAL: Trial period notifications
  public showTrialPeriodNotification(
    employeeName: string,
    daysRemaining: number,
    language: 'en' | 'fr' = 'fr'
  ): void {
    const notificationId = `trial-${employeeName}`;
    
    if (this.activeNotifications.has(notificationId)) return;

    const message = language === 'fr' 
      ? `Période d'essai de ${employeeName} se termine dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`
      : `Trial period for ${employeeName} ends in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`;

    const severity = daysRemaining <= 3 ? 'critical' : daysRemaining <= 7 ? 'warning' : 'info';
    const icon = daysRemaining <= 3 ? '🚨' : daysRemaining <= 7 ? '⚠️' : 'ℹ️';

    const styles = {
      critical: {
        background: '#FEE2E2',
        border: '1px solid #FECACA',
        color: '#991B1B',
      },
      warning: {
        background: '#FEF3C7',
        border: '1px solid #FDE68A',
        color: '#92400E',
      },
      info: {
        background: '#DBEAFE',
        border: '1px solid #BFDBFE',
        color: '#1E40AF',
      }
    };

    toast(
      `${icon} ${message}`,
      {
        duration: severity === 'critical' ? 8000 : 5000,
        id: notificationId,
        style: styles[severity],
      }
    );

    this.activeNotifications.add(notificationId);
  }

  // CRITICAL: Success notifications for positive actions
  public showSuccessNotification(message: string, duration: number = 4000): void {
    toast.success(message, {
      duration,
      style: {
        background: '#D1FAE5',
        border: '1px solid #A7F3D0',
        color: '#065F46',
      },
    });
  }

  // CRITICAL: General info notifications
  public showInfoNotification(message: string, duration: number = 4000): void {
    toast(message, {
      duration,
      icon: 'ℹ️',
      style: {
        background: '#DBEAFE',
        border: '1px solid #BFDBFE',
        color: '#1E40AF',
      },
    });
  }

  // CRITICAL: Private method for contract end notifications
  private showContractEndNotification(
    employee: Employee,
    daysRemaining: number,
    language: 'en' | 'fr',
    notificationId: string
  ): void {
    if (this.activeNotifications.has(notificationId)) return;

    const endDate = this.formatDate(employee.endDate!, language);
    const employeeName = `${employee.firstName} ${employee.lastName}`;
    
    let message: string;
    let icon: string;
    let severity: 'critical' | 'warning' | 'info';
    let duration: number;

    if (daysRemaining <= 3) {
      // Critical: Contract ending in 3 days or less
      severity = 'critical';
      icon = '🚨';
      duration = 8000;
      message = language === 'fr'
        ? `Contrat de ${employeeName} se termine le ${endDate} (${daysRemaining} jour${daysRemaining > 1 ? 's' : ''})`
        : `Contract for ${employeeName} ends on ${endDate} (${daysRemaining} day${daysRemaining > 1 ? 's' : ''})`;
    } else if (daysRemaining <= 7) {
      // Warning: Contract ending within a week
      severity = 'warning';
      icon = '⚠️';
      duration = 6000;
      message = language === 'fr'
        ? `Contrat de ${employeeName} se termine le ${endDate} (${daysRemaining} jours)`
        : `Contract for ${employeeName} ends on ${endDate} (${daysRemaining} days)`;
    } else {
      // Info: Contract ending within notification period
      severity = 'info';
      icon = 'ℹ️';
      duration = 4000;
      message = language === 'fr'
        ? `Contrat de ${employeeName} se termine le ${endDate} (${daysRemaining} jours)`
        : `Contract for ${employeeName} ends on ${endDate} (${daysRemaining} days)`;
    }

    const styles = {
      critical: {
        background: '#FEE2E2',
        border: '1px solid #FECACA',
        color: '#991B1B',
      },
      warning: {
        background: '#FEF3C7',
        border: '1px solid #FDE68A',
        color: '#92400E',
      },
      info: {
        background: '#DBEAFE',
        border: '1px solid #BFDBFE',
        color: '#1E40AF',
      }
    };

    toast(
      `${icon} ${message}`,
      {
        duration,
        id: notificationId,
        style: styles[severity],
      }
    );

    this.activeNotifications.add(notificationId);
    
    // Auto-remove from active set after duration
    const timer = setTimeout(() => {
      this.activeNotifications.delete(notificationId);
      this.notificationTimers.delete(notificationId);
    }, duration);
    
    this.notificationTimers.set(notificationId, timer);
  }

  // CRITICAL: Format date according to language
  private formatDate(dateString: string, language: 'en' | 'fr'): string {
    const date = new Date(dateString);
    
    if (language === 'fr') {
      const formattedDate = format(date, 'd MMMM yyyy', { locale: fr });
      return formattedDate.replace(/\b\w/g, (char) => char.toUpperCase());
    } else {
      return format(date, 'MMM d, yyyy');
    }
  }

  // CRITICAL: Clear all active notifications
  public clearAllNotifications(): void {
    this.activeNotifications.clear();
    this.notificationTimers.forEach(timer => clearTimeout(timer));
    this.notificationTimers.clear();
    toast.dismiss();
  }

  // CRITICAL: Clear specific notification
  public clearNotification(notificationId: string): void {
    this.activeNotifications.delete(notificationId);
    const timer = this.notificationTimers.get(notificationId);
    if (timer) {
      clearTimeout(timer);
      this.notificationTimers.delete(notificationId);
    }
    toast.dismiss(notificationId);
  }
}

// CRITICAL: Export singleton instance
export const toastNotificationService = ToastNotificationService.getInstance();