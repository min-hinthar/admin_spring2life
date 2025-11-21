import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, User, Calendar, Shield, LayoutDashboard, Menu, X } from 'lucide-react';
import { Button } from './ui/Button';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
    <Link
      to={to}
      onClick={() => setMobileMenuOpen(false)}
      className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        isActive(to) 
          ? 'bg-teal-50 text-teal-700' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <Icon className="mr-3 h-5 w-5" />
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="flex items-center space-x-2">
                  <div className="bg-teal-600 p-1.5 rounded-lg">
                     <Shield className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xl font-bold text-gray-900 tracking-tight">Spring2Life</span>
                </Link>
              </div>
              {user && (
                <div className="hidden sm:ml-6 sm:flex sm:space-x-4 items-center">
                  {user.role === 'user' && (
                    <>
                      <NavItem to="/dashboard/user" icon={LayoutDashboard} label="Dashboard" />
                      <NavItem to="/dashboard/user/providers" icon={User} label="Find Providers" />
                    </>
                  )}
                  {user.role === 'provider' && (
                    <>
                      <NavItem to="/dashboard/provider" icon={Calendar} label="Schedule" />
                    </>
                  )}
                  {user.role === 'admin' && (
                    <>
                       <NavItem to="/dashboard/admin" icon={Shield} label="Admin Console" />
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center">
              {user ? (
                <>
                  <div className="hidden sm:flex items-center space-x-4">
                    <span className="text-sm text-gray-700">
                      {user.fullName} <span className="text-gray-400 mx-1">|</span> <span className="uppercase text-xs font-semibold tracking-wider text-gray-500">{user.role}</span>
                    </span>
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </Button>
                  </div>
                  <div className="sm:hidden flex items-center">
                     <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-500 hover:text-gray-700">
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                     </button>
                  </div>
                </>
              ) : (
                <div className="space-x-3">
                  <Link to="/login">
                    <Button variant="secondary" size="sm">Sign in</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && user && (
           <div className="sm:hidden bg-white border-t border-gray-100 py-2 px-2 space-y-1 shadow-lg">
              {user.role === 'user' && (
                <>
                  <NavItem to="/dashboard/user" icon={LayoutDashboard} label="Dashboard" />
                  <NavItem to="/dashboard/user/providers" icon={User} label="Find Providers" />
                </>
              )}
              {user.role === 'provider' && (
                <NavItem to="/dashboard/provider" icon={Calendar} label="Schedule" />
              )}
              {user.role === 'admin' && (
                <NavItem to="/dashboard/admin" icon={Shield} label="Admin Console" />
              )}
              <div className="border-t border-gray-100 pt-2 mt-2">
                 <div className="px-4 py-2 text-sm text-gray-500">{user.fullName}</div>
                 <button onClick={handleLogout} className="w-full text-left flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md">
                    <LogOut className="mr-3 h-5 w-5" />
                    Sign out
                 </button>
              </div>
           </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};
