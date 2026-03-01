import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext.mysql.pure';
import { Plus, Trash2, Edit, Wrench, X, Search, Download, Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';
// Import the ClinicalApiClient from Clinical.tsx temporarily
// In production, this should be moved to a separate API module
class ClinicalApiClient {
  private baseUrl = '/api/clinical';

  async getServices(clinicId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/services/${clinicId}`);
      if (!response.ok) throw new Error('Failed to fetch services');
      return await response.json();
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  }

  async createService(serviceData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData),
      });
      if (!response.ok) throw new Error('Failed to create service');
      return await response.json();
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  }

  async updateService(serviceId: string, serviceData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/services/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData),
      });
      if (!response.ok) throw new Error('Failed to update service');
      return await response.json();
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  }

  async deleteService(serviceId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/services/${serviceId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete service');
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  }
}

const clinicalApi = new ClinicalApiClient();

interface Service {
  id: string;
  service_name: string;
  category: string;
  price: number;
  description?: string;
  is_active: boolean;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

const serviceCategories = [
  'Consultation',
  'Procedure',
  'Surgery',
  'Diagnostic',
  'Therapy',
  'Emergency',
  'Other'
];

// Flexible category matching - maps variations to standard names
const normalizeCategory = (input: string): string | null => {
  const normalized = input.toLowerCase().trim();
  
  // Direct match (case-insensitive)
  const directMatch = serviceCategories.find(cat => cat.toLowerCase() === normalized);
  if (directMatch) return directMatch;
  
  // Fuzzy matching for common variations
  if (normalized.includes('consult')) {
    return 'Consultation';
  }
  if (normalized.includes('surgery') || normalized.includes('surgical') || normalized.includes('operation')) {
    return 'Surgery';
  }
  if (normalized.includes('procedure') || normalized.includes('treatment') || normalized.includes('ward') || 
      normalized.includes('room') || normalized.includes('bed') || normalized.includes('admission') ||
      normalized.includes('stitch') || normalized.includes('dress') || normalized.includes('wound')) {
    return 'Procedure';
  }
  if (normalized.includes('diagnostic') || normalized.includes('test') || normalized.includes('scan') || 
      normalized.includes('imaging') || normalized.includes('x-ray') || normalized.includes('ultrasound') ||
      normalized.includes('lab') || normalized.includes('blood')) {
    return 'Diagnostic';
  }
  if (normalized.includes('therapy') || normalized.includes('rehab') || normalized.includes('physiotherapy') ||
      normalized.includes('counseling')) {
    return 'Therapy';
  }
  if (normalized.includes('emergency') || normalized.includes('urgent') || normalized.includes('er') ||
      normalized.includes('trauma')) {
    return 'Emergency';
  }
  
  // Default fallback to Other
  return 'Other';
};

const departments = [
  'General Medicine',
  'Pediatrics',
  'Surgery',
  'Obstetrics & Gynecology',
  'Orthopedics',
  'Cardiology',
  'Dermatology',
  'Psychiatry',
  'Radiology',
  'Laboratory',
  'Emergency',
  'Other'
];

// Flexible department matching - maps variations to standard names
const normalizeDepartment = (input: string): string | null => {
  const normalized = input.toLowerCase().trim();
  
  // Direct match (case-insensitive)
  const directMatch = departments.find(dept => dept.toLowerCase() === normalized);
  if (directMatch) return directMatch;
  
  // Fuzzy matching for common variations
  if (normalized.includes('general') || normalized.includes('gp') || normalized.includes('doctor')) {
    return 'General Medicine';
  }
  if (normalized.includes('pediatric') || normalized.includes('paediatric') || normalized.includes('child')) {
    return 'Pediatrics';
  }
  if (normalized.includes('surgery') || normalized.includes('surgical') || normalized.includes('trauma')) {
    return 'Surgery';
  }
  if (normalized.includes('obstetric') || normalized.includes('gynecolog') || normalized.includes('gynaecolog') || 
      normalized.includes('maternity') || normalized.includes('ob') || normalized.includes('gyn')) {
    return 'Obstetrics & Gynecology';
  }
  if (normalized.includes('orthopedic') || normalized.includes('orthopaedic') || normalized.includes('bone')) {
    return 'Orthopedics';
  }
  if (normalized.includes('cardio') || normalized.includes('heart')) {
    return 'Cardiology';
  }
  if (normalized.includes('derma') || normalized.includes('skin')) {
    return 'Dermatology';
  }
  if (normalized.includes('psychiat') || normalized.includes('mental')) {
    return 'Psychiatry';
  }
  if (normalized.includes('radio') || normalized.includes('imaging') || normalized.includes('x-ray') || normalized.includes('xray')) {
    return 'Radiology';
  }
  if (normalized.includes('lab') || normalized.includes('patholog') || normalized.includes('test')) {
    return 'Laboratory';
  }
  if (normalized.includes('emergency') || normalized.includes('urgent') || normalized.includes('er')) {
    return 'Emergency';
  }
  if (normalized.includes('vaccination') || normalized.includes('vaccine') || normalized.includes('immunization')) {
    return 'Pediatrics'; // Vaccinations typically fall under Pediatrics
  }
  if (normalized.includes('specialized') || normalized.includes('specialist') || normalized.includes('clinic')) {
    return 'Other'; // Specialized clinics go to Other
  }
  
  // If no match found, return Other as fallback
  return 'Other';
};

const Services: React.FC = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  
  // Form state
  const [serviceName, setServiceName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    fetchServices();
  }, [user?.clinic]);

  const fetchServices = async () => {
    console.log('fetchServices called, user:', user);
    
    try {
      setLoading(true);
      
      // Use default clinic ID if user clinic is not available
      const clinicId = user?.clinic || '6'; // Default to General Medicine clinic
      console.log('Fetching services for clinic:', clinicId);
      
      const servicesData = await clinicalApi.getServices(clinicId);
      console.log('Services data received:', servicesData);
      
      setServices(servicesData || []);
      console.log('Successfully loaded', (servicesData || []).length, 'services');
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setServiceName('');
    setCategory('');
    setDescription('');
    setPrice('');
    setEditingService(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serviceName.trim() || !category || !price) {
      toast.error('Please fill in all required fields');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      const serviceData = {
        service_name: serviceName.trim(),
        category,
        description,
        price: priceNum,
        created_by: user?.displayName || 'Unknown'
      };

      if (editingService) {
        await clinicalApi.updateService(editingService.id, { ...serviceData, updated_by: user?.displayName || 'Unknown' });
        toast.success('Service updated successfully');
      } else {
        await clinicalApi.createService(serviceData);
        toast.success('Service created successfully');
      }

      setDialogOpen(false);
      resetForm();
      fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Failed to save service');
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setServiceName(service.service_name);
    setCategory(service.category);
    setDescription(service.description || '');
    setPrice(service.price.toString());
    setDialogOpen(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      await clinicalApi.deleteService(serviceId);
      toast.success('Service deleted successfully');
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Failed to delete service');
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  // Filter services based on search query
  const filteredServices = services.filter(service => {
    const matchesSearch = searchQuery === '' || 
      service.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (service.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Export services to CSV
  const exportToCSV = () => {
    const headers = ['Service Name', 'Category', 'Description', 'Price'];
    const csvData = [
      headers,
      ...filteredServices.map(service => [
        service.service_name,
        service.category,
        service.description || '',
        `$${parseFloat(service.price.toString()).toFixed(2)}`
      ])
    ];

    const csvContent = csvData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `services_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${filteredServices.length} services to CSV`);
  };

  // Download CSV template
  const downloadTemplate = () => {
    const headers = ['Service Name', 'Category', 'Department', 'Price'];
    const sampleData = [
      ['General Consultation', 'Consultation', 'General Medicine', '50.00'],
      ['Blood Test - CBC', 'Diagnostic', 'Laboratory', '25.00'],
      ['X-Ray Chest', 'Diagnostic', 'Radiology', '80.00']
    ];
    
    const csvData = [headers, ...sampleData];
    const csvContent = csvData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'services_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Template downloaded successfully');
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
    } else {
      toast.error('Please select a valid CSV file');
      event.target.value = '';
    }
  };

  // Parse and import CSV
  const importFromCSV = async () => {
    if (!csvFile || !user?.clinic) return;

    setImporting(true);
    try {
      const text = await csvFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('CSV file must contain at least a header row and one data row');
        return;
      }

      // Skip header row
      const dataLines = lines.slice(1);
      const importedServices = [];
      const errors = [];

      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i].trim();
        
        // Skip empty lines
        if (!line) {
          continue;
        }
        
        // Parse CSV line (handling commas within quotes)
        const matches = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
        
        // Skip rows with insufficient columns
        if (!matches || matches.length < 4) {
          errors.push(`Row ${i + 2}: Missing required columns (skipped)`);
          continue;
        }

        const serviceName = matches[0].replace(/"/g, '').trim();
        const category = matches[1].replace(/"/g, '').trim();
        const department = matches[2].replace(/"/g, '').trim();
        const priceStr = matches[3].replace(/"/g, '').trim();
        
        // Parse price - remove commas and convert to number
        const price = priceStr ? parseFloat(priceStr.replace(/,/g, '')) : 0;

        // Skip rows with missing or invalid data
        if (!serviceName || !category || isNaN(price) || price < 0) {
          errors.push(`Row ${i + 2}: Invalid data (skipped)`);
          continue;
        }

        // Use flexible category matching
        const normalizedCategory = normalizeCategory(category);

        importedServices.push({
          service_name: serviceName,
          category: normalizedCategory || category,
          description: department || '',
          price,
          is_active: true
        });
      }

      // Only fail if no valid services were found
      if (importedServices.length === 0) {
        toast.error(`Import failed - no valid services found. Check console for details.`);
        console.error('Import errors:', errors);
        return;
      }

      // Show warnings if there were errors but continue with valid data
      if (errors.length > 0) {
        console.warn(`Import completed with ${errors.length} rows skipped:`, errors);
      }

      // Import services one by one
      let successCount = 0;
      for (const serviceData of importedServices) {
        try {
          await clinicalApi.createService(serviceData);
          successCount++;
        } catch (error) {
          console.error('Error importing service:', serviceData.service_name, error);
        }
      }

      if (errors.length > 0) {
        toast.success(`Successfully imported ${successCount} services (${errors.length} rows skipped due to invalid data)`);
      } else {
        toast.success(`Successfully imported ${successCount} services`);
      }
      setImportDialogOpen(false);
      setCsvFile(null);
      fetchServices();
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast.error('Failed to import CSV file');
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading services...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Services Management</h1>
            <p className="text-muted-foreground">
              Manage hospital services, categories, departments, and pricing
            </p>
          </div>
        </div>

        {/* Search Bar and Actions */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search services by name, category, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={exportToCSV}
              disabled={filteredServices.length === 0}
              className="h-9"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-9">
                  <Upload className="w-4 h-4 mr-2" />
                  Import CSV
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Import Services from CSV
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p className="mb-3">Upload a CSV file to import multiple services at once.</p>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="font-medium mb-2">CSV Format Requirements:</p>
                      <ul className="text-xs space-y-1 list-disc list-inside">
                        <li>Header row: Service Name, Category, Department, Price</li>
                        <li>Category must be one of: {serviceCategories.join(', ')}</li>
                        <li>Department must be one of: {departments.slice(0, 3).join(', ')}, etc.</li>
                        <li>Price must be a valid number (e.g., 50.00)</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={downloadTemplate}
                      className="flex-1"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Download Template
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="csvFile">Upload CSV File</Label>
                    <Input
                      id="csvFile"
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="cursor-pointer"
                    />
                    {csvFile && (
                      <p className="text-xs text-muted-foreground">
                        Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setImportDialogOpen(false);
                        setCsvFile(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={importFromCSV}
                      disabled={!csvFile || importing}
                    >
                      {importing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Import Services
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setDialogOpen(true)} className="h-9">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Wrench className="w-5 h-5" />
                    {editingService ? 'Edit Service' : 'Add New Service'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceName">Service Name *</Label>
                    <Input
                      id="serviceName"
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      placeholder="e.g., General Consultation"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={category} onValueChange={setCategory} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      type="text"
                      placeholder="Service description (optional)"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleDialogClose}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingService ? 'Update Service' : 'Create Service'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Services Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Loading services...</p>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-16">
              <div className="mb-4">
                <Wrench className="w-8 h-8 text-muted-foreground mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchQuery ? 'No services found' : 'No services available'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? 'Try adjusting your search terms or clear the search to see all services.'
                  : 'Get started by adding your first service.'
                }
              </p>
              {!searchQuery && (
                <Button onClick={() => setDialogOpen(true)} className="mt-2">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Service
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-background border-b border-border sticky top-0 z-10">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Service Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Description</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm text-foreground">Price</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredServices.map((service) => (
                    <tr key={service.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground text-sm">
                          {service.service_name}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-muted-foreground">
                          {service.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-muted-foreground">
                          {service.description || 'No description'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono font-semibold text-primary text-sm">
                          ${parseFloat(service.price.toString()).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(service)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(service.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Services;
