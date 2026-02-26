import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext.mysql.pure';
import { Plus, Trash2, Edit, TestTube, X, Database, Search, Download, Upload, FileText, Check, ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { LabTest, LabTestComponent } from '@/types';

const testCategories = [
  'Hematology',
  'Chemistry',
  'Microbiology',
  'Urinalysis',
  'Serology',
  'Parasitology',
  'Other'
];

const LabTests: React.FC = () => {
  const { user } = useAuth();
  const [tests, setTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<LabTest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [testName, setTestName] = useState('');
  const [testCode, setTestCode] = useState('');
  const [category, setCategory] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [price, setPrice] = useState('');
  const [services, setServices] = useState<any[]>([]);
  const [serviceComboOpen, setServiceComboOpen] = useState(false);
  const [components, setComponents] = useState<LabTestComponent[]>([
    { name: '', unit: '', normalRangeMin: undefined, normalRangeMax: undefined, normalRangeText: '' }
  ]);

  useEffect(() => {
    fetchTests();
    fetchServices();
  }, [user?.clinic]);

  const fetchTests = async () => {
    if (!user?.clinic) return;
    
    try {
      const response = await fetch('/api/lab-tests', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API response error:', errorText);
        throw new Error(`Failed to fetch lab tests: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response received:', responseText);
        throw new Error('Server returned non-JSON response');
      }
      
      const testsData = await response.json();
      
      // Transform the raw database results to match our LabTest interface
      const transformedTests = Array.isArray(testsData) ? testsData.map(test => ({
        id: test.id,
        testName: test.test_name || test.testName,
        testCode: test.test_code || test.testCode,
        category: test.category,
        components: test.components || [],
        clinic: test.clinic_id || test.clinic,
        createdBy: test.created_by || test.createdBy,
        createdAt: test.createdAt,
        updatedAt: test.updatedAt
      })) : [];
      
      setTests(transformedTests);
    } catch (error) {
      console.error('Error fetching tests:', error);
      toast.error('Failed to fetch lab tests');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    if (!user?.clinic) return;
    
    try {
      const response = await fetch('/api/clinical/services/' + user.clinic, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      
      const servicesData = await response.json();
      setServices(servicesData);
    } catch (error) {
      console.error('Error fetching services:', error);
      // Don't show error toast for services as it's not critical
    }
  };

  const resetForm = () => {
    setTestName('');
    setTestCode('');
    setCategory('');
    setSelectedService('');
    setPrice('');
    setComponents([{ name: '', unit: '', normalRangeMin: undefined, normalRangeMax: undefined, normalRangeText: '' }]);
    setEditingTest(null);
  };

  const openEditDialog = (test: LabTest) => {
    setEditingTest(test);
    setTestName(test.testName);
    setTestCode(test.testCode);
    setCategory(test.category);
    setSelectedService(test.service_id?.toString() || '');
    setPrice(test.price?.toString() || '');
    setComponents(test.components.length > 0 ? test.components : [{ name: '', unit: '', normalRangeMin: undefined, normalRangeMax: undefined, normalRangeText: '' }]);
    setDialogOpen(true);
  };

  const handleServiceChange = (serviceId: string) => {
    setSelectedService(serviceId);
    const selectedServiceData = services.find(service => service.id.toString() === serviceId);
    if (selectedServiceData) {
      setPrice(selectedServiceData.price.toString());
    }
    setServiceComboOpen(false);
  };

  const addComponent = () => {
    setComponents([...components, { name: '', unit: '', normalRangeMin: undefined, normalRangeMax: undefined, normalRangeText: '' }]);
  };

  const removeComponent = (index: number) => {
    if (components.length > 1) {
      setComponents(components.filter((_, i) => i !== index));
    }
  };

  const updateComponent = (index: number, field: keyof LabTestComponent, value: string | number | undefined) => {
    const updated = [...components];
    updated[index] = { ...updated[index], [field]: value };
    setComponents(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!testName || !testCode || !category) {
      toast.error('Please fill in all required fields');
      return;
    }

    const validComponents = components.filter(c => c.name && c.name.trim() !== '');
    if (validComponents.length === 0) {
      toast.error('Please add at least one component');
      return;
    }

    try {
      // Transform data to match server expectations (snake_case)
      const testData = {
        test_name: testName,
        test_code: testCode.toUpperCase(),
        category,
        clinic_id: user?.clinic,
        price: parseFloat(price) || 0,
        service_id: selectedService ? parseInt(selectedService) : null,
        ...(editingTest ? {} : { created_by: user?.displayName })
      };

      const url = editingTest ? `/api/lab-tests/${editingTest.id}/with-components` : '/api/lab-tests/with-components';
      const method = editingTest ? 'PUT' : 'POST';

      // Transform components to match backend expectations
      const transformedComponents = validComponents.map(comp => ({
        component_name: comp.name || '',
        unit: comp.unit || '',
        reference_range: comp.normalRangeText || 
          (comp.normalRangeMin !== undefined && comp.normalRangeMax !== undefined 
            ? `${comp.normalRangeMin}-${comp.normalRangeMax}` 
            : ''),
        sort_order: 0
      })).filter(comp => comp.component_name.trim() !== ''); // Filter out empty component names

      const requestBody = editingTest ? {
        test: {
          test_name: testName,
          test_code: testCode.toUpperCase(),
          category,
          price: parseFloat(price) || 0,
          service_id: selectedService ? parseInt(selectedService) : null
        },
        components: transformedComponents
      } : {
        test: testData,
        components: transformedComponents
      };

      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Save error response:', errorText);
        let errorMessage = 'Failed to save lab test';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch (parseError) {
          // Use default error message if response isn't JSON
        }
        throw new Error(errorMessage);
      }

      toast.success(editingTest ? 'Lab test updated successfully' : 'Lab test added successfully');
      resetForm();
      setDialogOpen(false);
      fetchTests();
    } catch (error) {
      console.error('Error saving test:', error);
      toast.error(`Failed to save lab test: ${error.message}`);
    }
  };

  const handleDelete = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test?')) return;
    
    try {
      const response = await fetch(`/api/lab-tests/${testId}/with-components`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete error response:', errorText);
        let errorMessage = 'Failed to delete lab test';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch (parseError) {
          // Use default error message if response isn't JSON
        }
        throw new Error(errorMessage);
      }

      toast.success('Lab test deleted');
      fetchTests();
    } catch (error) {
      console.error('Error deleting test:', error);
      toast.error(`Failed to delete lab test: ${error.message}`);
    }
  };

  const seedLabTests = async () => {
    if (!user?.clinic) {
      toast.error('User clinic not found');
      return;
    }

    try {
      const response = await fetch('/api/lab-tests/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ clinic_id: user.clinic }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Seed error response:', errorText);
        let errorMessage = 'Failed to seed lab tests';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch (parseError) {
          // Use default error message if response isn't JSON
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      toast.success(`Successfully seeded ${result.count || 'sample'} lab tests`);
      fetchTests();
    } catch (error) {
      console.error('Error seeding lab tests:', error);
      toast.error(`Failed to seed lab tests: ${error.message}`);
    }
  };

  // Filter tests based on search query
  const filteredTests = tests.filter(test => {
    const matchesSearch = searchQuery === '' || 
      test.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.testCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Export tests to CSV
  const exportToCSV = () => {
    const headers = ['Test Code', 'Test Name', 'Category', 'Components Count'];
    const csvData = [
      headers,
      ...filteredTests.map(test => [
        test.testCode,
        test.testName,
        test.category,
        test.components.length.toString()
      ])
    ];

    const csvContent = csvData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `lab_tests_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${filteredTests.length} lab tests to CSV`);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lab Tests Management</h1>
            <p className="text-muted-foreground">
              Configure laboratory tests with components and normal ranges
            </p>
          </div>
        </div>

        {/* Search Bar and Actions */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search tests by name, code, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={exportToCSV}
              disabled={filteredTests.length === 0}
              className="h-9"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={seedLabTests} variant="outline" className="h-9">
              <Database className="w-4 h-4 mr-2" />
              Seed Lab Tests
            </Button>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="h-9">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Lab Test
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTest ? 'Edit Lab Test' : 'Add New Lab Test'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="testName">Test Name *</Label>
                    <Input
                      id="testName"
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                      placeholder="e.g., Complete Blood Count"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="testCode">Test Code *</Label>
                    <Input
                      id="testCode"
                      value={testCode}
                      onChange={(e) => setTestCode(e.target.value.toUpperCase())}
                      placeholder="e.g., CBC"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {testCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="service">Service</Label>
                    <Popover open={serviceComboOpen} onOpenChange={setServiceComboOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={serviceComboOpen}
                          className="w-full justify-between"
                        >
                          {selectedService
                            ? services.find((service) => service.id.toString() === selectedService)?.service_name
                            : "Select service (optional)..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] max-w-none p-0">
                        <Command>
                          <CommandInput placeholder="Search services..." />
                          <CommandEmpty>No service found.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-auto">
                            {services.map((service) => (
                              <CommandItem
                                key={service.id}
                                value={service.service_name}
                                onSelect={() => handleServiceChange(service.id.toString())}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedService === service.id.toString() ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {service.service_name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Test Components / Parameters</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addComponent}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add Component
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {components.map((component, index) => (
                      <Card key={index} className="p-4">
                        <div className="grid grid-cols-6 gap-3 items-end">
                          <div className="col-span-2 space-y-1">
                            <Label className="text-xs">Component Name *</Label>
                            <Input
                              value={component.name}
                              onChange={(e) => updateComponent(index, 'name', e.target.value)}
                              placeholder="e.g., Hemoglobin"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Unit</Label>
                            <Input
                              value={component.unit}
                              onChange={(e) => updateComponent(index, 'unit', e.target.value)}
                              placeholder="e.g., g/dL"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Min Range</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={component.normalRangeMin ?? ''}
                              onChange={(e) => updateComponent(index, 'normalRangeMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                              placeholder="Min"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Max Range</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={component.normalRangeMax ?? ''}
                              onChange={(e) => updateComponent(index, 'normalRangeMax', e.target.value ? parseFloat(e.target.value) : undefined)}
                              placeholder="Max"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 space-y-1">
                              <Label className="text-xs">Or Text Range</Label>
                              <Input
                                value={component.normalRangeText ?? ''}
                                onChange={(e) => updateComponent(index, 'normalRangeText', e.target.value)}
                                placeholder="e.g., Negative"
                              />
                            </div>
                            {components.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => removeComponent(index)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingTest ? 'Update Test' : 'Save Test'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Lab Tests Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Loading lab tests...</p>
            </div>
          ) : filteredTests.length === 0 ? (
            <div className="text-center py-16">
              <div className="mb-4">
                <TestTube className="w-8 h-8 text-muted-foreground mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchQuery ? 'No lab tests found' : 'No lab tests available'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? 'Try adjusting your search terms or clear the search to see all tests.'
                  : 'Get started by adding your first lab test.'
                }
              </p>
              {!searchQuery && (
                <Button onClick={() => setDialogOpen(true)} className="mt-2">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Lab Test
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-background border-b border-border sticky top-0 z-10">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Test Code</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Test Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Components</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTests.map((test) => (
                    <tr key={test.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-primary text-sm">
                          {test.testCode}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground text-sm">
                          {test.testName}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-muted-foreground">
                          {test.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-muted-foreground">
                          {test.components.length} component{test.components.length !== 1 ? 's' : ''}
                          {test.components.length > 0 && (
                            <div className="text-xs mt-1 max-w-xs truncate">
                              {test.components.map(c => c.name).join(', ')}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(test)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(test.id)}
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

export default LabTests;
