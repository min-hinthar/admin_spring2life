import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Calendar, DollarSign, Activity } from 'lucide-react';
import { adminApi, appointmentApi, providerApi } from '../services/supabaseService';
import { Appointment, ProviderProfile, UserProfile } from '../types';

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [profiles, providerProfiles, appts] = await Promise.all([
          adminApi.getAllProfiles(),
          providerApi.getAll(),
          appointmentApi.getAll(),
        ]);
        setUsers(profiles.filter((p) => p.role !== 'provider'));
        setProviders(providerProfiles);
        setAppointments(appts);
      } catch (error) {
        console.error('Failed to load admin data', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = [
    { label: 'Total Users', value: users.length, icon: Users, color: 'bg-blue-500' },
    { label: 'Active Providers', value: providers.length, icon: Activity, color: 'bg-teal-500' },
    { label: 'Total Appointments', value: appointments.length, icon: Calendar, color: 'bg-indigo-500' },
    { label: 'Revenue (Est)', value: `$${appointments.filter(a => a.status === 'confirmed').length * 150}`, icon: DollarSign, color: 'bg-green-500' },
  ];

  const data = [
    { name: 'Mon', appts: 4 },
    { name: 'Tue', appts: 3 },
    { name: 'Wed', appts: 7 },
    { name: 'Thu', appts: 5 },
    { name: 'Fri', appts: 6 },
    { name: 'Sat', appts: 2 },
    { name: 'Sun', appts: 1 },
  ];

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin h-8 w-8 border-4 border-teal-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <Card key={stat.label} className="overflow-hidden">
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-md p-3 ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.label}</dt>
                    <dd className="text-lg font-bold text-gray-900">{stat.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="min-h-[400px]">
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Appointment Volume (Last 7 Days)</h3>
          </CardHeader>
          <CardBody className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="appts" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
           <CardHeader><h3 className="text-lg font-medium text-gray-900">Recent Activity</h3></CardHeader>
           <CardBody>
              <ul className="divide-y divide-gray-200">
                 {appointments.slice(0, 5).map(appt => (
                    <li key={appt.id} className="py-4">
                       <div className="flex space-x-3">
                          <div className="flex-1 space-y-1">
                             <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium">{appt.userName} booked with {appt.providerName}</h3>
                                <p className="text-sm text-gray-500">{new Date(appt.createdAt).toLocaleDateString()}</p>
                             </div>
                             <p className="text-sm text-gray-500">Status: {appt.status}</p>
                          </div>
                       </div>
                    </li>
                 ))}
              </ul>
           </CardBody>
        </Card>
      </div>
    </div>
  );
};
