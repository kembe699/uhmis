import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
// MySQL API imports - Firebase removed
// import { collection, addDoc, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
// import { db } from '@/lib/firebase';
import { DrugInventory, Dispensing, Patient } from '@/types';

// MySQL API Client for Pharmacy
class PharmacyApiClient {
  private baseUrl = 'http://localhost:3001/api/pharmacy';

  async getInventory(clinicId: string): Promise<DrugInventory[]> {
    try {
      console.log('Fetching inventory for clinic:', clinicId);
      const response = await fetch(`${this.baseUrl}/inventory/${clinicId}`);
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Failed to fetch inventory: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Inventory data received:', data);
      return data;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  }

  async addInventoryItem(item: any): Promise<any> {
    try {
      console.log('Sending inventory item to API:', item);
      const response = await fetch(`${this.baseUrl}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', response.status, errorText);
        throw new Error(`Failed to add inventory item: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      console.log('API Success Response:', result);
      return result;
    } catch (error) {
      console.error('Error adding inventory item:', error);
      throw error;
    }
  }

  async getPrescriptions(clinicId: string): Promise<any[]> {
    try {
      console.log('Fetching prescriptions for clinic:', clinicId);
      const response = await fetch(`${this.baseUrl}/prescriptions/${clinicId}`);
      console.log('Prescriptions response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Prescriptions response error:', errorText);
        throw new Error(`Failed to fetch prescriptions: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Prescriptions data received:', data);
      return data;
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      throw error;
    }
  }

  async updatePrescriptionStatus(prescriptionId: string, status: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/prescriptions/${prescriptionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update prescription status');
      return await response.json();
    } catch (error) {
      console.error('Error updating prescription status:', error);
      throw error;
    }
  }

  async updateInventoryItem(id: string, updates: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/inventory/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update inventory item');
      return await response.json();
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  }

  async getDispensingHistory(clinicId: string): Promise<Dispensing[]> {
    try {
      const response = await fetch(`${this.baseUrl}/dispensing/${clinicId}`);
      if (!response.ok) throw new Error('Failed to fetch dispensing history');
      return await response.json();
    } catch (error) {
      console.error('Error fetching dispensing history:', error);
      throw error;
    }
  }

  async addDispensingRecord(dispensing: any): Promise<any> {
    try {
      console.log('Adding dispensing record:', dispensing);
      const response = await fetch(`${this.baseUrl}/dispensing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dispensing),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', response.status, errorText);
        throw new Error(`Failed to add dispensing record: ${response.status} ${errorText}`);
      }
      const result = await response.json();
      console.log('Dispensing record created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error adding dispensing record:', error);
      throw error;
    }
  }


  async getPatients(clinicId: string): Promise<Patient[]> {
    try {
      const response = await fetch(`http://localhost:3001/api/patients/clinic/${clinicId}`);
      if (!response.ok) throw new Error('Failed to fetch patients');
      return await response.json();
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  }
}

const Pharmacy: React.FC = () => {
  const { user } = useAuth();
  
  // Initialize MySQL API client
  const pharmacyApi = new PharmacyApiClient();
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1>Pharmacy Management</h1>
        <p>Pharmacy functionality will be implemented here.</p>
      </div>
    </AppLayout>
  );
};

export default Pharmacy;
