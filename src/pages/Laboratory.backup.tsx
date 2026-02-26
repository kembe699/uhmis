import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { LabRequest, LabResult, Patient, LabTest } from '@/types';
import { 
  FlaskConical, 
  Clock,
  Check,
  Loader2,
  Search,
  User,
  TestTube2,
  FileText,
  CalendarDays,
  Clock as ClockIcon,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Filter,
  Printer,
  X as XIcon,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { MindrayIntegration } from '@/components/lab/MindrayIntegration';

const Laboratory: React.FC = () => {
  const { user } = useAuth();
  const [labRequests, setLabRequests] = useState<LabRequest[]>([]);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientMap, setPatientMap] = useState<Record<string, Patient>>({});
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string>('');
  const [selectedPatientRequests, setSelectedPatientRequests] = useState<LabRequest[]>([]);
  const [selectedTestRequest, setSelectedTestRequest] = useState<LabRequest | null>(null);
  const [resultText, setResultText] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentView, setCurrentView] = useState<'list' | 'history'>('list');
  const [testName, setTestName] = useState('');
  const [dateRangeFrom, setDateRangeFrom] = useState<string>('');
  const [dateRangeTo, setDateRangeTo] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'partial' | 'completed'>('all');
  const [testComponents, setTestComponents] = useState<Array<{
    name: string;
    value: string;
    unit: string;
    normalRangeMin: string;
    normalRangeMax: string;
    normalRangeText: string;
    remark: string;
  }>>([]);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showSendBackDialog, setShowSendBackDialog] = useState(false);
  const [sendBackReason, setSendBackReason] = useState('');
  const [expandedPatients, setExpandedPatients] = useState<Set<string>>(new Set());
  const [showResultPreview, setShowResultPreview] = useState(false);
  const [previewRequest, setPreviewRequest] = useState<LabRequest | null>(null);
  const [previewResults, setPreviewResults] = useState<LabResult[]>([]);
  const [showMindrayModal, setShowMindrayModal] = useState(false);
  const [mindraySampleId, setMindraySampleId] = useState('');
  
  // Performance optimization - Cache frequently accessed data
  const [labRequestsCache, setLabRequestsCache] = useState<Map<string, LabRequest>>(new Map());
  const [patientsCache, setPatientsCache] = useState<Map<string, Patient>>(new Map());
  const [testConfigsCache, setTestConfigsCache] = useState<Map<string, LabTest>>(new Map());
  const [unsubscribers, setUnsubscribers] = useState<(() => void)[]>([]);

  // Optimized data loading with immediate UI response
  useEffect(() => {
    if (!user?.clinic) {
      setLoading(false);
      return;
    }

    // Preload ALL test configurations for instant loading
    fetch(`/api/lab-tests?clinic=${encodeURIComponent(user.clinic)}`, {
      credentials: 'include'
    }).then(response => response.json()).then(labTests => {
      const newCache = new Map(testConfigsCache);
      labTests.forEach((test: LabTest) => {
        const cacheKey = `${test.testName}_${user.clinic}`;
        newCache.set(cacheKey, test);
      });
      setTestConfigsCache(newCache);
      console.log(`Preloaded ${labTests.length} test configurations`);
    }).catch(error => {
      console.error('Error preloading test configurations:', error);
    });

    // Show UI immediately with cached data if available
    setLoading(false);
    
    const newUnsubscribers: (() => void)[] = [];

    // Load lab requests via API
    const loadLabRequests = async () => {
      try {
        const response = await fetch(`/api/lab-requests?clinic=${encodeURIComponent(user.clinic)}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch lab requests');
        }
        
        const requests = await response.json() as LabRequest[];
        setLabRequests(requests);
        
        // Update cache
        const requestsMap = new Map();
        requests.forEach(req => requestsMap.set(req.id, req));
        setLabRequestsCache(requestsMap);
        
        // Preload all patient data
        const patientIds = requests.map(req => req.patientId);
        if (patientIds.length > 0) {
          preloadPatientsOptimized(patientIds);
        }
      } catch (error) {
        console.error('Error loading lab requests:', error);
      }
    };

    loadLabRequests();

    const loadLabResults = async () => {
      try {
        const response = await fetch(`/api/lab-results?clinic=${encodeURIComponent(user.clinic)}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch lab results');
        }
        
        const results = await response.json() as LabResult[];
        setLabResults(results);
      } catch (error) {
        console.error('Error loading lab results:', error);
      }
    };

    loadLabResults();

    return () => {
      // Cleanup function (no longer needed for Firebase listeners)
    };
  }, [user?.clinic]);

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [unsubscribers]);

  // Ultra-fast patient preloading with aggressive caching
  const preloadPatientsOptimized = async (patientIds: string[]) => {
    const unique = Array.from(new Set(patientIds)).filter((id) => !patientsCache.has(id) && !patientMap[id]);
    if (unique.length === 0) return;

    try {
      // Smaller chunks for faster parallel processing
      const chunks = [];
      for (let i = 0; i < unique.length; i += 5) {
        chunks.push(unique.slice(i, i + 5));
      }

      const allPatients: Record<string, Patient> = {};
      const newPatientsCache = new Map(patientsCache);

      // Process chunks in parallel for maximum speed
      await Promise.all(chunks.map(async (chunk) => {
        const response = await fetch('/api/patients/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ patientIds: chunk }),
        });
        
        if (response.ok) {
          const patients = await response.json() as Patient[];
          patients.forEach((patient) => {
            allPatients[patient.id] = patient;
            newPatientsCache.set(patient.id, patient);
          });
        }
      }));

      if (Object.keys(allPatients).length > 0) {
        setPatientsCache(newPatientsCache);
        setPatientMap((prev) => ({ ...prev, ...allPatients }));
      }
    } catch (error) {
      console.error('Error preloading patients:', error);
    }
  };

  const preloadPatients = async (patientIds: string[]) => {
    return preloadPatientsOptimized(patientIds);
  };

  const fetchData = async () => {
    // This function is now deprecated in favor of real-time listeners
    // Keeping for backward compatibility but not using blocking loading
    return;
  };

  const fetchPatientRequests = async (patientId: string) => {
    if (!user?.clinic) return;
    
    try {
      // Use cached data first if available
      const cachedRequests = Array.from(labRequestsCache.values())
        .filter(req => req.patientId === patientId && ['pending', 'partial'].includes(req.status))
        .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
      
      if (cachedRequests.length > 0) {
        setSelectedPatientRequests(cachedRequests);
        const firstRequest = cachedRequests[0];
        setSelectedTestRequest(firstRequest);
        setTestName(firstRequest.testType);
        await handleTestNameChange(firstRequest.testType, firstRequest.id);
        return;
      }

      // Fallback to database query if not in cache
      const response = await fetch(`/api/lab-requests?clinic=${encodeURIComponent(user.clinic)}&patientId=${patientId}&status=pending,partial&limit=10`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch patient requests');
      }
      
      const patientRequests = await response.json() as LabRequest[];
      setSelectedPatientRequests(patientRequests);
      
      if (patientRequests.length > 0) {
        const firstRequest = patientRequests[0];
        setSelectedTestRequest(firstRequest);
        setTestName(firstRequest.testType);
        await handleTestNameChange(firstRequest.testType, firstRequest.id);
      } else {
        setSelectedTestRequest(null);
        setTestName('');
        setTestComponents([]);
      }
    } catch (error) {
      console.error('Error fetching patient requests:', error);
      toast.error('Failed to fetch patient tests');
    }
  };

  // Fetch ALL tests for a patient (not just pending/partial)
  const fetchAllPatientTests = async (patientId: string) => {
    if (!user?.clinic) return;
    
    try {
      // Use cached data first if available
      const cachedRequests = Array.from(labRequestsCache.values())
        .filter(req => req.patientId === patientId)
        .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
      
      if (cachedRequests.length > 0) {
        setSelectedPatientRequests(cachedRequests);
        return;
      }

      // Fallback to database query if not in cache
      const response = await fetch(`/api/lab-requests?clinic=${encodeURIComponent(user.clinic)}&patientId=${patientId}&limit=20`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch patient tests');
      }
      
      const patientRequests = await response.json() as LabRequest[];
      setSelectedPatientRequests(patientRequests);
      
    } catch (error) {
      console.error('Error fetching all patient tests:', error);
      toast.error('Failed to fetch patient test history');
    }
  };

  const fetchPatientDetails = async (patientId: string) => {
  try {
    // Check cache first
    if (patientsCache.has(patientId)) {
      const patient = patientsCache.get(patientId)!;
      setSelectedPatient(patient);
      setSelectedPatientId(patientId);
      setSelectedPatientName(patient.fullName);
      return;
    }

    // Check patientMap cache
    if (patientMap[patientId]) {
      const patient = patientMap[patientId];
      setSelectedPatient(patient);
      setSelectedPatientId(patientId);
      setSelectedPatientName(patient.fullName);
      patientsCache.set(patientId, patient); // Add to cache
      return;
    }

      // Fallback to database
      const response = await fetch(`/api/patients/${patientId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        setSelectedPatient(null);
        return;
      }
      
      const patient = await response.json() as Patient;
      setSelectedPatient(patient);
      setSelectedPatientId(patientId);
      setSelectedPatientName(patient.fullName);
      patientsCache.set(patientId, patient);
      setPatientMap(prev => ({ ...prev, [patientId]: patient }));
    } catch (error) {
      console.error('Error fetching patient details:', error);
      toast.error('Failed to fetch patient details');
    }
  };

  const handlePatientSelect = async (patientId: string, patientName: string) => {
    setSelectedPatientName(patientName);
    setSelectedPatient(null);
    setSelectedPatientRequests([]);
    setSelectedTestRequest(null);
    setTestName('');
    setTestComponents([]);
    setResultText('');
    
    await Promise.all([
      fetchPatientDetails(patientId),
      fetchPatientRequests(patientId)
    ]);
  };

  // Alias for backward compatibility
  const handleSelectPatient = handlePatientSelect;

  // Calculate remark based on numeric value and range
  const calculateRemark = (value: string, min: string, max: string): string => {
    if (!value.trim() || isNaN(Number(value))) return '';
    
    const numValue = parseFloat(value);
    const minValue = parseFloat(min);
    const maxValue = parseFloat(max);
    
    if (numValue < minValue) return 'Low';
    if (numValue > maxValue) return 'High';
    return 'Normal';
  };

  // Auto-save component values to database on blur
  const autoSaveComponentValue = async (requestId: string, componentName: string, value: string, remark: string) => {
    if (!user?.clinic) {
      console.log('Auto-save skipped: No clinic');
      return;
    }
    
    if (!value.trim()) {
      console.log('Auto-save skipped: Empty value');
      return;
    }
    
    console.log('Auto-saving component:', { requestId, componentName, value, remark });
    
    try {
      const componentData = {
        name: componentName,
        value: value,
        remark: remark,
        savedAt: new Date().toISOString()
      };
      
      // Auto-save component value via API
      const response = await fetch(`/api/lab-requests/${requestId}/auto-save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          componentName,
          componentValue: value,
          remark: remark
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to auto-save component');
      }
      
      console.log('Auto-saved component successfully');
      
      // Create new partial result for legacy compatibility
      const testRequest = selectedPatientRequests.find(req => req.id === requestId);
      if (testRequest) {
          const newDoc = await addDoc(collection(db, 'lab_results'), {
            requestId: requestId,
            patientId: testRequest.patientId,
            patientName: testRequest.patientName,
            visitId: testRequest.visitId,
            testType: testRequest.testType,
            componentValues: [componentData],
            performedBy: user.displayName,
            resultDate: new Date().toISOString(),
            clinic: user.clinic,
            isPartial: true,
            isAutoSaved: true,
            lastSavedAt: new Date().toISOString()
          });
          
          console.log('Created new auto-save document:', newDoc.id);
        } else {
          console.error('Test request not found for auto-save');
          return;
        }
      }
      
      toast.success(`${componentName}: ${value} ${remark ? `(${remark})` : ''} saved`);
    } catch (error) {
      console.error('Error auto-saving component value:', error);
      toast.error(`Failed to save ${componentName}`);
    }
  };

  // Handle blur event to save component value
  const handleComponentBlur = (index: number) => {
    const component = testComponents[index];
    
    if (!selectedTestRequest || !component.value.trim()) {
      return;
    }
    
    autoSaveComponentValue(
      selectedTestRequest.id,
      component.name,
      component.value,
      component.remark
    );
  };

  // Update component value and auto-calculate remarks (no save on change)
  const updateComponentValue = (index: number, field: string, value: string) => {
    // Check if test is completed and prevent editing
    if (selectedTestRequest?.status === 'completed') {
      toast.error('This test is completed. Please unlock it first to make changes.');
      return;
    }
    
    const updatedComponents = [...testComponents];
    updatedComponents[index] = { ...updatedComponents[index], [field]: value };
    
    // Auto-calculate remarks for numeric values
    if (field === 'value' && 
        updatedComponents[index].normalRangeMin && 
        updatedComponents[index].normalRangeMax) {
      const remark = calculateRemark(
        value, 
        updatedComponents[index].normalRangeMin, 
        updatedComponents[index].normalRangeMax
      );
      updatedComponents[index].remark = remark;
    }
    
    setTestComponents(updatedComponents);
  };

  // Load saved component values for a test with enhanced stability
  const loadSavedComponentValues = async (requestId: string): Promise<Record<string, { value: string; remark: string }>> => {
    if (!user?.clinic || !requestId) {
      console.log('Load saved values skipped: No clinic or requestId');
      return {};
    }
    
    console.log('Loading saved values for requestId:', requestId);
    
    try {
      // First check if component values are saved directly in the lab_requests document (Mindray integration)
      const labRequestRef = doc(db, 'lab_requests', requestId);
      const labRequestDoc = await getDoc(labRequestRef);
      
      if (labRequestDoc.exists()) {
        const labRequestData = labRequestDoc.data();
        if (labRequestData.componentValues) {
          console.log('Found component values in lab_requests:', labRequestData.componentValues);
          return labRequestData.componentValues;
        }
      }
      
      // Fallback to checking lab_results collection for manually entered values
      const resultsRef = collection(db, 'lab_results');
      
      // First try with isAutoSaved flag
      let q = query(
        resultsRef,
        where('requestId', '==', requestId),
        where('clinic', '==', user.clinic),
        where('isAutoSaved', '==', true)
      );
      
      let querySnapshot = await getDocs(q);
      console.log('Found auto-saved documents:', querySnapshot.size);
      
      // If no auto-saved results, try partial results
      if (querySnapshot.empty) {
        q = query(
          resultsRef,
          where('requestId', '==', requestId),
          where('clinic', '==', user.clinic),
          where('isPartial', '==', true)
        );
        querySnapshot = await getDocs(q);
        console.log('Found partial documents:', querySnapshot.size);
      }
      
      // If still no results, try any result for this request
      if (querySnapshot.empty) {
        q = query(
          resultsRef,
          where('requestId', '==', requestId),
          where('clinic', '==', user.clinic)
        );
        querySnapshot = await getDocs(q);
        console.log('Found any documents:', querySnapshot.size);
      }
      
      if (!querySnapshot.empty) {
        // Get the most recent document
        const resultDoc = querySnapshot.docs[0];
        const resultData = resultDoc.data();
        const componentValues = resultData.componentValues || [];
        
        console.log('Raw component values from DB:', componentValues);
        
        // Convert array to object for easy lookup
        const savedValues: Record<string, { value: string; remark: string }> = {};
        componentValues.forEach((comp: any) => {
          if (comp.name && (comp.value || comp.remark)) {
            savedValues[comp.name] = {
              value: comp.value || '',
              remark: comp.remark || ''
            };
          }
        });
        
        console.log('Processed saved values:', savedValues);
        return savedValues;
      } else {
        console.log('No saved values found for this request');
      }
    } catch (error) {
      console.error('Error loading saved component values:', error);
    }
    
    return {};
  };

  // Handle test name selection and load components from database with caching
  const handleTestNameChange = async (testName: string, requestId?: string) => {
    setTestName(testName);
    
    if (!testName || !user?.clinic) {
      setTestComponents([]);
      return;
    }
    
    // Use passed requestId or fall back to selectedTestRequest
    const activeRequestId = requestId || selectedTestRequest?.id;
    
    console.log('handleTestNameChange called with:', { testName, activeRequestId });
    
    // Show loading skeleton immediately for better UX
    const loadingSkeleton = [
      { name: 'Loading...', value: '', unit: '', normalRangeMin: '', normalRangeMax: '', normalRangeText: '', remark: '' },
      { name: 'Please wait...', value: '', unit: '', normalRangeMin: '', normalRangeMax: '', normalRangeText: '', remark: '' }
    ];
    setTestComponents(loadingSkeleton);
    
    try {
      // Check cache first for test configuration - this should be instant
      const cacheKey = `${testName}_${user.clinic}`;
      let testData = testConfigsCache.get(cacheKey);
      
      // If we have cached data, use it immediately
      if (testData) {
        const savedValues = activeRequestId ? await loadSavedComponentValues(activeRequestId) : {};
        
        const componentsWithSavedValues = testData.components.map(comp => {
          const saved = savedValues[comp.name];
          return {
            name: comp.name,
            value: saved?.value || '',
            unit: comp.unit,
            normalRangeMin: comp.normalRangeMin?.toString() || '',
            normalRangeMax: comp.normalRangeMax?.toString() || '',
            normalRangeText: comp.normalRangeText || (comp.normalRangeMin && comp.normalRangeMax ? 
              `${comp.normalRangeMin}-${comp.normalRangeMax} ${comp.unit}` : ''),
            remark: saved?.remark || ''
          };
        });
        
        setTestComponents(componentsWithSavedValues);
        return;
      }
      
      // Load saved values and test config in parallel for faster loading
      const [savedValuesPromise, testConfigPromise] = await Promise.all([
        activeRequestId ? loadSavedComponentValues(activeRequestId) : Promise.resolve({}),
        (async () => {
          // Query the lab_tests collection for the specific test
          const labTestsRef = collection(db, 'lab_tests');
          const q = query(
            labTestsRef,
            where('testName', '==', testName)
          );
          
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            // Use the first matching test configuration
            const testDoc = querySnapshot.docs[0];
            const data = testDoc.data() as LabTest;
            
            // Cache the test configuration
            const newCache = new Map(testConfigsCache);
            newCache.set(cacheKey, data);
            setTestConfigsCache(newCache);
            
            return data;
          }
          return null;
        })()
      ]);
      
      const savedValues = savedValuesPromise;
      testData = testConfigPromise;
      
      console.log('Loaded saved values in handleTestNameChange:', savedValues);
      
      if (testData && testData.components && testData.components.length > 0) {
        const componentsWithSavedValues = testData.components.map(comp => {
          const saved = savedValues[comp.name];
          const component = {
            name: comp.name,
            value: saved?.value || '',
            unit: comp.unit,
            normalRangeMin: comp.normalRangeMin?.toString() || '',
            normalRangeMax: comp.normalRangeMax?.toString() || '',
            normalRangeText: comp.normalRangeText || (comp.normalRangeMin && comp.normalRangeMax ? 
              `${comp.normalRangeMin}-${comp.normalRangeMax} ${comp.unit}` : ''),
            remark: saved?.remark || ''
          };
          console.log(`Component ${comp.name}:`, { saved, component });
          return component;
        });
        
        console.log('Setting test components with saved values:', componentsWithSavedValues);
        setTestComponents(componentsWithSavedValues);
      } else {
        // Fallback to hardcoded values if not found in database
        const fallbackRanges: Record<string, Array<{name: string; unit: string; min: number; max: number; text?: string}>> = {
          'Full Blood Count (CBC)': [
            { name: 'Hemoglobin', unit: 'g/dL', min: 12, max: 16 },
            { name: 'WBC Count', unit: '/µL', min: 4000, max: 11000 },
            { name: 'Platelets', unit: '/µL', min: 150000, max: 450000 },
            { name: 'Hematocrit', unit: '%', min: 36, max: 48 }
          ],
          'Blood Sugar (RBS)': [
            { name: 'Glucose', unit: 'mg/dL', min: 70, max: 100 }
          ],
          'Urinalysis': [
            { name: 'pH', unit: 'pH', min: 4.5, max: 8.0 },
            { name: 'Specific Gravity', unit: 'SG', min: 1.005, max: 1.030 },
            { name: 'Protein', unit: 'mg/dL', min: 0, max: 15 },
            { name: 'Glucose', unit: 'mg/dL', min: 0, max: 15 }
          ],
          'Widal Test': [
            { name: 'TO Titre', unit: '1:', min: 0, max: 80 },
            { name: 'TH Titre', unit: '1:', min: 0, max: 80 }
          ],
          'Renal Function Tests': [
            { name: 'Creatinine', unit: 'mg/dL', min: 0.4, max: 1.4 },
            { name: 'Urea', unit: 'mg/dL', min: 15, max: 45 },
            { name: 'BUN', unit: 'mg/dL', min: 7, max: 20 },
            { name: 'eGFR', unit: 'mL/min/1.73m²', min: 90, max: 120 }
          ]
        };

        const testConfig = fallbackRanges[testName];
        if (testConfig) {
          setTestComponents(testConfig.map(comp => {
            const saved = savedValues[comp.name];
            return {
              name: comp.name,
              value: saved?.value || '',
              unit: comp.unit,
              normalRangeMin: comp.min.toString(),
              normalRangeMax: comp.max.toString(),
              normalRangeText: comp.text || `${comp.min}-${comp.max} ${comp.unit}`,
              remark: saved?.remark || ''
            };
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching test configuration:', error);
      toast.error('Failed to load test configuration');
    }
  };

  // Handle partial result submission
  const handlePartialSave = async () => {
    if (!selectedTestRequest || !user?.clinic) return;
    
    setSaving(true);
    
    try {
      const currentPatientId = selectedTestRequest.patientId;
      let formattedResultText = '';
      
      // Format structured results - only include components with values
      const filledComponents = testComponents.filter(comp => comp.value.trim());
      
      if (filledComponents.length > 0) {
        const componentResults = filledComponents.map(comp => {
          const range = comp.normalRangeMin && comp.normalRangeMax 
            ? `${comp.normalRangeMin}-${comp.normalRangeMax} ${comp.unit}`
            : comp.normalRangeText || '';
          
          return `${comp.name}: ${comp.value} ${comp.unit} (Normal: ${range})${comp.remark ? ` - ${comp.remark}` : ''}`;
        });
        formattedResultText = componentResults.join('\n');
      } else {
        // Use free text if no components
        formattedResultText = resultText.trim();
        if (!formattedResultText) {
          toast.error('Please enter at least one result to save');
          setSaving(false);
          return;
        }
      }
      
      // Save lab result with partial status
      await addDoc(collection(db, 'lab_results'), {
        requestId: selectedTestRequest.id,
        patientId: selectedTestRequest.patientId,
        patientName: selectedTestRequest.patientName,
        visitId: selectedTestRequest.visitId,
        testType: selectedTestRequest.testType,
        results: formattedResultText,
        performedBy: user.displayName,
        resultDate: new Date().toISOString(),
        clinic: user.clinic,
        isPartial: true,
        totalComponents: testComponents.length,
        completedComponents: filledComponents.length
      });
      
      // Update lab request status to partial
      await updateDoc(doc(db, 'lab_requests', selectedTestRequest.id), {
        status: 'partial',
        lastSavedAt: new Date().toISOString(),
        savedBy: user.displayName
      });
      
      toast.success(`Partial result saved (${filledComponents.length}/${testComponents.length} components)`);
      
      // Update UI instantly without full page refresh
      // Update the selected test request status in local state
      setSelectedTestRequest(prev => prev ? { ...prev, status: 'partial' } : prev);
      
      // Update lab requests cache to reflect the new status
      const updatedRequest = { ...selectedTestRequest, status: 'partial' as const, lastSavedAt: new Date().toISOString(), savedBy: user.displayName };
      labRequestsCache.set(selectedTestRequest.id, updatedRequest);
      
      // Update the labRequests state to reflect changes
      setLabRequests(prev => prev.map(req => 
        req.id === selectedTestRequest.id 
          ? updatedRequest
          : req
      ));
      
      // Update selectedPatientRequests if this patient is selected
      if (selectedPatientId === currentPatientId) {
        setSelectedPatientRequests(prev => prev.map(req => 
          req.id === selectedTestRequest.id 
            ? updatedRequest
            : req
        ));
      }
    } catch (error) {
      console.error('Error saving partial result:', error);
      toast.error('Failed to save partial result');
    } finally {
      setSaving(false);
    }
  };

  // Handle unlocking completed test for editing
  const handleUnlockTest = async () => {
    if (!selectedTestRequest || !user?.clinic) return;
    
    setSaving(true);
    
    try {
      const currentPatientId = selectedTestRequest.patientId;
      
      // Update lab request status back to partial to allow editing
      await updateDoc(doc(db, 'lab_requests', selectedTestRequest.id), {
        status: 'partial',
        unlockedAt: new Date().toISOString(),
        unlockedBy: user.displayName
      });
      
      toast.success('Test unlocked for editing');
      
      // Update UI instantly without full page refresh
      // Update the selected test request status in local state
      setSelectedTestRequest(prev => prev ? { ...prev, status: 'partial' } : prev);
      
      // Update lab requests cache to reflect the new status
      const updatedRequest = { ...selectedTestRequest, status: 'partial' as const, unlockedAt: new Date().toISOString(), unlockedBy: user.displayName };
      labRequestsCache.set(selectedTestRequest.id, updatedRequest);
      
      // Update the labRequests state to reflect changes
      setLabRequests(prev => prev.map(req => 
        req.id === selectedTestRequest.id 
          ? updatedRequest
          : req
      ));
      
      // Update selectedPatientRequests if this patient is selected
      if (selectedPatientId === currentPatientId) {
        setSelectedPatientRequests(prev => prev.map(req => 
          req.id === selectedTestRequest.id 
            ? updatedRequest
            : req
        ));
      }
      
    } catch (error) {
      console.error('Error unlocking test:', error);
      toast.error('Failed to unlock test');
    } finally {
      setSaving(false);
    }
  };

  // Handle printing lab results as PDF for ALL patient tests
  const handlePrintResults = async () => {
    if (!selectedPatient) {
      toast.error('Please select a patient to print results');
      return;
    }

    try {
      // Fetch all lab results for the selected patient
      const allPatientResults = await fetchAllPatientResults(selectedPatientId);
      
      if (allPatientResults.length === 0) {
        toast.error('No completed test results found for this patient');
        return;
      }

      // Create a clean HTML template for all lab results
      const printContent = await generateAllLabResultsHTML(allPatientResults);
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Please allow popups to print results');
        return;
      }

      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Wait for content to load then print with proper error handling
      printWindow.onload = () => {
        try {
          // Small delay to ensure content is fully rendered
          setTimeout(() => {
            printWindow.print();
            // Don't auto-close, let user close manually to avoid runtime errors
          }, 100);
        } catch (error) {
          console.warn('Print operation failed:', error);
        }
      };

      // Handle case where onload doesn't fire
      setTimeout(() => {
        if (printWindow && !printWindow.closed) {
          try {
            printWindow.print();
          } catch (error) {
            console.warn('Fallback print operation failed:', error);
          }
        }
      }, 500);

      toast.success('Print dialog opened with all patient test results');
    } catch (error) {
      console.error('Error printing results:', error);
      toast.error('Failed to print results');
    }
  };

  // Fetch all lab results for a patient
  const fetchAllPatientResults = async (patientId: string) => {
    if (!user?.clinic) return [];

    try {
      const resultsRef = collection(db, 'lab_results');
      const q = query(
        resultsRef,
        where('patientId', '==', patientId),
        where('clinic', '==', user.clinic),
        orderBy('resultDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const results: any[] = [];
      
      for (const doc of querySnapshot.docs) {
        const resultData = doc.data();
        
        // Try to get component values if they exist
        let componentValues = [];
        if (resultData.componentValues && Array.isArray(resultData.componentValues)) {
          componentValues = resultData.componentValues;
        } else {
          // Try to fetch from auto-saved results
          const autoSavedQuery = query(
            resultsRef,
            where('requestId', '==', resultData.requestId),
            where('clinic', '==', user.clinic),
            where('isAutoSaved', '==', true)
          );
          
          const autoSavedSnapshot = await getDocs(autoSavedQuery);
          if (!autoSavedSnapshot.empty) {
            const autoSavedData = autoSavedSnapshot.docs[0].data();
            componentValues = autoSavedData.componentValues || [];
          }
        }
        
        results.push({
          id: doc.id,
          ...resultData,
          componentValues
        });
      }
      
      return results;
    } catch (error) {
      console.error('Error fetching patient results:', error);
      return [];
    }
  };

  // Generate clean HTML template for ALL lab results of a patient
  const generateAllLabResultsHTML = async (allResults: any[]) => {
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    
    // Calculate age from date of birth
    const calculateAge = (dateOfBirth: string) => {
      if (!dateOfBirth) return 'N/A';
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age + ' years';
    };

    // Generate test sections for all results
    const testSections = allResults.map(result => {
      let resultsTable = '';
      
      if (result.componentValues && result.componentValues.length > 0) {
        // Generate component-based results table
        resultsTable = result.componentValues.map((component: any) => {
          const normalRange = component.normalRangeMin && component.normalRangeMax 
            ? `${component.normalRangeMin} - ${component.normalRangeMax}`
            : component.normalRangeText || 'N/A';
          
          const resultStatus = component.remark || 'Normal';
          const statusColor = resultStatus === 'High' ? '#dc2626' : 
                             resultStatus === 'Low' ? '#ea580c' : '#16a34a';

          return `
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">${component.name}</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${component.value || '-'}</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${component.unit || ''}</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${normalRange}</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center; color: ${statusColor}; font-weight: bold;">${resultStatus}</td>
            </tr>
          `;
        }).join('');
      } else if (result.results) {
        // Generate text-based results
        const resultLines = result.results.split('\n');
        resultsTable = resultLines.map((line: string) => `
          <tr>
            <td colspan="5" style="padding: 8px; border: 1px solid #ddd;">${line}</td>
          </tr>
        `).join('');
      }

      return `
        <div class="test-section">
          <div class="test-header">
            ${result.testType}
            <span class="test-date">Performed: ${new Date(result.resultDate).toLocaleDateString()}</span>
          </div>
          <table class="results-table">
            <thead>
              <tr>
                <th>Test Parameter</th>
                <th>Result</th>
                <th>Unit</th>
                <th>Reference Range</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${resultsTable}
            </tbody>
          </table>
          <div class="test-footer">
            <span>Performed by: ${result.performedBy}</span>
          </div>
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Complete Lab Results - ${selectedPatient.fullName || selectedPatientName}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
            line-height: 1.4;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .clinic-name {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
          }
          .clinic-subtitle {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
          }
          .report-title {
            font-size: 18px;
            font-weight: bold;
            color: #1f2937;
            margin-top: 15px;
          }
          .patient-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
          }
          .info-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .info-label {
            font-weight: bold;
            color: #374151;
            min-width: 120px;
          }
          .info-value {
            color: #2563eb;
            font-weight: 500;
          }
          .test-section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          .test-header {
            background: #2563eb;
            color: white;
            padding: 12px;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .test-date {
            font-size: 12px;
            font-weight: normal;
          }
          .test-footer {
            background: #f1f5f9;
            padding: 8px 12px;
            font-size: 12px;
            color: #666;
            border: 1px solid #ddd;
            border-top: none;
          }
          .results-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 0;
          }
          .results-table th {
            background: #f1f5f9;
            padding: 12px 8px;
            border: 1px solid #ddd;
            font-weight: bold;
            text-align: center;
          }
          .results-table td {
            padding: 8px;
            border: 1px solid #ddd;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
          }
          .signature-section {
            text-align: center;
          }
          .signature-line {
            border-top: 1px solid #333;
            margin-top: 40px;
            padding-top: 5px;
            font-size: 12px;
          }
          .print-info {
            font-size: 10px;
            color: #666;
            text-align: right;
            margin-top: 20px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-name">${user?.clinic || 'Universal Hospital'}</div>
          <div class="clinic-subtitle">Health Management Information System</div>
          <div class="clinic-subtitle">Laboratory Services Department</div>
          <div class="report-title">COMPLETE LABORATORY RESULTS REPORT</div>
        </div>

        <div class="patient-info">
          <div class="info-group">
            <div class="info-item">
              <span class="info-label">Patient ID:</span>
              <span class="info-value">${selectedPatient.patientId || selectedPatientId}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Full Name:</span>
              <span class="info-value">${selectedPatient.fullName || selectedPatientName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Age:</span>
              <span class="info-value">${selectedPatient.dateOfBirth ? calculateAge(selectedPatient.dateOfBirth) : (selectedPatient.age ? selectedPatient.age + ' years' : 'N/A')}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Gender:</span>
              <span class="info-value">Female</span>
            </div>
          </div>
          <div class="info-group">
            <div class="info-item">
              <span class="info-label">Report Date:</span>
              <span class="info-value">${currentDate}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Report Time:</span>
              <span class="info-value">${currentTime}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Total Tests:</span>
              <span class="info-value">${allResults.length}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Clinic:</span>
              <span class="info-value">${user?.clinic || 'Universal Hospital'}</span>
            </div>
          </div>
        </div>

        ${testSections}

        <div class="footer">
          <div class="signature-section">
            <div class="signature-line">Laboratory Technician</div>
          </div>
          <div class="signature-section">
            <div class="signature-line">Medical Officer</div>
          </div>
        </div>

        <div class="print-info">
          Generated on ${currentDate} at ${currentTime} | ${user?.clinic || 'Universal Hospital'} HMIS
        </div>
      </body>
      </html>
    `;
  };

  // Generate clean HTML template for lab results
  const generateLabResultHTML = () => {
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    
    // Calculate age from date of birth
    const calculateAge = (dateOfBirth: string) => {
      if (!dateOfBirth) return 'N/A';
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age + ' years';
    };

    // Generate test results table
    const resultsTable = testComponents.map(component => {
      const normalRange = component.normalRangeMin && component.normalRangeMax 
        ? `${component.normalRangeMin} - ${component.normalRangeMax}`
        : component.normalRangeText || 'N/A';
      
      const resultStatus = component.remark || 'Normal';
      const statusColor = resultStatus === 'High' ? '#dc2626' : 
                         resultStatus === 'Low' ? '#ea580c' : '#16a34a';

      return `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${component.name}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${component.value || '-'}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${component.unit || ''}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${normalRange}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center; color: ${statusColor}; font-weight: bold;">${resultStatus}</td>
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Lab Result - ${selectedPatient.fullName || selectedPatientName}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
            line-height: 1.4;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .clinic-name {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
          }
          .clinic-subtitle {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
          }
          .report-title {
            font-size: 18px;
            font-weight: bold;
            color: #1f2937;
            margin-top: 15px;
          }
          .patient-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
          }
          .info-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .info-label {
            font-weight: bold;
            color: #374151;
            min-width: 120px;
          }
          .info-value {
            color: #2563eb;
            font-weight: 500;
          }
          .test-section {
            margin-bottom: 30px;
          }
          .test-header {
            background: #2563eb;
            color: white;
            padding: 12px;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 0;
          }
          .results-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .results-table th {
            background: #f1f5f9;
            padding: 12px 8px;
            border: 1px solid #ddd;
            font-weight: bold;
            text-align: center;
          }
          .results-table td {
            padding: 8px;
            border: 1px solid #ddd;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
          }
          .signature-section {
            text-align: center;
          }
          .signature-line {
            border-top: 1px solid #333;
            margin-top: 40px;
            padding-top: 5px;
            font-size: 12px;
          }
          .print-info {
            font-size: 10px;
            color: #666;
            text-align: right;
            margin-top: 20px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-name">${user?.clinic || 'Universal Hospital'}</div>
          <div class="clinic-subtitle">Health Management Information System</div>
          <div class="clinic-subtitle">Laboratory Services Department</div>
          <div class="report-title">LABORATORY RESULT REPORT</div>
        </div>

        <div class="patient-info">
          <div class="info-group">
            <div class="info-item">
              <span class="info-label">Patient ID:</span>
              <span class="info-value">${selectedPatient.patientId || selectedPatientId}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Full Name:</span>
              <span class="info-value">${selectedPatient.fullName || selectedPatientName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Age:</span>
              <span class="info-value">${selectedPatient.dateOfBirth ? calculateAge(selectedPatient.dateOfBirth) : (selectedPatient.age ? selectedPatient.age + ' years' : 'N/A')}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Gender:</span>
              <span class="info-value">Female</span>
            </div>
          </div>
          <div class="info-group">
            <div class="info-item">
              <span class="info-label">Test Date:</span>
              <span class="info-value">${new Date(selectedTestRequest.requestedAt).toLocaleDateString()}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Report Date:</span>
              <span class="info-value">${currentDate}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Report Time:</span>
              <span class="info-value">${currentTime}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Specimen:</span>
              <span class="info-value">Serum</span>
            </div>
          </div>
        </div>

        <div class="test-section">
          <div class="test-header">${selectedTestRequest.testType}</div>
          <table class="results-table">
            <thead>
              <tr>
                <th>Test Parameter</th>
                <th>Result</th>
                <th>Unit</th>
                <th>Reference Range</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${resultsTable}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <div class="signature-section">
            <div class="signature-line">Laboratory Technician</div>
          </div>
          <div class="signature-section">
            <div class="signature-line">Medical Officer</div>
          </div>
        </div>

        <div class="print-info">
          Generated on ${currentDate} at ${currentTime} | ${user?.clinic || 'Universal Hospital'} HMIS
        </div>
      </body>
      </html>
    `;
  };

  // Handle sending ALL patient test results to doctor for diagnosis
  const handleSendBackToDoctor = async () => {
    if (!selectedPatient || !selectedPatientRequests.length || !user?.clinic) {
      toast.error('Please select a patient with completed tests to send results');
      return;
    }

    // Note is now optional, so we can proceed without it
    const doctorNote = sendBackReason.trim() || 'Results completed and ready for review';

    try {
      // Update all pending lab requests for this patient to 'results_sent'
      const updatePromises = selectedPatientRequests.map(request => 
        updateDoc(doc(db, 'lab_requests', request.id), {
          status: 'results_sent',
          resultsSentAt: new Date().toISOString(),
          resultsSentBy: user.displayName,
          doctorNote: doctorNote,
          sentToDoctor: request.requestedBy || 'Doctor'
        })
      );

      await Promise.all(updatePromises);

      // Add notifications for all completed test results
      const notificationPromises = selectedPatientRequests.map(request =>
        addDoc(collection(db, 'lab_notifications'), {
          requestId: request.id,
          patientId: request.patientId,
          patientName: request.patientName,
          testType: request.testType,
          type: 'results_ready',
          message: `Lab results ready for review: ${doctorNote}`,
          completedBy: user.displayName,
          completedAt: new Date().toISOString(),
          clinic: user.clinic,
          read: false
        })
      );

      await Promise.all(notificationPromises);

      // Remove patient from queue since all tests are completed
      if (selectedPatient) {
        try {
          const queueRef = collection(db, 'patient_queue');
          const queueQuery = query(
            queueRef,
            where('patientId', '==', selectedPatient.patientId),
            where('clinic', '==', user.clinic),
            where('status', '==', 'waiting')
          );
          const queueSnapshot = await getDocs(queueQuery);
          
          const queueDeletePromises = queueSnapshot.docs.map(queueDoc => 
            deleteDoc(doc(db, 'patient_queue', queueDoc.id))
          );
          
          await Promise.all(queueDeletePromises);
          
          if (queueSnapshot.docs.length > 0) {
            console.log(`Removed ${queueSnapshot.docs.length} queue entries for patient ${selectedPatient.patientId}`);
          }
        } catch (queueError) {
          console.error('Error removing patient from queue:', queueError);
          // Don't fail the entire operation if queue removal fails
        }
      }

      toast.success(`Results for ${selectedPatientRequests.length} tests sent to doctor for diagnosis`);
      
      // Reset dialog state
      setShowSendBackDialog(false);
      setSendBackReason('');
      
      // Refresh data
      await fetchData();
      if (selectedPatientId) {
        await fetchPatientRequests(selectedPatientId);
      }
      
      // Clear selected test since they're now completed
      setSelectedTestRequest(null);
      setTestName('');
      setTestComponents([]);
      
    } catch (error) {
      console.error('Error sending results to doctor:', error);
      toast.error('Failed to send results to doctor');
    }
  };

  const handleSaveResult = async () => {
    if (!selectedTestRequest || !user?.clinic) return;
    
    setSaving(true);
    
    try {
      const currentPatientId = selectedTestRequest.patientId;
      let formattedResultText = '';
      
      // Format structured results
      if (testComponents.length > 0) {
        const allFilled = testComponents.every(comp => comp.value.trim());
        if (!allFilled) {
          toast.error('Please fill all component values or use Partial Save');
          setSaving(false);
          return;
        }
        const componentResults = testComponents.map(comp => {
          const range = comp.normalRangeMin && comp.normalRangeMax 
            ? `${comp.normalRangeMin}-${comp.normalRangeMax} ${comp.unit}`
            : comp.normalRangeText || '';
          
          return `${comp.name}: ${comp.value} ${comp.unit} (Normal: ${range})${comp.remark ? ` - ${comp.remark}` : ''}`;
        });
        formattedResultText = componentResults.join('\n');
      } else {
        // Use free text if no components
        formattedResultText = resultText.trim();
        if (!formattedResultText) {
          toast.error('Please enter test results');
          setSaving(false);
          return;
        }
      }
      
      // Save lab result
      await addDoc(collection(db, 'lab_results'), {
        requestId: selectedTestRequest.id,
        patientId: selectedTestRequest.patientId,
        patientName: selectedTestRequest.patientName,
        visitId: selectedTestRequest.visitId,
        testType: selectedTestRequest.testType,
        results: formattedResultText,
        performedBy: user.displayName,
        resultDate: new Date().toISOString(),
        clinic: user.clinic
      });
      
      // Update lab request status
      await updateDoc(doc(db, 'lab_requests', selectedTestRequest.id), {
        status: 'completed',
        completedAt: new Date().toISOString(),
        completedBy: user.displayName
      });
      
      toast.success('Lab result saved successfully');
      
      // Update UI instantly without full page refresh
      // Update the selected test request status in local state
      setSelectedTestRequest(prev => prev ? { ...prev, status: 'completed' } : prev);
      
      // Update lab requests cache to reflect the new status
      const updatedRequest = { ...selectedTestRequest, status: 'completed' as const, completedAt: new Date().toISOString(), completedBy: user.displayName };
      labRequestsCache.set(selectedTestRequest.id, updatedRequest);
      
      // Update the labRequests state to reflect changes
      setLabRequests(prev => prev.map(req => 
        req.id === selectedTestRequest.id 
          ? updatedRequest
          : req
      ));
      
      // Update selectedPatientRequests if this patient is selected
      if (selectedPatientId === currentPatientId) {
        setSelectedPatientRequests(prev => prev.map(req => 
          req.id === selectedTestRequest.id 
            ? updatedRequest
            : req
        ));
      }
      
      // Keep the test selected and parameters visible after completion
      // Don't clear the form - let user see the completed test results
      // setResultText('');
      // setTestComponents([]);
    } catch (error) {
      console.error('Error saving result:', error);
      toast.error('Failed to save result');
    } finally {
      setSaving(false);
    }
  };

  // Calculate statistics
  const pendingCount = useMemo(() => {
    return labRequests.filter(req => req.status === 'pending' || req.status === 'partial').length;
  }, [labRequests]);

  const completedTodayCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return labResults.filter(result => result.resultDate?.startsWith(today)).length;
  }, [labResults]);

  const urgentCount = useMemo(() => {
    return labRequests.filter(req => req.priority === 'urgent' && (req.status === 'pending' || req.status === 'partial')).length;
  }, [labRequests]);

  const totalPatientsCount = useMemo(() => {
    const uniquePatients = new Set(labRequests.map(req => req.patientId));
    return uniquePatients.size;
  }, [labRequests]);

  // Derived data
  const filteredPatientGroups = useMemo(() => {
    const groups = labRequests.reduce((acc, request) => {
      if (request.status === 'completed' || request.status === 'results_sent') return acc;
      
      const key = request.patientId;
      if (!acc[key]) {
        acc[key] = {
          patientId: request.patientId,
          patientName: request.patientName,
          requests: [],
          hasUrgent: false,
          earliestRequest: request.requestedAt
        };
      }
      
      acc[key].requests.push(request);
      if (request.priority === 'urgent') acc[key].hasUrgent = true;
      if (request.requestedAt < acc[key].earliestRequest) {
        acc[key].earliestRequest = request.requestedAt;
      }
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(groups)
      .filter((group: any) => {
        if (!patientSearch) return true;
        const patient = patientMap[group.patientId];
        return group.patientName.toLowerCase().includes(patientSearch.toLowerCase()) ||
               (patient?.patientId || '').toLowerCase().includes(patientSearch.toLowerCase());
      })
      .sort((a: any, b: any) => new Date(b.earliestRequest).getTime() - new Date(a.earliestRequest).getTime());
  }, [labRequests, patientSearch, patientMap]);

  const filteredRequests = useMemo(() => {
    return labRequests.filter(request => {
      if (statusFilter !== 'all' && request.status !== statusFilter) return false;
      if (dateRangeFrom && new Date(request.requestedAt) < new Date(dateRangeFrom)) return false;
      if (dateRangeTo && new Date(request.requestedAt) > new Date(dateRangeTo)) return false;
      return true;
    });
  }, [labRequests, statusFilter, dateRangeFrom, dateRangeTo]);

  // Filter historical tests based on date range and status - show only one row per patient
  const filteredHistoricalTests = useMemo(() => {
    const filtered = labRequests.filter(request => {
      const requestDate = new Date(request.requestedAt);
      
      // Date range filters - use the From/To dates if provided, otherwise show all dates
      if (dateRangeFrom) {
        const fromDate = new Date(dateRangeFrom + 'T00:00:00');
        if (requestDate < fromDate) return false;
      }
      
      if (dateRangeTo) {
        const toDate = new Date(dateRangeTo + 'T23:59:59');
        if (requestDate > toDate) return false;
      }
      
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'completed' && !['completed', 'results_sent'].includes(request.status)) {
          return false;
        } else if (statusFilter !== 'completed' && request.status !== statusFilter) {
          return false;
        }
      }
      
      // Search filter
      if (patientSearch) {
        const searchTerm = patientSearch.toLowerCase();
        const patient = patientMap[request.patientId];
        const patientIdMatch = (patient?.patientId || request.patientId).toLowerCase().includes(searchTerm);
        const patientNameMatch = request.patientName.toLowerCase().includes(searchTerm);
        const testTypeMatch = request.testType.toLowerCase().includes(searchTerm);
        
        if (!patientIdMatch && !patientNameMatch && !testTypeMatch) {
          return false;
        }
      }
      
      return true;
    }).sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

    // Group by patient and show only the most recent test for each patient
    const uniquePatients = new Map();
    filtered.forEach(request => {
      if (!uniquePatients.has(request.patientId)) {
        uniquePatients.set(request.patientId, request);
      }
    });
    
    return Array.from(uniquePatients.values())
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }, [labRequests, dateRangeFrom, dateRangeTo, statusFilter, patientSearch, patientMap]);

  // Group filtered requests by patient for Test History
  const groupedPatientRequests = useMemo(() => {
    const groups = filteredRequests.reduce((acc, request) => {
      const key = request.patientId;
      if (!acc[key]) {
        acc[key] = {
          patientId: request.patientId,
          patientName: request.patientName,
          requests: [],
          totalTests: 0,
          completedTests: 0,
          pendingTests: 0
        };
      }
      
      acc[key].requests.push(request);
      acc[key].totalTests++;
      
      if (request.status === 'completed' || request.status === 'results_sent') {
        acc[key].completedTests++;
      } else {
        acc[key].pendingTests++;
      }
      
      return acc;
    }, {} as Record<string, {
      patientId: string;
      patientName: string;
      requests: LabRequest[];
      totalTests: number;
      completedTests: number;
      pendingTests: number;
    }>);

    // Sort requests within each patient group by date (newest first)
    Object.values(groups).forEach(group => {
      group.requests.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
    });

    return Object.values(groups).sort((a, b) => {
      // Sort by most recent request time first (newest first)
      const aLatestRequest = Math.max(...a.requests.map(r => new Date(r.requestedAt).getTime()));
      const bLatestRequest = Math.max(...b.requests.map(r => new Date(r.requestedAt).getTime()));
      return bLatestRequest - aLatestRequest;
    });
  }, [filteredRequests]);

  // Toggle patient expansion
  const togglePatientExpansion = (patientId: string) => {
    const newExpanded = new Set(expandedPatients);
    if (newExpanded.has(patientId)) {
      newExpanded.delete(patientId);
    } else {
      newExpanded.add(patientId);
    }
    setExpandedPatients(newExpanded);
  };

  // Fetch and preview test results
  const handlePreviewResults = async (request: LabRequest) => {
    if (request.status === 'pending') {
      toast.info('Test results are not yet available');
      return;
    }

    try {
      const resultsRef = collection(db, 'lab_results');
      const resultsQuery = query(
        resultsRef,
        where('requestId', '==', request.id),
        where('clinic', '==', user?.clinic)
      );
      const resultsSnapshot = await getDocs(resultsQuery);
      const results = resultsSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Lab result data:', data); // Debug logging
        return {
          id: doc.id,
          ...data
        };
      }) as LabResult[];

      console.log('Fetched results:', results); // Debug logging
      setPreviewRequest(request);
      setPreviewResults(results);
      setShowResultPreview(true);
    } catch (error) {
      console.error('Error fetching test results:', error);
      toast.error('Failed to load test results');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="module-header">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Laboratory Management</h1>
            <p className="text-muted-foreground mt-1">
              Complete lab testing and result management system • {user?.clinic}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setCurrentView(currentView === 'list' ? 'history' : 'list')}
              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              {currentView === 'list' ? (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  View History
                </>
              ) : (
                <>
                  <FlaskConical className="w-4 h-4 mr-2" />
                  View Queue
                </>
              )}
            </Button>
          </div>
        </div>


        {/* Main Content */}
        <div className="flex flex-1 flex-col md:flex-row">
          <div className="flex gap-4 w-full">
            {/* Combined Patient Info and Queue Card */}
            <div className="w-full bg-card border border-border rounded-xl flex shadow-lg">
              {/* Selected Patient Section */}
              <div className="w-1/3 flex flex-col">
              {/* Patient Info Header - matches Patient Queue style */}
              <div className="p-4 bg-muted/30 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">Selected Patient</h2>
                <div className="mt-2 border-b border-border"></div>
              </div>
              <div className="p-4">
                {selectedPatient ? (
                  <div className="bg-white rounded-xl p-4 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="font-semibold text-gray-700">Name:</span>
                      <span className="text-gray-900 font-medium">{selectedPatientName}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="font-semibold text-gray-700">ID:</span>
                      <span className="text-blue-600 font-mono font-medium">{selectedPatient.patientId}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="font-semibold text-gray-700">Age:</span>
                      <span className="text-gray-900 font-medium">
                        {selectedPatient.dateOfBirth ? (
                          (() => {
                            const today = new Date();
                            const birthDate = new Date(selectedPatient.dateOfBirth);
                            let age = today.getFullYear() - birthDate.getFullYear();
                            const monthDiff = today.getMonth() - birthDate.getMonth();
                            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                              age--;
                            }
                            return age + ' years';
                          })()
                        ) : '-'}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="font-semibold text-gray-700">Sex:</span>
                      <span className="text-gray-900 font-medium">{selectedPatient.gender || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="font-semibold text-gray-700">Phone:</span>
                      <span className="text-gray-900 font-medium">{selectedPatient.phoneNumber || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="font-semibold text-gray-700">Occupation:</span>
                      <span className="text-gray-900 font-medium">{selectedPatient.occupation || 'None'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl p-4 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="font-semibold text-gray-700">Name:</span>
                      <span className="text-gray-400">-</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="font-semibold text-gray-700">ID:</span>
                      <span className="text-gray-400">-</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="font-semibold text-gray-700">Age:</span>
                      <span className="text-gray-400">-</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="font-semibold text-gray-700">Sex:</span>
                      <span className="text-gray-400">-</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="font-semibold text-gray-700">Phone:</span>
                      <span className="text-gray-400">-</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="font-semibold text-gray-700">Occupation:</span>
                      <span className="text-gray-400">-</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

              {/* Vertical Separator */}
              <div className="w-px bg-border"></div>

              {/* Patient Queue Section */}
              <div className="w-2/3 flex flex-col">
                <div className="flex justify-between items-center p-4 bg-muted/30 border-b border-border">
                      <h2 className="text-lg font-semibold text-foreground">Patient Queue</h2>
                      <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <Input 
                          className="w-48 h-10" 
                          placeholder="Search patients..."
                          value={patientSearch}
                          onChange={(e) => setPatientSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                          <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 sticky top-0">
                            <tr>
                              <th className="text-left py-2 px-6 font-bold text-sm text-blue-900">Queue #</th>
                              <th className="text-left py-2 px-6 font-bold text-sm text-blue-900">Patient ID</th>
                              <th className="text-left py-2 px-6 font-bold text-sm text-blue-900">Patient Name</th>
                              <th className="text-center py-2 px-6 font-bold text-sm text-blue-900">Requested</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {filteredPatientGroups.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="text-center py-16">
                                  <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                                    <FlaskConical className="w-8 h-8 text-blue-400" />
                                  </div>
                                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Tests</h3>
                                  <p className="text-gray-600">All laboratory requests have been completed.</p>
                                  <p className="text-sm text-gray-500 mt-1">New requests will appear here automatically.</p>
                                </td>
                              </tr>
                            ) : (
                              filteredPatientGroups.map((group: any, index: number) => (
                                <tr 
                                  key={group.patientId} 
                                  className={`hover:bg-blue-50 transition-all duration-200 cursor-pointer group ${
                                    selectedPatientId === group.patientId 
                                      ? 'bg-blue-100 border-l-4 border-l-blue-500 shadow-sm' 
                                      : 'hover:shadow-sm'
                                  }`}
                                  onClick={() => handleSelectPatient(group.patientId, group.patientName)}
                                >
                                  <td className="py-2 px-6">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        <span className="font-bold text-blue-700 text-sm">{index + 1}</span>
                                      </div>
                                      <span className="font-mono font-semibold text-gray-600 text-sm">
                                        #{7366 + index}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-2 px-6">
                                    <div className="font-mono font-bold text-sm bg-blue-50 px-2 py-1 rounded" style={{color: '#4BA7B7'}}>
                                      {patientMap[group.patientId]?.patientId || group.patientId.slice(-6)}
                                    </div>
                                  </td>
                                  <td className="py-2 px-6">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                        <User className="w-5 h-5 text-gray-500" />
                                      </div>
                                      <div>
                                        <div className="font-semibold group-hover:text-blue-700 transition-colors" style={{color: '#1F2937'}}>
                                          {group.patientName}
                                        </div>
                                        {group.hasUrgent && (
                                          <Badge variant="destructive" className="text-xs mt-1 animate-pulse">
                                            🚨 URGENT
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-2 px-6 text-center">
                                    <div className="text-sm font-medium text-gray-900">
                                      {new Date(group.earliestRequest).toLocaleDateString()} at {new Date(group.earliestRequest).toLocaleTimeString('en-US', { 
                                        hour12: true, 
                                        hour: 'numeric', 
                                        minute: '2-digit' 
                                      })}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                    </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tests and Results Row - Combined Card */}
          <div className="mt-4">
            <div className="flex bg-card border border-border rounded-xl shadow-lg">
              {/* Tests Section */}
              <div className="w-1/3 flex flex-col">
                <div className="p-4 bg-muted/30 border-b border-border">
                  <h2 className="text-lg font-semibold text-foreground">Tests</h2>
                  <div className="mt-2 border-b border-border"></div>
                </div>
              <div className="p-4 max-h-[600px] overflow-y-auto">
                <div className="space-y-2">
                  {selectedPatient && selectedPatientRequests.length > 0 ? (
                    Object.entries(
                      selectedPatientRequests.reduce((groups, request) => {
                        const date = new Date(request.requestedAt).toLocaleDateString();
                        if (!groups[date]) groups[date] = [];
                        groups[date].push(request);
                        return groups;
                      }, {} as Record<string, typeof selectedPatientRequests>)
                    )
                    .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
                    .map(([date, requests]) => (
                      <div key={date} className="mb-4">
                        <div className="text-sm font-semibold text-gray-600 mb-2 px-2 border-l-2 border-blue-200 bg-blue-50 py-1">
                          {date}
                        </div>
                        <div className="space-y-2 ml-2">
                          {requests.map((request) => (
                            <div
                              key={request.id}
                              onClick={() => {
                                setSelectedTestRequest(request);
                                setTestName(request.testType);
                                handleTestNameChange(request.testType, request.id);
                              }}
                              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                selectedTestRequest?.id === request.id
                                  ? 'bg-primary/10 border-primary/20'
                                  : 'bg-card border-border hover:bg-muted/50'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-foreground">{request.testType}</span>
                                <Badge 
                                  variant={request.priority === 'urgent' ? 'destructive' : 'outline'} 
                                  className={`text-xs ${
                                    request.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                    request.status === 'partial' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                    request.status === 'results_sent' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                    'bg-orange-50 text-orange-700 border-orange-200'
                                  }`}
                                >
                                  {request.priority === 'urgent' ? 'URGENT' : request.status.toUpperCase()}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>{new Date(request.requestedAt).toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <TestTube2 className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {selectedPatient ? 'No pending tests' : 'Select a patient to view tests'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              </div>

              {/* Vertical Separator */}
              <div className="w-px bg-border"></div>

              {/* Requested Tests and Results Section */}
              <div className="w-2/3 flex flex-col">
                <div className="p-4 bg-muted/30 border-b border-border">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-foreground">Requested Tests and Results</h2>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handlePrintResults}
                        disabled={!selectedPatient}
                        variant="outline"
                        size="sm"
                        className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                      </Button>
                      <Button 
                        onClick={() => setShowSendBackDialog(true)}
                        disabled={!selectedPatient || selectedPatientRequests.length === 0}
                        variant="outline"
                        size="sm"
                        className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Send Results to Doctor
                      </Button>
                    </div>
                  </div>

                  {/* Test Details - Always show the container */}
                  <div className="bg-white border border-border rounded-lg">
                    {selectedTestRequest ? (
                      <>
                        <div className="flex justify-between items-center p-4 bg-blue-50 border-b">
                          <div>
                            <span className="font-medium text-gray-700">Test: </span>
                            <span className="text-blue-600 font-medium">{selectedTestRequest.testType}</span>
                            <span className="ml-4 font-medium text-gray-700">Specimen: </span>
                            <span className="text-blue-600 font-medium">Serum</span>
                          </div>
                          {(selectedTestRequest.testType === 'Complete Blood Count' || 
                            selectedTestRequest.testType === 'CBC' || 
                            selectedTestRequest.testType.toLowerCase().includes('cbc') ||
                            selectedTestRequest.testType.toLowerCase().includes('complete blood count')) && (
                            <Button
                              onClick={() => setShowMindrayModal(true)}
                              variant="outline"
                              size="sm"
                              className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Get Results
                            </Button>
                          )}
                        </div>

                        <div className="p-4">
                          {/* Enhanced Test Components Table */}
                          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-blue-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FlaskConical className="w-5 h-5 text-blue-600" />
                                <h3 className="font-semibold text-gray-900">Test Parameters</h3>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button 
                                  onClick={handlePartialSave}
                                  disabled={saving || !selectedTestRequest || testComponents.every(comp => !comp.value.trim())}
                                  variant="outline"
                                  size="sm"
                                  className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
                                >
                                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Clock className="w-4 h-4 mr-2" />}
                                  Save Partial
                                </Button>
                                <Button 
                                  onClick={selectedTestRequest?.status === 'completed' ? handleUnlockTest : handleSaveResult}
                                  disabled={saving || !selectedTestRequest || (selectedTestRequest?.status !== 'completed' && testComponents.length === 0)}
                                  className={selectedTestRequest?.status === 'completed' 
                                    ? "bg-orange-600 hover:bg-orange-700 text-white" 
                                    : "bg-green-600 hover:bg-green-700 text-white"
                                  }
                                  size="sm"
                                >
                                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 
                                   selectedTestRequest?.status === 'completed' ? 
                                   <><Check className="w-4 h-4 mr-2" />Unlock</> : 
                                   <><Check className="w-4 h-4 mr-2" />Complete Test</>}
                                </Button>
                              </div>
                            </div>
                          </div>
                          <div className="overflow-x-auto h-[32rem] overflow-y-auto">
                            <table className="w-full">
                              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                                <tr>
                                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 border-r border-gray-200">Parameter</th>
                                  <th className="px-4 py-2 text-center text-sm font-semibold text-gray-900 border-r border-gray-200">Reference Range</th>
                                  <th className="px-4 py-2 text-center text-sm font-semibold text-gray-900 border-r border-gray-200">Units</th>
                                  <th className="px-4 py-2 text-center text-sm font-semibold text-gray-900 border-r border-gray-200">Result Value</th>
                                  <th className="px-4 py-2 text-center text-sm font-semibold text-gray-900 border-r border-gray-200">Interpretation</th>
                                  <th className="px-4 py-2 text-center text-sm font-semibold text-gray-900">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {testComponents.length > 0 ? (
                                  testComponents.map((component, index) => (
                                    <tr key={index} className={`hover:bg-gray-50 transition-colors ${
                                      component.value ? 'bg-blue-50/30' : ''
                                    }`}>
                                      <td className="px-4 py-2 border-r border-gray-200">
                                        <div className="flex items-center gap-2">
                                          <div className={`w-2 h-2 rounded-full ${
                                            component.value ? 'bg-blue-500' : 'bg-gray-300'
                                          }`} />
                                          <span className={`text-sm font-medium ${
                                            component.value ? 'text-blue-900' : 'text-gray-700'
                                          }`}>
                                            {component.name}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-2 text-center border-r border-gray-200">
                                        <span className="text-sm text-gray-600 font-mono">
                                          {component.normalRangeMin} - {component.normalRangeMax}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2 text-center border-r border-gray-200">
                                        <span className="text-sm text-gray-600 font-medium">
                                          {component.unit}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2 border-r border-gray-200">
                                        <div className="flex justify-center">
                                          <Input
                                            type="text"
                                            value={component.value}
                                            onChange={(e) => updateComponentValue(index, 'value', e.target.value)}
                                            onBlur={() => handleComponentBlur(index)}
                                            className={`w-24 h-9 text-center text-sm font-medium border-2 focus:border-blue-500 ${
                                              selectedTestRequest?.status === 'completed' ? 'bg-gray-100 cursor-not-allowed' : ''
                                            }`}
                                            placeholder="Enter value"
                                            disabled={selectedTestRequest?.status === 'completed'}
                                          />
                                        </div>
                                      </td>
                                      <td className="px-4 py-2 border-r border-gray-200">
                                        <div className="flex justify-center">
                                          <select 
                                            className={`w-24 h-9 text-sm border-2 rounded-md text-center font-medium ${
                                              component.remark === 'High' ? 'border-red-300 bg-red-50 text-red-700' :
                                              component.remark === 'Low' ? 'border-orange-300 bg-orange-50 text-orange-700' :
                                              component.remark === 'Normal' ? 'border-green-300 bg-green-50 text-green-700' :
                                              'border-gray-300 bg-white text-gray-600'
                                            } ${selectedTestRequest?.status === 'completed' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                            value={component.remark || ''}
                                            onChange={(e) => updateComponentValue(index, 'remark', e.target.value)}
                                            onBlur={() => handleComponentBlur(index)}
                                            disabled={selectedTestRequest?.status === 'completed'}
                                          >
                                            <option value="">Select</option>
                                            <option value="Normal">Normal</option>
                                            <option value="High">High</option>
                                            <option value="Low">Low</option>
                                          </select>
                                        </div>
                                      </td>
                                      <td className="px-4 py-2">
                                        <div className="flex justify-center">
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className={`text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors ${
                                              selectedTestRequest?.status === 'completed' ? 'cursor-not-allowed opacity-50' : ''
                                            }`}
                                            onClick={() => {
                                              if (selectedTestRequest?.status === 'completed') {
                                                toast.error('This test is completed. Please unlock it first to make changes.');
                                                return;
                                              }
                                              updateComponentValue(index, 'value', '');
                                              updateComponentValue(index, 'remark', '');
                                              toast.success(`${component.name} cleared`);
                                            }}
                                            disabled={selectedTestRequest?.status === 'completed'}
                                          >
                                            <XIcon className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center">
                                      <div className="flex flex-col items-center gap-3">
                                        <div className="bg-gray-100 rounded-full p-4">
                                          <TestTube2 className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <div>
                                          <p className="text-gray-600 font-medium">No test selected</p>
                                          <p className="text-sm text-gray-500">Choose a test from the sidebar to begin</p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                          </div>
                        </div>
                      </>
                    ) : (
                    <div className="p-12 text-center">
                      <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6">
                        <TestTube2 className="w-12 h-12 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Test Selected</h3>
                      <p className="text-gray-600 mb-4">Choose a patient and test from the sidebar to begin entering results</p>
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>Ready to process lab results</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Send Back to Doctor Dialog */}
        {showSendBackDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center gap-3 mb-4">
                <Check className="h-6 w-6 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900">Send Results to Doctor</h3>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Patient: <span className="font-medium text-blue-600">{selectedPatientName}</span>
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  Results to send: <span className="font-medium text-blue-600">{selectedPatientRequests.length} test(s)</span>
                </p>
                <div className="p-4 border-b border-border">
                  <p className="text-xs text-gray-500 mb-2">Completed test results for this patient:</p>
                  <ul className="space-y-1">
                    {selectedPatientRequests.map((request, index) => (
                      <li key={request.id} className="text-sm text-blue-600 flex items-center gap-2">
                        <span className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        {request.testType}
                        {request.priority === 'urgent' && (
                          <span className="text-xs bg-red-100 text-red-600 px-1 rounded">Urgent</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mb-4">
                <Label htmlFor="sendBackReason" className="text-sm font-medium text-gray-700 mb-2 block">
                  Note for doctor (optional)
                </Label>
                <select
                  id="sendBackReason"
                  value={sendBackReason}
                  onChange={(e) => setSendBackReason(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a note...</option>
                  <option value="All results completed and reviewed">All results completed and reviewed</option>
                  <option value="Results ready for clinical interpretation">Results ready for clinical interpretation</option>
                  <option value="Urgent results - immediate attention required">Urgent results - immediate attention required</option>
                  <option value="Results within normal limits">Results within normal limits</option>
                  <option value="Abnormal results detected - please review">Abnormal results detected - please review</option>
                  <option value="Follow-up tests may be required">Follow-up tests may be required</option>
                  <option value="Results correlate with clinical presentation">Results correlate with clinical presentation</option>
                  <option value="Quality assured - results verified">Quality assured - results verified</option>
                  <option value="Complete workup finished">Complete workup finished</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSendBackDialog(false);
                    setSendBackReason('');
                  }}
                  className="px-4 py-2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendBackToDoctor}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2"
                >
                  Send Results
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Mindray Results Modal */}
        {showMindrayModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center gap-3 mb-4">
                <Download className="h-6 w-6 text-green-500" />
                <h3 className="text-lg font-semibold text-gray-900">Get CBC Results</h3>
              </div>
              
              <div className="mb-4">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Sample ID</Label>
                <Input
                  type="text"
                  placeholder="Enter sample ID..."
                  value={mindraySampleId}
                  onChange={(e) => setMindraySampleId(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowMindrayModal(false);
                    setMindraySampleId('');
                  }}
                  className="px-4 py-2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (!mindraySampleId.trim()) {
                      toast.error('Please enter a sample ID');
                      return;
                    }
                    
                    // Simulate Mindray integration fetch
                    toast.success(`Fetching results for sample: ${mindraySampleId}`);
                    
                    // Here you would integrate with actual Mindray API
                    // For now, we'll simulate the process
                    setTimeout(() => {
                      toast.success('CBC results imported successfully');
                      setShowMindrayModal(false);
                      setMindraySampleId('');
                    }, 2000);
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Fetch
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Historical Lab Tests Section */}
        <div className="mt-8 bg-card rounded-xl border border-border shadow-sm">
          <div className="p-6 border-b border-border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-foreground">Historical Lab Tests</h2>
              <div className="flex items-center gap-4">
                {/* Search Filter */}
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Search:</Label>
                  <Input
                    type="text"
                    placeholder="Patient name, ID, or test type..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="w-60"
                  />
                </div>
                {/* Date Filter */}
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">From:</Label>
                  <Input
                    type="date"
                    value={dateRangeFrom}
                    onChange={(e) => setDateRangeFrom(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">To:</Label>
                  <Input
                    type="date"
                    value={dateRangeTo}
                    onChange={(e) => setDateRangeTo(e.target.value)}
                    className="w-40"
                  />
                </div>
                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Status:</Label>
                  <Select value={statusFilter} onValueChange={(value: 'all' | 'pending' | 'partial' | 'completed') => setStatusFilter(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Historical Tests Table */}
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="text-left py-2 px-6 font-semibold text-base text-gray-700">Patient ID</th>
                  <th className="text-left py-2 px-6 font-semibold text-base text-gray-700">Patient Name</th>
                  <th className="text-center py-2 px-6 font-semibold text-base text-gray-700">Requested By</th>
                  <th className="text-left py-2 px-6 font-semibold text-base text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredHistoricalTests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12">
                      <div className="flex flex-col items-center">
                        <FileText className="w-12 h-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Historical Tests Found</h3>
                        <p className="text-gray-600">No lab tests match the current filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredHistoricalTests.map((request) => (
                    <tr 
                      key={request.id} 
                      className="hover:bg-blue-50 transition-colors cursor-pointer"
                      onClick={async () => {
                        // Always populate Selected Patient section with full patient data
                        const patient = patientMap[request.patientId];
                        if (patient) {
                          setSelectedPatient(patient);
                          setSelectedPatientId(request.patientId);
                          setSelectedPatientName(request.patientName);
                          
                          // Fetch all tests for this patient (not just pending)
                          await fetchAllPatientTests(request.patientId);
                        }
                        
                        // Then handle the specific test action
                        if (request.status === 'pending') {
                          setSelectedTestRequest(request);
                          setTestName(request.testType);
                          handleTestNameChange(request.testType, request.id);
                        } else if (request.status === 'partial') {
                          setSelectedTestRequest(request);
                          setTestName(request.testType);
                          handleTestNameChange(request.testType, request.id);
                        } else {
                          // For completed tests, just select the patient (no modal)
                          // handlePreviewResults(request); // Removed modal functionality
                        }
                      }}
                    >
                      <td className="py-2 px-6">
                        <div className="text-base font-mono font-medium" style={{color: '#4BA7B7'}}>
                          {patientMap[request.patientId]?.patientId || request.patientId.slice(-6)}
                        </div>
                      </td>
                      <td className="py-2 px-6">
                        <div className="text-base font-medium" style={{color: '#1F2937'}}>
                          {request.patientName.split(' ').map(name => name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()).join(' ')}
                        </div>
                      </td>
                      <td className="py-2 px-6 text-center">
                        <div className="text-base text-gray-600">{request.requestedBy}</div>
                      </td>
                      <td className="py-2 px-6">
                        <div className="text-base font-medium text-gray-900">
                          {new Date(request.requestedAt).toLocaleDateString()} at {new Date(request.requestedAt).toLocaleTimeString('en-US', {
                            hour12: true,
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Laboratory;
