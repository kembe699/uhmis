import React from 'react';
import { ArrowLeft, Search, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Patient, Dispensing } from '@/types';

interface ReturnModalProps {
  showReturnModal: boolean;
  setShowReturnModal: (show: boolean) => void;
  returnPatientSearch: string;
  setReturnPatientSearch: (search: string) => void;
  selectedReturnPatient: Patient | null;
  patientDispensedMedicines: Dispensing[];
  selectedReturnMedicine: Dispensing | null;
  setSelectedReturnMedicine: (medicine: Dispensing | null) => void;
  returnQuantity: string;
  setReturnQuantity: (quantity: string) => void;
  returnReason: string;
  setReturnReason: (reason: string) => void;
  processingReturn: boolean;
  patients: Patient[];
  handleReturnPatientSearch: (patientId: string) => void;
  handleMedicineReturn: () => void;
}

export const ReturnModal: React.FC<ReturnModalProps> = ({
  showReturnModal,
  setShowReturnModal,
  returnPatientSearch,
  setReturnPatientSearch,
  selectedReturnPatient,
  patientDispensedMedicines,
  selectedReturnMedicine,
  setSelectedReturnMedicine,
  returnQuantity,
  setReturnQuantity,
  returnReason,
  setReturnReason,
  processingReturn,
  patients,
  handleReturnPatientSearch,
  handleMedicineReturn,
}) => {
  const filteredReturnPatients = patients.filter(p =>
    (p.fullName?.toLowerCase() || '').includes((returnPatientSearch || '').toLowerCase()) ||
    (p.patientId?.toLowerCase() || '').includes((returnPatientSearch || '').toLowerCase())
  );

  return (
    <Dialog open={showReturnModal} onOpenChange={setShowReturnModal}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5 text-primary" />
            Accept Medicine Return
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Search */}
          <div className="space-y-2">
            <Label>Search Patient</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by patient name or ID..."
                value={returnPatientSearch}
                onChange={(e) => setReturnPatientSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {returnPatientSearch && !selectedReturnPatient && (
              <div className="border rounded-lg max-h-40 overflow-y-auto">
                {filteredReturnPatients.length > 0 ? (
                  filteredReturnPatients.slice(0, 5).map((patient) => (
                    <div
                      key={patient.id}
                      className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                      onClick={() => handleReturnPatientSearch(patient.id)}
                    >
                      <div className="font-medium">{patient.fullName}</div>
                      <div className="text-sm text-muted-foreground">ID: {patient.patientId}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-muted-foreground text-center">No patients found</div>
                )}
              </div>
            )}
          </div>

          {/* Selected Patient Info */}
          {selectedReturnPatient && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">{selectedReturnPatient.fullName}</h4>
                  <p className="text-sm text-blue-700">Patient ID: {selectedReturnPatient.patientId}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReturnPatientSearch('');
                    setSelectedReturnMedicine(null);
                    setReturnQuantity('');
                    setReturnReason('');
                  }}
                >
                  Change Patient
                </Button>
              </div>
            </div>
          )}

          {/* Dispensed Medicines */}
          {selectedReturnPatient && (
            <div className="space-y-2">
              <Label>Select Medicine to Return (Last 30 days)</Label>
              {patientDispensedMedicines.length > 0 ? (
                <Select
                  value={selectedReturnMedicine?.id || ''}
                  onValueChange={(value) => {
                    const medicine = patientDispensedMedicines.find(m => m.id === value);
                    setSelectedReturnMedicine(medicine || null);
                    setReturnQuantity('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a dispensed medicine..." />
                  </SelectTrigger>
                  <SelectContent>
                    {patientDispensedMedicines.map((medicine) => (
                      <SelectItem key={medicine.id} value={medicine.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{medicine.drugName}</span>
                          <div className="flex items-center gap-2 ml-4">
                            <Badge variant="outline">Qty: {medicine.quantity}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(medicine.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No recent dispensing records found for this patient
                </div>
              )}
            </div>
          )}

          {/* Return Details */}
          {selectedReturnMedicine && (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-2">Selected Medicine</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-green-700 font-medium">Medicine:</span>
                    <p className="text-green-800">{selectedReturnMedicine.drugName}</p>
                  </div>
                  <div>
                    <span className="text-green-700 font-medium">Dispensed Quantity:</span>
                    <p className="text-green-800">{selectedReturnMedicine.quantity} units</p>
                  </div>
                  <div>
                    <span className="text-green-700 font-medium">Dispensed Date:</span>
                    <p className="text-green-800">{new Date(selectedReturnMedicine.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-green-700 font-medium">Prescribed By:</span>
                    <p className="text-green-800">{selectedReturnMedicine.prescribedBy}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Return Quantity</Label>
                  <Input
                    type="number"
                    placeholder="Enter quantity to return"
                    value={returnQuantity}
                    onChange={(e) => setReturnQuantity(e.target.value)}
                    min="1"
                    max={selectedReturnMedicine.quantity}
                  />
                  <p className="text-xs text-muted-foreground">
                    Max: {selectedReturnMedicine.quantity} units
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Return Reason</Label>
                  <Select value={returnReason} onValueChange={setReturnReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unused">Unused medication</SelectItem>
                      <SelectItem value="wrong_medication">Wrong medication dispensed</SelectItem>
                      <SelectItem value="adverse_reaction">Adverse reaction</SelectItem>
                      <SelectItem value="doctor_changed">Doctor changed prescription</SelectItem>
                      <SelectItem value="expired">Medication expired</SelectItem>
                      <SelectItem value="other">Other reason</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowReturnModal(false);
                setReturnPatientSearch('');
                setSelectedReturnMedicine(null);
                setReturnQuantity('');
                setReturnReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMedicineReturn}
              disabled={!selectedReturnMedicine || !returnQuantity || !returnReason || processingReturn}
              className="bg-green-600 hover:bg-green-700"
            >
              {processingReturn ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Accept Return
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
