// CRITICAL: POS Integration Service for Performance Dashboard
import { POSCredentials, POSData } from '../types';

export class POSIntegrationService {
  private static instance: POSIntegrationService;
  private credentials: Map<string, POSCredentials> = new Map();

  private constructor() {}

  public static getInstance(): POSIntegrationService {
    if (!POSIntegrationService.instance) {
      POSIntegrationService.instance = new POSIntegrationService();
    }
    return POSIntegrationService.instance;
  }

  // CRITICAL: L'Addition POS Integration (Priority)
  async connectLAddition(credentials: {
    apiKey: string;
    storeId: string;
    endpoint?: string;
  }): Promise<boolean> {
    try {
      console.log('🔌 Connecting to L\'Addition POS...');
      
      // CRITICAL: In production, this would make actual API calls to L'Addition
      // For now, we'll simulate the connection and store credentials
      const posCredentials: POSCredentials = {
        provider: 'laddition',
        apiKey: credentials.apiKey,
        storeId: credentials.storeId,
        endpoint: credentials.endpoint || 'https://api.laddition.com/v1',
        isActive: true,
        lastSync: new Date().toISOString()
      };

      // Validate credentials with test API call
      const isValid = await this.validateLAdditionCredentials(posCredentials);
      
      if (isValid) {
        this.credentials.set('laddition', posCredentials);
        console.log('✅ L\'Addition POS connected successfully');
        return true;
      } else {
        throw new Error('Invalid L\'Addition credentials');
      }
    } catch (error) {
      console.error('❌ L\'Addition connection failed:', error);
      throw error;
    }
  }

  // CRITICAL: Validate L'Addition credentials
  private async validateLAdditionCredentials(credentials: POSCredentials): Promise<boolean> {
    try {
      // CRITICAL: In production, make actual API call to validate
      /*
      const response = await fetch(`${credentials.endpoint}/auth/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          storeId: credentials.storeId
        })
      });
      
      return response.ok;
      */
      
      // For demo purposes, simulate validation
      await new Promise(resolve => setTimeout(resolve, 1000));
      return credentials.apiKey && credentials.storeId;
    } catch (error) {
      console.error('Credential validation failed:', error);
      return false;
    }
  }

  // CRITICAL: Fetch data from L'Addition POS
  async fetchLAdditionData(dateRange: { start: string; end: string }): Promise<POSData[]> {
    const credentials = this.credentials.get('laddition');
    if (!credentials || !credentials.isActive) {
      throw new Error('L\'Addition POS not connected');
    }

    try {
      console.log('📊 Fetching L\'Addition data for period:', dateRange);
      
      // CRITICAL: In production, make actual API calls
      /*
      const response = await fetch(`${credentials.endpoint}/sales/data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          storeId: credentials.storeId,
          startDate: dateRange.start,
          endDate: dateRange.end,
          includeHourly: true,
          includeCategories: true
        })
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      return this.transformLAdditionData(data);
      */
      
      // For demo purposes, generate realistic mock data
      return this.generateMockLAdditionData(dateRange);
    } catch (error) {
      console.error('❌ Failed to fetch L\'Addition data:', error);
      throw error;
    }
  }

  // CRITICAL: Transform L'Addition API response to our format
  private transformLAdditionData(apiData: any): POSData[] {
    // Transform the API response to match our POSData interface
    return apiData.sales.map((sale: any) => ({
      date: sale.date,
      turnover: sale.totalAmount,
      covers: sale.customerCount,
      averageCheck: sale.totalAmount / sale.customerCount,
      salesByHour: sale.hourlyBreakdown || {},
      salesByCategory: sale.categoryBreakdown || {},
      salesByService: {
        lunch: sale.lunchAmount || 0,
        dinner: sale.dinnerAmount || 0
      }
    }));
  }

