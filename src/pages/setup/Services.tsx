import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Wrench, Save, Edit, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Service {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'General'
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Failed to fetch services');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const url = editingService ? `/api/services/${editingService.id}` : '/api/services';
      const method = editingService ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price)
        })
      });

      if (response.ok) {
        toast.success(`Service ${editingService ? 'updated' : 'created'} successfully`);
        setShowModal(false);
        setEditingService(null);
        setFormData({
          name: '',
          description: '',
          price: '',
          category: 'General'
        });
        fetchServices();
      } else {
        toast.error('Failed to save service');
      }
    } catch (error) {
      toast.error('Failed to save service');
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price.toString(),
      category: service.category
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const response = await fetch(`/api/services/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Service deleted successfully');
        fetchServices();
      } else {
        toast.error('Failed to delete service');
      }
    } catch (error) {
      toast.error('Failed to delete service');
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wrench className="w-8 h-8" />
            Services Management
          </h1>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(service => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{service.name}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(service)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(service.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">{service.category}</span>
                </div>
                
                <div className="text-lg font-semibold text-primary">
                  ${service.price.toFixed(2)}
                </div>

                {service.description && (
                  <div className="text-sm text-muted-foreground">
                    {service.description}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {services.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Wrench className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No services found</h3>
              <p className="text-muted-foreground mb-4">Get started by adding your first service</p>
              <Button onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Service
              </Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Service Name *</Label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="Enter service name"
                  required 
                />
              </div>

              <div>
                <Label>Category</Label>
                <select 
                  className="w-full p-2 border border-input rounded-md"
                  value={formData.category} 
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option value="General">General</option>
                  <option value="Consultation">Consultation</option>
                  <option value="Laboratory">Laboratory</option>
                  <option value="Radiology">Radiology</option>
                  <option value="Procedure">Procedure</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <div>
                <Label>Price *</Label>
                <Input 
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price} 
                  onChange={e => setFormData({...formData, price: e.target.value})} 
                  placeholder="0.00"
                  required 
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  placeholder="Enter service description"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  {editingService ? 'Update' : 'Create'} Service
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Services;
