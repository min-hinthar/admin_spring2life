import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/dbService';
import { Appointment } from '../types';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Calendar, Clock, Video, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles = {
    pending: 'bg-orange-100 text-orange-800 border-orange-200',
    confirmed: 'bg-teal-100 text-teal-800 border-teal-200',
    cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  // @ts-ignore
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-100'}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
};

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const data = db.appointments.getByUserId(user.id);
      setAppointments(data);
      setLoading(false);
    }
  }, [user]);

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-teal-500 rounded-full border-t-transparent"></div></div>;

  const upcoming = appointments.filter(a => new Date(a.startsAt) > new Date() && a.status !== 'cancelled');
  const past = appointments.filter(a => new Date(a.startsAt) <= new Date() || a.status === 'cancelled');

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hello, {user?.fullName.split(' ')[0]}</h1>
          <p className="text-gray-500 mt-1">Manage your appointments and care plan.</p>
        </div>
        <Link to="/dashboard/user/providers">
          <Button className="shadow-lg shadow-teal-500/30">
            <Plus className="h-4 w-4 mr-2" /> Book New Appointment
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
           <Card>
              <CardHeader className="flex justify-between items-center border-b-0 pb-0">
                 <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                    <Calendar className="mr-2 h-5 w-5 text-teal-600" />
                    Upcoming Appointments
                 </h2>
              </CardHeader>
              <CardBody>
                 {upcoming.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                       <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                         <Calendar className="h-6 w-6 text-gray-400" />
                       </div>
                       <p className="text-gray-500 font-medium">No upcoming sessions</p>
                       <p className="text-sm text-gray-400 mt-1">Ready to schedule your next visit?</p>
                       <Link to="/dashboard/user/providers" className="mt-4 inline-block">
                          <Button variant="outline" size="sm">Find a Provider</Button>
                       </Link>
                    </div>
                 ) : (
                    <div className="space-y-4 mt-4">
                       {upcoming.map(appt => (
                          <div key={appt.id} className="group relative bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:border-teal-200">
                             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-start space-x-4">
                                   <div className="bg-teal-50 p-3 rounded-full group-hover:bg-teal-100 transition-colors">
                                      <Video className="h-6 w-6 text-teal-600" />
                                   </div>
                                   <div>
                                      <h3 className="font-bold text-gray-900 text-lg">{appt.providerName}</h3>
                                      <div className="flex items-center text-gray-600 mt-1">
                                          <Calendar className="h-4 w-4 mr-1.5" />
                                          <span className="text-sm font-medium">{new Date(appt.startsAt).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                                      </div>
                                      <div className="flex items-center text-gray-500 mt-1">
                                          <Clock className="h-4 w-4 mr-1.5" />
                                          <span className="text-sm">{new Date(appt.startsAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ({appt.durationMinutes} mins)</span>
                                      </div>
                                      <div className="mt-3">
                                         <StatusBadge status={appt.status} />
                                      </div>
                                   </div>
                                </div>
                                <div className="flex flex-row sm:flex-col gap-2 sm:border-l sm:pl-5 border-gray-100">
                                   {appt.status === 'confirmed' && (
                                     <Button size="sm" className="w-full sm:w-auto">Join Video</Button>
                                   )}
                                   <Button size="sm" variant="outline" className="w-full sm:w-auto">Reschedule</Button>
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </CardBody>
           </Card>

           <Card>
              <CardHeader>
                 <h3 className="text-lg font-semibold text-gray-800">Past Visits</h3>
              </CardHeader>
              <CardBody>
                 {past.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No appointment history found.</p>
                 ) : (
                    <div className="divide-y divide-gray-100">
                       {past.map(appt => (
                          <div key={appt.id} className="py-4 first:pt-0 last:pb-0 flex justify-between items-center">
                             <div>
                                <p className="font-medium text-gray-900">{appt.providerName}</p>
                                <p className="text-sm text-gray-500">{new Date(appt.startsAt).toLocaleDateString()}</p>
                             </div>
                             <div className="text-right">
                                <StatusBadge status={appt.status} />
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </CardBody>
           </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
           <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="font-bold text-xl mb-2">Crisis Resources</h3>
                <p className="text-teal-100 text-sm mb-4">
                    Help is available 24/7. If you or someone else is in immediate danger, call 911.
                </p>
                <div className="space-y-2">
                  <div className="bg-white/10 backdrop-blur rounded-lg p-3 flex justify-between items-center">
                    <span className="font-medium">Suicide & Crisis Lifeline</span>
                    <span className="font-bold bg-white text-teal-900 px-2 py-0.5 rounded text-sm">988</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-lg p-3 flex justify-between items-center">
                    <span className="font-medium">Emergency</span>
                    <span className="font-bold bg-white text-teal-900 px-2 py-0.5 rounded text-sm">911</span>
                  </div>
                </div>
              </div>
              {/* Decorative circle */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
           </div>

           <Card>
             <CardHeader>
                <h3 className="font-medium text-gray-900">Your Care Team</h3>
             </CardHeader>
             <CardBody>
                <div className="space-y-4">
                   {/* Deduplicated list of providers from history */}
                   {Array.from(new Set(appointments.map(a => a.providerName))).map(name => (
                      <div key={name} className="flex items-center space-x-3">
                         <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                            {name.charAt(0)}
                         </div>
                         <div>
                            <p className="text-sm font-medium text-gray-900">{name}</p>
                            <Link to="/dashboard/user/providers" className="text-xs text-teal-600 hover:underline">Book again</Link>
                         </div>
                      </div>
                   ))}
                   {appointments.length === 0 && <p className="text-sm text-gray-500">You haven't booked with anyone yet.</p>}
                </div>
             </CardBody>
           </Card>
        </div>
      </div>
    </div>
  );
};
