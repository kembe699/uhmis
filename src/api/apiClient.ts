/**
 * API client for communicating with the MySQL backend
 * This replaces direct Sequelize usage in the browser
 */

import { User, Patient, LabTest, Visit, Diagnosis, DrugInventory } from "@/types";

// Base API client for common operations
class BaseApiClient<T> {
  private readonly endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  // Generic API call wrapper
  protected async fetchApi(path: string = "", options: RequestInit = {}): Promise<any> {
    const url = `/api/${this.endpoint}${path}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error in ${this.endpoint} API call:`, error);
      throw error;
    }
  }

  // Standard CRUD operations
  async findById(id: string): Promise<T | null> {
    return this.fetchApi(`/${id}`);
  }

  async findAll(): Promise<T[]> {
    return this.fetchApi();
  }

  async create(data: Partial<T>): Promise<T> {
    return this.fetchApi("", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async update(id: string, data: Partial<T>): Promise<boolean> {
    await this.fetchApi(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return true;
  }

  async delete(id: string): Promise<boolean> {
    await this.fetchApi(`/${id}`, {
      method: "DELETE",
    });
    return true;
  }
}

// User API client
export class UserApiClient extends BaseApiClient<User> {
  constructor() {
    super("users");
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.fetchApi(`/email/${email}`);
  }

  async findByClinic(clinicId: number): Promise<User[]> {
    return this.fetchApi(`/clinic/${clinicId}`);
  }
}

// Patient API client
export class PatientApiClient extends BaseApiClient<Patient> {
  constructor() {
    super("patients");
  }

  async findByClinic(clinicId: number): Promise<Patient[]> {
    return this.fetchApi(`/clinic/${clinicId}`);
  }

  async searchByName(query: string): Promise<Patient[]> {
    return this.fetchApi(`/search?q=${encodeURIComponent(query)}`);
  }
}

// Lab test API client
export class LabTestApiClient extends BaseApiClient<LabTest> {
  constructor() {
    super("lab-tests");
  }

  async findByClinic(clinicId: number): Promise<LabTest[]> {
    return this.fetchApi(`/clinic/${clinicId}`);
  }

  async findByCategory(category: string): Promise<LabTest[]> {
    return this.fetchApi(`/category/${encodeURIComponent(category)}`);
  }
}

// Visit API client
export class VisitApiClient extends BaseApiClient<Visit> {
  constructor() {
    super("visits");
  }

  async findByPatient(patientId: string): Promise<Visit[]> {
    return this.fetchApi(`/patient/${patientId}`);
  }
}

// Diagnosis API client
export class DiagnosisApiClient extends BaseApiClient<Diagnosis> {
  constructor() {
    super("diagnoses");
  }

  async findByPatient(patientId: string): Promise<Diagnosis[]> {
    return this.fetchApi(`/patient/${patientId}`);
  }
}

// Drug inventory API client
export class DrugInventoryApiClient extends BaseApiClient<DrugInventory> {
  constructor() {
    super("drug-inventory");
  }

  async findByClinic(clinicId: number): Promise<DrugInventory[]> {
    return this.fetchApi(`/clinic/${clinicId}`);
  }
}

// Export API clients
export const userApi = new UserApiClient();
export const patientApi = new PatientApiClient();
export const labTestApi = new LabTestApiClient();
export const visitApi = new VisitApiClient();
export const diagnosisApi = new DiagnosisApiClient();
export const drugInventoryApi = new DrugInventoryApiClient();
