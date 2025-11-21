import React, { useEffect, useState } from 'react';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Video, CalendarCheck } from 'lucide-react';
import { ProviderProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { appointmentApi, providerApi } from '../services/supabaseService';

export const ProviderList: React.FC = () => {
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ProviderProfile | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadProviders = async () => {
      try {
        const data = await providerApi.getAll();
        setProviders(data);
      } catch (error) {
        console.error('Failed to fetch providers', error);
      }
    };
    loadProviders();
  }, []);

  const handleBook = (provider: ProviderProfile) => {
    setSelectedProvider(provider);
  };

  const confirmBooking = async () => {
    if (!selectedProvider || !user) return;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    try {
      await appointmentApi.create({
        userId: user.id,
        providerId: selectedProvider.id,
        startsAt: tomorrow.toISOString(),
        durationMinutes: 60,
        notes: 'Requested via web portal',
      });
      setSelectedProvider(null);
      navigate('/dashboard/user');
    } catch (error) {
      console.error('Failed to book appointment', error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Find a Care Provider</h1>
      
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

      {/* Simple Booking Modal */}
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
                      Book Appointment with {selectedProvider.fullName}
                    </h3>
                    <div className="mt-4 space-y-4">
                       <p className="text-sm text-gray-500">
                          For this demo, we will request a 1-hour session for tomorrow at 10:00 AM. The provider will confirm the slot.
                       </p>
                       
                       <div className="bg-gray-50 p-3 rounded-md text-sm">
                          <p><strong>Date:</strong> Tomorrow</p>
                          <p><strong>Time:</strong> 10:00 AM - 11:00 AM</p>
                          <p><strong>Type:</strong> Initial Consultation (Video)</p>
                          <p><strong>Price:</strong> ${selectedProvider.hourlyRate}</p>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button onClick={confirmBooking}>Confirm Request</Button>
                <Button variant="outline" className="mt-3 sm:mt-0 sm:mr-3" onClick={() => setSelectedProvider(null)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};