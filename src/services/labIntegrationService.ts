import { MindrayClient, MindrayResult } from './mindrayIntegration';

export class LabIntegrationService {
  private mindrayClient: MindrayClient;

  constructor(mindrayHost: string = 'localhost', mindrayPort: number = 5100) {
    this.mindrayClient = new MindrayClient(mindrayHost, mindrayPort);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.mindrayClient.on('connected', () => {
      console.log('Mindray analyzer connected');
    });

    this.mindrayClient.on('error', (error) => {
      console.error('Mindray analyzer error:', error);
    });

    this.mindrayClient.on('result', (result: MindrayResult) => {
      console.log('Received result from Mindray:', result);
    });
  }

  async initialize(): Promise<void> {
    try {
      await this.mindrayClient.connect();
      console.log('Lab integration service initialized');
    } catch (error) {
      console.error('Failed to initialize lab integration:', error);
      throw error;
    }
  }

  async requestCBCResult(sampleId: string, testRequestId?: string): Promise<MindrayResult | null> {
    try {
      console.log(`Requesting CBC result for sample ID: ${sampleId}, testRequestId: ${testRequestId}`);
      
      // Only fetch real data from BC-10 device - no mock/random generation
      console.log(`Fetching real CBC data from BC-10 at ${this.mindrayClient.getConnectionStatus().host}:${this.mindrayClient.getConnectionStatus().port}`);
      let result: MindrayResult | null = null;
      
      try {
        // Only use real connection - no fallback to mock data
        result = await this.mindrayClient.requestResult(sampleId);
        if (!result) {
          throw new Error('No data received from BC-10 device');
        }
      } catch (error) {
        console.error('Failed to fetch real data from BC-10:', error);
        throw new Error(`Cannot retrieve sample ${sampleId} from BC-10 device: ${error.message}`);
      }
      
      if (result && result.testCode === 'CBC') {
        if (testRequestId) {
          try {
            // Save component values directly instead of updating the lab request
            const componentValues = this.mapResultsToComponents(result.components);
            await this.saveComponentValues(testRequestId, componentValues);
            console.log('CBC results saved successfully');
          } catch (error) {
            console.error('Error saving CBC results:', error);
            // Don't throw here, still return the result for UI display
          }
        }
        return result;
      }
      
      return null;
    } catch (error) {
      console.error('Error requesting CBC result:', error);
      throw error;
    }
  }

  private async updateTestRequestWithResults(testRequestId: string, result: MindrayResult): Promise<void> {
    try {
      // Update component values with Mindray results
      const updatedComponents = this.mapResultsToComponents(result.components);
      
      // Update the test request with results via API
      const response = await fetch(`/api/lab-requests/${testRequestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: 'completed',
          completedAt: new Date().toISOString(),
          results: {
            components: updatedComponents,
            analyzedBy: 'Mindray Analyzer',
            analyzedAt: result.timestamp,
            sampleId: result.sampleId
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update test request');
      }

      console.log(`Test request ${testRequestId} updated with Mindray results`);
    } catch (error) {
      console.error('Error updating test request:', error);
      throw error;
    }
  }

  private mapResultsToComponents(mindrayComponents: Array<{name: string; value: string; unit: string; flag?: string}>): Record<string, {value: string; remark: string}> {
    const componentValues: Record<string, {value: string; remark: string}> = {};
    
    for (const component of mindrayComponents) {
      // Determine remark based on flag
      let remark = '';
      if (component.flag) {
        switch (component.flag.toUpperCase()) {
          case 'H':
            remark = 'High';
            break;
          case 'L':
            remark = 'Low';
            break;
          case 'N':
          case '':
            remark = 'Normal';
            break;
          default:
            remark = component.flag;
        }
      }
      
      componentValues[component.name] = {
        value: component.value,
        remark: remark
      };
    }
    
    return componentValues;
  }

  async getConnectionStatus(): Promise<{connected: boolean; host: string; port: number}> {
    return this.mindrayClient.getConnectionStatus();
  }

  disconnect(): void {
    this.mindrayClient.disconnect();
  }

  // Method to save component values directly to SQL database (overwrites existing)
  async saveComponentValues(testRequestId: string, componentValues: Record<string, {value: string; remark: string}>): Promise<void> {
    try {
      // Always overwrite existing component values for stability
      const response = await fetch(`/api/lab-requests/${testRequestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          componentValues: componentValues,
          lastUpdated: new Date().toISOString(),
          status: 'partial', // Update status to indicate results are being entered
          mindrayImported: true, // Flag to indicate values came from Mindray
          mindrayImportedAt: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save component values');
      }

      console.log(`Component values overwritten for lab request ${testRequestId}`);
    } catch (error) {
      console.error('Error saving component values:', error);
      throw error;
    }
  }

  // Method to clear component values from database
  async clearComponentValues(testRequestId: string): Promise<void> {
    try {
      // Clear component values from database
      const response = await fetch(`/api/lab-requests/${testRequestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          componentValues: {},
          lastUpdated: new Date().toISOString(),
          status: 'pending', // Reset status
          mindrayImported: false,
          mindrayImportedAt: null
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to clear component values');
      }

      console.log(`Component values cleared for lab request ${testRequestId}`);
    } catch (error) {
      console.error('Error clearing component values:', error);
      throw error;
    }
  }

  // Method to get saved component values
  async getSavedComponentValues(testRequestId: string): Promise<Record<string, {value: string; remark: string}>> {
    try {
      const response = await fetch(`/api/lab-requests/${testRequestId}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.componentValues || {};
      }
      
      return {};
    } catch (error) {
      console.error('Error getting saved component values:', error);
      return {};
    }
  }
}
