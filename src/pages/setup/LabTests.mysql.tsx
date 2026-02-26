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
import { Plus, Trash2, Edit, TestTube, Search, Download, Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';

// Lab Test API Client
class LabTestApiClient {
  private baseUrl = '/api/lab-tests';

  async getLabTests(): Promise<any[]> {
    try {
      const response = await fetch(this.baseUrl);
      if (!response.ok) throw new Error('Failed to fetch lab tests');
      return await response.json();
    } catch (error) {
      console.error('Error fetching lab tests:', error);
      throw error;
    }
  }

  async createLabTest(testData: any): Promise<any> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData),
      });
      if (!response.ok) throw new Error('Failed to create lab test');
      return await response.json();
    } catch (error) {
      console.error('Error creating lab test:', error);
      throw error;
    }
  }

  async updateLabTest(testId: string, testData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${testId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData),
      });
      if (!response.ok) throw new Error('Failed to update lab test');
      return await response.json();
    } catch (error) {
      console.error('Error updating lab test:', error);
      throw error;
    }
  }

  async deleteLabTest(testId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${testId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete lab test');
    } catch (error) {
      console.error('Error deleting lab test:', error);
      throw error;
    }
  }
}

const labTestApi = new LabTestApiClient();

const testCategories = [
  'Hematology',
  'Chemistry',
  'Microbiology',
  'Urinalysis',
  'Serology',
  'Parasitology',
  'Other'
];

interface LabTest {
  id: string;
  test_name: string;
  test_code: string;
  category: string;
  price: number;
  service_id?: number;
  clinic_id: number;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

const LabTests: React.FC = () => {
  const { user } = useAuth();
  const [tests, setTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<LabTest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  
  // Form state
  const [testName, setTestName] = useState('');
  const [testCode, setTestCode] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    fetchTests();
  }, [user?.clinic]);

  const fetchTests = async () => {
    if (!user?.clinic) return;
    
    try {
      setLoading(true);
      const testsData = await labTestApi.getLabTests();
      setTests(testsData);
    } catch (error) {
      console.error('Error fetching lab tests:', error);
      toast.error('Failed to fetch lab tests');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTestName('');
    setTestCode('');
    setCategory('');
    setPrice('');
    setEditingTest(null);
  };

  const handleEdit = (test: LabTest) => {
    setEditingTest(test);
    setTestName(test.test_name);
    setTestCode(test.test_code);
    setCategory(test.category);
    setPrice(test.price?.toString() || '');
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.clinic) return;

    try {
      const testData = {
        test_name: testName,
        test_code: testCode,
        category,
        price: parseFloat(price),
        clinic_id: parseInt(user.clinic),
        is_active: true
      };

      if (editingTest) {
        await labTestApi.updateLabTest(editingTest.id, testData);
        toast.success('Lab test updated successfully');
      } else {
        await labTestApi.createLabTest(testData);
        toast.success('Lab test created successfully');
      }

      setDialogOpen(false);
      resetForm();
      fetchTests();
    } catch (error) {
      console.error('Error saving lab test:', error);
      toast.error('Failed to save lab test');
    }
  };

  const handleDelete = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this lab test?')) return;