  // CRITICAL: Generate realistic mock data for L'Addition
  private generateMockLAdditionData(dateRange: { start: string; end: string }): POSData[] {
    const data: POSData[] = [];
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      // Generate realistic restaurant data
      const baseTurnover = isWeekend ? 2800 : 2200;
      const variation = (Math.random() - 0.5) * 600;
      const turnover = Math.max(1000, baseTurnover + variation);
      
      const averageCheck = 35 + (Math.random() - 0.5) * 10;
      const covers = Math.round(turnover / averageCheck);
      
      // Generate hourly breakdown
      const salesByHour: Record<string, number> = {};
      const lunchHours = ['11', '12', '13', '14'];
      const dinnerHours = ['18', '19', '20', '21', '22'];
      
      let lunchTotal = 0;
      let dinnerTotal = 0;
      
      lunchHours.forEach(hour => {
        const amount = turnover * 0.4 * (0.15 + Math.random() * 0.2);
        salesByHour[hour] = amount;
        lunchTotal += amount;
      });
      
      dinnerHours.forEach(hour => {
        const amount = turnover * 0.6 * (0.15 + Math.random() * 0.25);
        salesByHour[hour] = amount;
        dinnerTotal += amount;
      });
      
      // Generate category breakdown
      const salesByCategory = {
        'Entrées': turnover * 0.15,
        'Plats': turnover * 0.45,
        'Desserts': turnover * 0.12,
        'Boissons': turnover * 0.28
      };
      
      data.push({
        date: date.toISOString().split('T')[0],
        turnover: Math.round(turnover),
        covers,
        averageCheck: Math.round(averageCheck * 100) / 100,
        salesByHour,
        salesByCategory,
        salesByService: {
          lunch: Math.round(lunchTotal),
          dinner: Math.round(dinnerTotal)
        }
      });
    }
    
    return data;
  }

  // CRITICAL: Future POS integrations (extensible design)
  async connectPOS(provider: 'lightspeed' | 'tiller' | 'square' | 'zettle', credentials: any): Promise<boolean> {
    console.log(`🔌 Connecting to ${provider} POS...`);
    
    // Placeholder for future integrations
    switch (provider) {
      case 'lightspeed':
        return this.connectLightspeed(credentials);
      case 'tiller':
        return this.connectTiller(credentials);
      case 'square':
        return this.connectSquare(credentials);
      case 'zettle':
        return this.connectZettle(credentials);
      default:
        throw new Error(`POS provider ${provider} not supported yet`);
    }
  }

  // CRITICAL: Placeholder methods for future POS integrations
  private async connectLightspeed(credentials: any): Promise<boolean> {
    // TODO: Implement Lightspeed integration
    console.log('Lightspeed integration coming soon...');
    return false;
  }

  private async connectTiller(credentials: any): Promise<boolean> {
    // TODO: Implement Tiller integration
    console.log('Tiller integration coming soon...');
    return false;
  }

  private async connectSquare(credentials: any): Promise<boolean> {
    // TODO: Implement Square integration
    console.log('Square integration coming soon...');
    return false;
  }

  private async connectZettle(credentials: any): Promise<boolean> {
    // TODO: Implement Zettle integration
    console.log('Zettle integration coming soon...');
    return false;
  }

  // CRITICAL: Get connection status
  getConnectionStatus(provider: string): POSCredentials | null {
    return this.credentials.get(provider) || null;
  }

  // CRITICAL: Disconnect POS
  async disconnectPOS(provider: string): Promise<void> {
    this.credentials.delete(provider);
    console.log(`🔌 Disconnected from ${provider} POS`);
  }

  // CRITICAL: Test connection
  async testConnection(provider: string): Promise<boolean> {
    const credentials = this.credentials.get(provider);
    if (!credentials) return false;

    try {
      switch (provider) {
        case 'laddition':
          return await this.validateLAdditionCredentials(credentials);
        default:
          return false;
      }
    } catch (error) {
      console.error(`Connection test failed for ${provider}:`, error);
      return false;
    }
  }

  // CRITICAL: Get all connected POS systems
  getConnectedSystems(): POSCredentials[] {
    return Array.from(this.credentials.values()).filter(cred => cred.isActive);
  }
}

// CRITICAL: Export singleton instance
export const posIntegrationService = POSIntegrationService.getInstance();