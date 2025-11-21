"use client";

import React, { useEffect, useState } from 'react';
import { db } from '../services/dbService';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Calendar, DollarSign, Activity, CheckCircle2, XCircle, RefreshCcw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Appointment, ProviderProfile, UserProfile } from '../types';

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const pending = appointments.filter(a => a.status === 'pending');

  const refresh = async () => {
    const [userData, providerData, apptData] = await Promise.all([
      db.users.getAll(),
      db.providers.getAll(),
      db.appointments.getAll(),
    ]);
    setUsers(userData);
    setProviders(providerData);
    setAppointments(apptData);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleOverride = async (id: string, action: 'confirm' | 'cancel' | 'reschedule') => {
    if (action === 'confirm') await db.appointments.updateStatus(id, 'confirmed');
    if (action === 'cancel') await db.appointments.cancel(id, 'Cancelled by admin override');
    if (action === 'reschedule') {
      const next = new Date();
      next.setDate(next.getDate() + 2);
      next.setHours(11, 0, 0, 0);
      await db.appointments.reschedule(id, next.toISOString());
    }
    refresh();
  };

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
    return <div className="p-10 flex justify-center"><div className="animate-spin h-10 w-10 border-4 border-teal-500 rounded-full border-t-transparent"></div></div>;
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
        <div className="space-y-6">
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

          <Card>
            <CardHeader className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Pending overrides</h3>
              <span className="text-xs text-gray-500">Escalate when needed</span>
            </CardHeader>
            <CardBody className="space-y-3">
              {pending.length === 0 && <p className="text-sm text-gray-500">No pending requests to override.</p>}
              {pending.map(appt => (
                <div key={appt.id} className="p-3 border border-gray-100 rounded-lg bg-white shadow-sm">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{appt.userName} → {appt.providerName}</p>
                      <p className="text-xs text-gray-500">{new Date(appt.startsAt).toLocaleString()}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="ghost" onClick={() => handleOverride(appt.id, 'confirm')}>
                        <CheckCircle2 className="h-4 w-4 mr-1 text-teal-600" /> Confirm
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleOverride(appt.id, 'cancel')}>
                        <XCircle className="h-4 w-4 mr-1 text-red-600" /> Cancel
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleOverride(appt.id, 'reschedule')}>
                        <RefreshCcw className="h-4 w-4 mr-1" /> Resched
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