    try {
      await labTestApi.deleteLabTest(testId);
      toast.success('Lab test deleted successfully');
      fetchTests();
    } catch (error) {
      console.error('Error deleting lab test:', error);
      toast.error('Failed to delete lab test');
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  // Filter tests based on search query
  const filteredTests = tests.filter(test => {
    const matchesSearch = searchQuery === '' || 
      test.test_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.test_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Export tests to CSV
  const exportToCSV = () => {
    const headers = ['Test Name', 'Test Code', 'Category', 'Price'];
    const csvData = [
      headers,
      ...filteredTests.map(test => [
        test.test_name,
        test.test_code,
        test.category,
        `$${parseFloat(test.price.toString()).toFixed(2)}`
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

  // Download CSV template
  const downloadTemplate = () => {
    const headers = ['Test Name', 'Test Code', 'Category', 'Price'];
    const sampleData = [
      ['Complete Blood Count', 'CBC', 'Hematology', '25.00'],
      ['Lipid Profile', 'LP', 'Chemistry', '35.00'],
      ['Blood Film for Malaria', 'BFFM', 'Parasitology', '15.00']
    ];
    
    const csvData = [headers, ...sampleData];
    const csvContent = csvData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'lab_tests_template.csv');
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
      const importedTests = [];
      const errors = [];

      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i];
        const columns = line.split(',').map(col => col.replace(/"/g, '').trim());
        
        if (columns.length < 4) {
          errors.push(`Row ${i + 2}: Missing required columns`);
          continue;
        }

        const [name, code, category, priceStr] = columns;
        const price = parseFloat(priceStr);

        if (!name || !code || !category || isNaN(price)) {
          errors.push(`Row ${i + 2}: Invalid data - all fields are required and price must be a number`);
          continue;
        }

        if (!testCategories.includes(category)) {
          errors.push(`Row ${i + 2}: Invalid category "${category}". Must be one of: ${testCategories.join(', ')}`);
          continue;
        }

        importedTests.push({
          test_name: name,
          test_code: code,
          category,
          price,
          clinic_id: parseInt(user.clinic),
          is_active: true
        });
      }

      if (errors.length > 0) {
        toast.error(`Import failed with ${errors.length} errors. Check console for details.`);
        console.error('Import errors:', errors);
        return;
      }

      // Import tests one by one
      let successCount = 0;
      for (const testData of importedTests) {
        try {
          await labTestApi.createLabTest(testData);
          successCount++;
        } catch (error) {
          console.error('Error importing lab test:', testData.test_name, error);
        }
      }

      toast.success(`Successfully imported ${successCount} lab tests`);
      setImportDialogOpen(false);
      setCsvFile(null);
      fetchTests();
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
            <p className="text-muted-foreground">Loading lab tests...</p>
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
            <h1 className="text-3xl font-bold tracking-tight">Lab Tests Management</h1>
            <p className="text-muted-foreground">
              Manage laboratory tests, categories, and pricing
            </p>
          </div>
        </div>

        {/* Search Bar and Actions */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search lab tests by name, code, or category..."
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
                    Import Lab Tests from CSV
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p className="mb-3">Upload a CSV file to import multiple lab tests at once.</p>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="font-medium mb-2">CSV Format Requirements:</p>
                      <ul className="text-xs space-y-1 list-disc list-inside">
                        <li>Header row: Test Name, Test Code, Category, Price</li>
                        <li>Category must be one of: {testCategories.join(', ')}</li>
                        <li>Price must be a valid number (e.g., 25.00)</li>
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
                          Import Tests
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
                  Add Lab Test
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <TestTube className="w-5 h-5" />
                    {editingTest ? 'Edit Lab Test' : 'Add New Lab Test'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="testName">Test Name *</Label>
                    <Input
                      id="testName"
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                      placeholder="e.g., Complete Blood Count"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="testCode">Test Code *</Label>
                    <Input
                      id="testCode"
                      value={testCode}
                      onChange={(e) => setTestCode(e.target.value.toUpperCase())}
                      placeholder="e.g., CBC"
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
                        {testCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      {editingTest ? 'Update Test' : 'Create Test'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Lab Tests Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          {filteredTests.length === 0 ? (
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
                    <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Test Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Test Code</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Category</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm text-foreground">Price</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTests.map((test) => (
                    <tr key={test.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground text-sm">
                          {test.test_name}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono bg-muted px-2 py-1 rounded text-sm">
                          {test.test_code}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-muted-foreground">
                          {test.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono font-semibold text-primary text-sm">
                          ${parseFloat(test.price.toString()).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(test)}
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
