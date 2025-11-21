import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/dbService';
import { Appointment, AvailabilitySlot } from '../types';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Check, X, Clock, User, Settings, Plus, Trash } from 'lucide-react';
import { DAYS_OF_WEEK } from '../constants';

export const ProviderDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'appointments' | 'availability'>('appointments');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refreshData = async () => {
    if (user && user.role === 'provider') {
      const [apptData, provider] = await Promise.all([
        db.appointments.getByProviderId(user.id),
        db.providers.getById(user.id),
      ]);
      setAppointments(apptData);
      if (provider) setAvailability(provider.availability);
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [user]);

  const handleStatusChange = async (id: string, status: 'confirmed' | 'cancelled') => {
    await db.appointments.updateStatus(id, status);
    refreshData();
  };

  const handleSaveAvailability = async () => {
    if (!user) return;
    setSaving(true);
    await db.providers.updateAvailability(user.id, availability);
    setSaving(false);
  };

  const addSlot = (dayIndex: number) => {
    setAvailability([...availability, { dayOfWeek: dayIndex, startTime: '09:00', endTime: '17:00' }]);
  };

  const removeSlot = (index: number) => {
    const newSlots = [...availability];
    newSlots.splice(index, 1);
    setAvailability(newSlots);
  };

  const updateSlot = (index: number, field: keyof AvailabilitySlot, value: any) => {
    const newSlots = [...availability];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setAvailability(newSlots);
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-teal-600 rounded-full border-t-transparent"></div></div>;

  const pending = appointments.filter(a => a.status === 'pending');
  const confirmed = appointments.filter(a => a.status === 'confirmed' && new Date(a.startsAt) > new Date());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Provider Portal</h1>
        <div className="flex space-x-2">
          <Button variant={activeTab === 'appointments' ? 'primary' : 'outline'} onClick={() => setActiveTab('appointments')}>
            Appointments
          </Button>
          <Button variant={activeTab === 'availability' ? 'primary' : 'outline'} onClick={() => setActiveTab('availability')}>
            Availability
          </Button>
        </div>
      </div>

      {activeTab === 'appointments' ? (
        <div className="space-y-6">
          {/* Pending Requests */}
          {pending.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full mr-2">{pending.length}</span>
                Pending Requests
              </h2>
              <div className="grid gap-4">
                {pending.map(appt => (
                  <Card key={appt.id} className="border-l-4 border-l-yellow-400">
                    <CardBody className="flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="flex items-start space-x-4">
                        <div className="bg-gray-100 p-3 rounded-full">
                          <User className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{appt.userName}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(appt.startsAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                          <p className="text-sm font-medium text-teal-600">
                            {new Date(appt.startsAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                          </p>
                          {appt.notes && <p className="text-sm text-gray-500 mt-2 bg-gray-50 p-2 rounded">"{appt.notes}"</p>}
                        </div>
                      </div>
                      <div className="flex space-x-2 w-full sm:w-auto">
                        <Button variant="outline" className="flex-1 sm:flex-none justify-center text-red-600 hover:bg-red-50 border-red-200" onClick={() => handleStatusChange(appt.id, 'cancelled')}>
                          Decline
                        </Button>
                        <Button className="flex-1 sm:flex-none justify-center" onClick={() => handleStatusChange(appt.id, 'confirmed')}>
                          Confirm
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Schedule */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Confirmed Schedule</h2>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {confirmed.map(appt => (
                    <tr key={appt.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{new Date(appt.startsAt).toLocaleDateString()}</div>
                        <div className="text-sm text-gray-500">{new Date(appt.startsAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 flex items-center">
                        <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center mr-3 text-teal-700 font-bold text-xs">
                          {appt.userName.charAt(0)}
                        </div>
                        {appt.userName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {appt.durationMinutes} mins
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-red-600 hover:text-red-900 text-xs border border-red-200 px-2 py-1 rounded hover:bg-red-50" onClick={() => handleStatusChange(appt.id, 'cancelled')}>Cancel</button>
                      </td>
                    </tr>
                  ))}
                  {confirmed.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No confirmed upcoming appointments.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Weekly Availability</h2>
                <p className="text-sm text-gray-500">Set your recurring weekly hours.</p>
              </div>
              <Button onClick={handleSaveAvailability} isLoading={saving}>Save Changes</Button>
            </CardHeader>
            <CardBody className="space-y-6">
              {DAYS_OF_WEEK.map((dayName, index) => {
                const daySlots = availability.filter(s => s.dayOfWeek === index);
                return (
                  <div key={dayName} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-700 w-24">{dayName}</h3>
                      <button onClick={() => addSlot(index)} className="text-xs text-teal-600 hover:text-teal-800 flex items-center">
                        <Plus className="h-3 w-3 mr-1" /> Add Slot
                      </button>
                    </div>
                    <div className="space-y-2 ml-0 sm:ml-24">
                      {daySlots.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Unavailable</p>
                      ) : (
                        daySlots.map((slot, i) => {
                           // Find the real index in the main array to update
                           const realIndex = availability.indexOf(slot);
                           return (
                             <div key={i} className="flex items-center space-x-2">
                                <input 
                                  type="time" 
                                  className="border rounded px-2 py-1 text-sm" 
                                  value={slot.startTime} 
                                  onChange={(e) => updateSlot(realIndex, 'startTime', e.target.value)}
                                />
                                <span className="text-gray-400">-</span>
                                <input 
                                  type="time" 
                                  className="border rounded px-2 py-1 text-sm" 
                                  value={slot.endTime}
                                  onChange={(e) => updateSlot(realIndex, 'endTime', e.target.value)}
                                />
                                <button onClick={() => removeSlot(realIndex)} className="text-gray-400 hover:text-red-500">
                                   <Trash className="h-4 w-4" />
                                </button>
                             </div>
                           );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};
