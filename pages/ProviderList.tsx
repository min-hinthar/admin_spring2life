'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { db } from '../services/dbService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Video, CalendarCheck, Info, Clock, ShieldCheck } from 'lucide-react';
import { ProviderProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SlotOption {
  label: string;
  value: string;
}

const generateSlots = (provider: ProviderProfile): SlotOption[] => {
  const slots: SlotOption[] = [];
  const now = new Date();
  for (let i = 0; i < 10; i++) {
    const day = new Date(now);
    day.setDate(day.getDate() + i);
    const dayOfWeek = day.getDay();
    const availability = provider.availability.filter((a) => a.dayOfWeek === dayOfWeek);
    availability.forEach((slot) => {
      const startParts = slot.startTime.split(':').map(Number);
      const endParts = slot.endTime.split(':').map(Number);
      const start = new Date(day);
      start.setHours(startParts[0], startParts[1], 0, 0);
      const end = new Date(day);
      end.setHours(endParts[0], endParts[1], 0, 0);
      for (let t = start; t < end; t = new Date(t.getTime() + 60 * 60 * 1000)) {
        slots.push({
          label: `${t.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} • ${t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          value: t.toISOString(),
        });
      }
    });
  }
  return slots;
};

export const ProviderList: React.FC = () => {
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ProviderProfile | null>(null);
  const [slot, setSlot] = useState('');
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    db.providers.getAll().then(setProviders);
  }, []);

  const slots = useMemo(() => (selectedProvider ? generateSlots(selectedProvider) : []), [selectedProvider]);

  const handleBook = (provider: ProviderProfile) => {
    setSelectedProvider(provider);
    setSlot('');
    setDuration(60);
    setNotes('');
  };

  const confirmBooking = async () => {
    if (!selectedProvider || !user || !slot) return;

    await db.appointments.create({
       userId: user.id,
       providerId: selectedProvider.id,
       startsAt: slot,
       durationMinutes: duration,
       notes: notes || 'Requested via patient portal',
    });

    setSelectedProvider(null);
    navigate('/dashboard/user');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Find a Care Provider</h1>
          <p className="text-gray-500 text-sm">All visits are telehealth-only with secure video links.</p>
        </div>
        <div className="flex items-center text-xs bg-white px-3 py-2 rounded-full border border-gray-200 shadow-sm">
          <ShieldCheck className="h-4 w-4 text-teal-600 mr-2" />
          HIPAA-inspired privacy + audit-friendly logs
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {providers.map((provider) => (
          <Card key={provider.id} className="overflow-hidden transition-all hover:shadow-md">
            <div className="flex flex-col sm:flex-row">
               <div className="sm:w-1/3 bg-gray-100 relative">
                  <img src={provider.avatarUrl} alt={provider.fullName} className="w-full h-48 sm:h-full object-cover" />
                  {provider.telehealth && (
                     <div className="absolute top-2 right-2 bg-white/90 backdrop-blur text-teal-700 text-xs font-bold px-2 py-1 rounded-full flex items-center shadow-sm">
                        <Video className="w-3 h-3 mr-1" />
                        Telehealth
                     </div>
                  )}
               </div>
               <div className="p-6 sm:w-2/3 flex flex-col justify-between">
                  <div>
                     <h3 className="text-lg font-bold text-gray-900">{provider.fullName}</h3>
                     <p className="text-teal-600 font-medium text-sm mb-2">{provider.specialty}</p>
                     <p className="text-gray-500 text-sm line-clamp-3 mb-4">{provider.bio}</p>
                     <div className="flex items-center text-xs text-gray-500 space-x-2">
                       <Clock className="h-3 w-3" />
                       <span>{provider.availability.length} weekly availability blocks</span>
                     </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                     <div className="text-sm">
                        <span className="block text-gray-500 text-xs">Rate</span>
                        <span className="font-semibold text-gray-900">${provider.hourlyRate}/hr</span>
                     </div>
                     <Button size="sm" onClick={() => handleBook(provider)}>Book Visit</Button>
                  </div>
               </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Booking Modal */}
      {selectedProvider && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setSelectedProvider(null)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-teal-100 sm:mx-0 sm:h-10 sm:w-10">
                    <CalendarCheck className="h-6 w-6 text-teal-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Book with {selectedProvider.fullName}
                    </h3>
                    <div className="mt-4 space-y-4">
                       <div className="bg-gray-50 p-3 rounded-md text-sm flex items-start space-x-2">
                          <Info className="h-4 w-4 text-teal-600 mt-0.5" />
                          <div>
                            <p className="text-gray-700">Telehealth-only video visit. You'll get a secure link after confirmation.</p>
                            <p className="text-gray-500 text-xs mt-1">We respect privacy—no data leaves your browser in this demo.</p>
                          </div>
                       </div>

                       <div className="space-y-2">
                         <label className="text-sm font-medium text-gray-700">Select a slot</label>
                         <select
                           className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                           value={slot}
                           onChange={(e) => setSlot(e.target.value)}
                         >
                           <option value="">Choose next available time</option>
                           {slots.length === 0 && <option disabled>No published availability</option>}
                           {slots.map((s) => (
                             <option key={s.value} value={s.value}>{s.label}</option>
                           ))}
                         </select>
                       </div>

                       <div className="grid grid-cols-2 gap-3">
                         <div>
                           <label className="text-sm font-medium text-gray-700">Duration</label>
                           <select
                             className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                             value={duration}
                             onChange={(e) => setDuration(parseInt(e.target.value))}
                           >
                             {[30,45,60].map((d) => <option key={d} value={d}>{d} minutes</option>)}
                           </select>
                         </div>
                         <div>
                           <label className="text-sm font-medium text-gray-700">Notes</label>
                           <input
                             type="text"
                             placeholder="Goals for this visit"
                             className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                             value={notes}
                             onChange={(e) => setNotes(e.target.value)}
                           />
                         </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button onClick={confirmBooking} disabled={!slot}>Confirm Request</Button>
                <Button variant="outline" className="mt-3 sm:mt-0 sm:mr-3" onClick={() => setSelectedProvider(null)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
