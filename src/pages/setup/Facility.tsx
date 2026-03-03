import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Hospital, Save, Edit, Plus, Trash2, MapPin, Phone, Mail, Globe, Building } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Facility {
  id: number;
  name: string;
  type: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  fax?: string;
  email: string;
  website?: string;
  license_number?: string;
  established_date?: string;
  bed_capacity?: number;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const Facility: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Hospital',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'South Sudan',
    phone: '',
    fax: '',
    email: '',
    website: '',
    license_number: '',
    established_date: '',
    bed_capacity: '',
    description: ''
  });

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      const response = await fetch('/api/facilities');
      if (response.ok) {
        const data = await response.json();
        setFacilities(data);
      }
    } catch (error) {
      console.error('Failed to fetch facilities');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.address || !formData.phone || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const url = editingFacility ? `/api/facilities/${editingFacility.id}` : '/api/facilities';
      const method = editingFacility ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          bed_capacity: formData.bed_capacity ? parseInt(formData.bed_capacity) : null
        })
      });

      if (response.ok) {
        toast.success(`Facility ${editingFacility ? 'updated' : 'created'} successfully`);
        setShowModal(false);
        setEditingFacility(null);
        setFormData({
          name: '',
          type: 'Hospital',
          address: '',
          city: '',
          state: '',
          postal_code: '',
          country: 'South Sudan',
          phone: '',
          fax: '',
          email: '',
          website: '',
          license_number: '',
          established_date: '',
          bed_capacity: '',
          description: ''
        });
        fetchFacilities();
      } else {
        toast.error('Failed to save facility');
      }
    } catch (error) {
      toast.error('Failed to save facility');
    }
  };

  const handleEdit = (facility: Facility) => {
    setEditingFacility(facility);
    setFormData({
      name: facility.name,
      type: facility.type,
      address: facility.address,
      city: facility.city,
      state: facility.state,
      postal_code: facility.postal_code,
      country: facility.country,
      phone: facility.phone,
      fax: facility.fax || '',
      email: facility.email,
      website: facility.website || '',
      license_number: facility.license_number || '',
      established_date: facility.established_date || '',
      bed_capacity: facility.bed_capacity?.toString() || '',
      description: facility.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this facility?')) return;

    try {
      const response = await fetch(`/api/facilities/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Facility deleted successfully');
        fetchFacilities();
      } else {
        toast.error('Failed to delete facility');
      }
    } catch (error) {
      toast.error('Failed to delete facility');
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Hospital className="w-8 h-8" />
            Facility Management
          </h1>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Facility
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities.map(facility => (
            <Card key={facility.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Hospital className="w-5 h-5" />
                    {facility.name}
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(facility)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(facility.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">{facility.type}</span>
                </div>
                
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div className="text-sm">
                    <div>{facility.address}</div>
                    <div>{facility.city}, {facility.state} {facility.postal_code}</div>
                    <div>{facility.country}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{facility.phone}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{facility.email}</span>
                </div>

                {facility.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{facility.website}</span>
                  </div>
                )}

                {facility.bed_capacity && (
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{facility.bed_capacity} beds</span>
                  </div>
                )}

                {facility.description && (
                  <div className="text-sm text-muted-foreground mt-2">
                    {facility.description}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {facilities.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Hospital className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No facilities found</h3>
              <p className="text-muted-foreground mb-4">Get started by adding your first facility</p>
              <Button onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Facility
              </Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingFacility ? 'Edit Facility' : 'Add New Facility'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Facility Name *</Label>
                  <Input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="Enter facility name"
                    required 
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <select 
                    className="w-full p-2 border border-input rounded-md"
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="Hospital">Hospital</option>
                    <option value="Clinic">Clinic</option>
                    <option value="Health Center">Health Center</option>
                    <option value="Medical Center">Medical Center</option>
                    <option value="Specialty Clinic">Specialty Clinic</option>
                  </select>
                </div>
              </div>

              <div>
                <Label>Address *</Label>
                <Textarea 
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})} 
                  placeholder="Enter full address"
                  required 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>City</Label>
                  <Input 
                    value={formData.city} 
                    onChange={e => setFormData({...formData, city: e.target.value})} 
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <Label>State/Province</Label>
                  <Input 
                    value={formData.state} 
                    onChange={e => setFormData({...formData, state: e.target.value})} 
                    placeholder="Enter state"
                  />
                </div>
                <div>
                  <Label>Postal Code</Label>
                  <Input 
                    value={formData.postal_code} 
                    onChange={e => setFormData({...formData, postal_code: e.target.value})} 
                    placeholder="Enter postal code"
                  />
                </div>
              </div>

              <div>
                <Label>Country</Label>
                <Input 
                  value={formData.country} 
                  onChange={e => setFormData({...formData, country: e.target.value})} 
                  placeholder="Enter country"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Phone Number *</Label>
                  <Input 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    placeholder="e.g., +211-123-456789"
                    required 
                  />
                </div>
                <div>
                  <Label>Fax Number</Label>
                  <Input 
                    value={formData.fax} 
                    onChange={e => setFormData({...formData, fax: e.target.value})} 
                    placeholder="Enter fax number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Email Address *</Label>
                  <Input 
                    type="email"
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    placeholder="facility@example.com"
                    required 
                  />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input 
                    value={formData.website} 
                    onChange={e => setFormData({...formData, website: e.target.value})} 
                    placeholder="https://www.example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>License Number</Label>
                  <Input 
                    value={formData.license_number} 
                    onChange={e => setFormData({...formData, license_number: e.target.value})} 
                    placeholder="Enter license number"
                  />
                </div>
                <div>
                  <Label>Established Date</Label>
                  <Input 
                    type="date"
                    value={formData.established_date} 
                    onChange={e => setFormData({...formData, established_date: e.target.value})} 
                  />
                </div>
              </div>

              <div>
                <Label>Bed Capacity</Label>
                <Input 
                  type="number"
                  min="0"
                  value={formData.bed_capacity} 
                  onChange={e => setFormData({...formData, bed_capacity: e.target.value})} 
                  placeholder="Enter number of beds"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  placeholder="Enter facility description"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  {editingFacility ? 'Update' : 'Create'} Facility
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Facility;
