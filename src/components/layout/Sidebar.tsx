import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.mysql.pure';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Pill,
  FlaskConical,
  BarChart3,
  Settings,
  LogOut,
  Activity,
  Menu,
  X,
  ChevronDown,
  TestTube,
  Shield,
  Wrench,
  Receipt,
  FileText,
  Wallet,
  BookOpen,
  Clock,
  ShoppingCart,
  Building2,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

interface NavDropdown {
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
  items: NavItem[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'reception', 'doctor', 'lab', 'pharmacy', 'reports'] },
  
  { label: 'Clinical', href: '/clinical', icon: Stethoscope, roles: ['admin', 'doctor'] },
  { label: 'Laboratory', href: '/laboratory', icon: FlaskConical, roles: ['admin', 'lab', 'doctor'] },
  { label: 'Reports', href: '/reports', icon: BarChart3, roles: ['admin', 'reports'] },
];

const patientRegistryDropdown: NavDropdown = {
  label: 'Patient Registry',
  icon: Users,
  roles: ['admin', 'reception', 'doctor'],
  items: [
    { label: 'Patients List', href: '/patients', icon: Users, roles: ['admin', 'reception', 'doctor'] },
  ]
};

const patientsBillDropdown: NavDropdown = {
  label: 'Patients Bill',
  icon: Receipt,
  roles: ['admin', 'reception', 'doctor', 'pharmacy'],
  items: [
    { label: 'Patient Bills', href: '/patients-bill', icon: Receipt, roles: ['admin', 'reception', 'doctor'] },
    { label: 'Receipts', href: '/receipts', icon: FileText, roles: ['admin', 'reception', 'doctor', 'pharmacy'] },
  ]
};

const accountsDropdown: NavDropdown = {
  label: 'Accounts',
  icon: Wallet,
  roles: ['admin', 'reception', 'pharmacy', 'cashier'],
  items: [
    { label: 'Ledger Accounts', href: '/accounts/ledger', icon: BookOpen, roles: ['admin', 'reception'] },
    { label: 'Cash Transfer', href: '/accounts/cash-transfer', icon: Wallet, roles: ['admin', 'reception', 'pharmacy', 'cashier'] },
    { label: 'Cashier Shift', href: '/cashier/shift', icon: Clock, roles: ['admin', 'reception', 'pharmacy', 'cashier'] },
  ]
};

const pharmacyDropdown: NavDropdown = {
  label: 'Pharmacy',
  icon: Pill,
  roles: ['admin', 'pharmacy'],
  items: [
    { label: 'Pharmacy', href: '/pharmacy', icon: Pill, roles: ['admin', 'pharmacy'] },
    { label: 'Inventory', href: '/pharmacy/inventory', icon: Package, roles: ['admin', 'pharmacy'] },
  ]
};

const procurementDropdown: NavDropdown = {
  label: 'Procurement',
  icon: ShoppingCart,
  roles: ['admin', 'cashier'],
  items: [
    { label: 'Suppliers', href: '/procurement/suppliers', icon: Building2, roles: ['admin'] },
    { label: 'Purchase Orders', href: '/procurement/purchase-orders', icon: ShoppingCart, roles: ['admin'] },
    { label: 'Daily Expenses', href: '/procurement/daily-expenses', icon: Receipt, roles: ['admin', 'cashier'] },
  ]
};

const setupDropdown: NavDropdown = {
  label: 'Setup',
  icon: Settings,
  roles: ['admin'],
  items: [
    { label: 'Lab Tests', href: '/setup/lab-tests', icon: TestTube, roles: ['admin'] },
    { label: 'Services', href: '/setup/services', icon: Wrench, roles: ['admin'] },
    { label: 'Clinics', href: '/setup/clinics', icon: Stethoscope, roles: ['admin'] },
    { label: 'Mindray Integration', href: '/setup/mindray-integration', icon: FlaskConical, roles: ['admin'] },
    { label: 'Security', href: '/setup/security', icon: Shield, roles: ['admin'] },
  ]
};

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [setupOpen, setSetupOpen] = useState(location.pathname.startsWith('/setup'));
  const [patientRegistryOpen, setPatientRegistryOpen] = useState(location.pathname.startsWith('/patients') && !location.pathname.startsWith('/patients-bill'));
  const [patientsBillOpen, setPatientsBillOpen] = useState(location.pathname.startsWith('/patients-bill') || location.pathname.startsWith('/receipts'));
  const [accountsOpen, setAccountsOpen] = useState(location.pathname.startsWith('/accounts'));
  const [pharmacyOpen, setPharmacyOpen] = useState(location.pathname.startsWith('/pharmacy'));
  const [procurementOpen, setProcurementOpen] = useState(location.pathname.startsWith('/procurement'));

  const filteredNavItems = navItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  const showSetup = user?.role && setupDropdown.roles.includes(user.role);
  const showPatientRegistry = user?.role && patientRegistryDropdown.roles.includes(user.role);
  const showPatientsBill = user?.role && patientsBillDropdown.roles.includes(user.role);
  const showAccounts = user?.role && accountsDropdown.roles.includes(user.role);
  const showPharmacy = user?.role && pharmacyDropdown.roles.includes(user.role);
  const showProcurement = user?.role && procurementDropdown.roles.includes(user.role);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-3 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-sm bg-white flex items-center justify-center p-1">
                <img src="/logo.jpeg" alt="Universal Hospital Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="font-bold text-base leading-tight">Universal Hospital</h1>
                <p className="text-[11px] text-sidebar-foreground/70 leading-tight">HMIS</p>
              </div>
            </div>
            <button 
              onClick={onToggle}
              className="lg:hidden p-2 rounded-sm hover:bg-sidebar-accent"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
            {/* Dashboard - always first */}
            {filteredNavItems.filter(item => item.href === '/dashboard').map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => window.innerWidth < 1024 && onToggle()}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-sm transition-colors text-[13px]",
                    isActive 
                      ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                      : "hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium leading-none">{item.label}</span>
                </Link>
              );
            })}

            {/* Patient Registry Dropdown - right after Dashboard */}
            {showPatientRegistry && (
              <div className="pt-2">
                <button
                  onClick={() => setPatientRegistryOpen(!patientRegistryOpen)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-sm transition-colors text-[13px]",
                    (location.pathname.startsWith('/patients') && !location.pathname.startsWith('/patients-bill'))
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4" />
                    <span className="font-medium leading-none">Patient Registry</span>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 transition-transform", patientRegistryOpen && "rotate-180")} />
                </button>
                
                {patientRegistryOpen && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-3">
                    {patientRegistryDropdown.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.href;
                      
                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => window.innerWidth < 1024 && onToggle()}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-sm transition-colors text-[12px]",
                            isActive 
                              ? "bg-sidebar-accent text-sidebar-foreground font-medium" 
                              : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Patients Bill Dropdown */}
            {showPatientsBill && (
              <div className="pt-2">
                <button
                  onClick={() => setPatientsBillOpen(!patientsBillOpen)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-sm transition-colors text-[13px]",
                    (location.pathname.startsWith('/patients-bill') || location.pathname.startsWith('/receipts'))
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Receipt className="w-4 h-4" />
                    <span className="font-medium leading-none">Patients Bill</span>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 transition-transform", patientsBillOpen && "rotate-180")} />
                </button>
                
                {patientsBillOpen && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-3">
                    {patientsBillDropdown.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.href;
                      
                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => window.innerWidth < 1024 && onToggle()}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-sm transition-colors text-[12px]",
                            isActive 
                              ? "bg-sidebar-accent text-sidebar-foreground font-medium" 
                              : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Other navigation items - excluding Dashboard */}
            {filteredNavItems.filter(item => item.href !== '/dashboard').map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => window.innerWidth < 1024 && onToggle()}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-sm transition-colors text-[13px]",
                    isActive 
                      ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                      : "hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium leading-none">{item.label}</span>
                </Link>
              );
            })}

            {/* Pharmacy Dropdown */}
            {showPharmacy && (
              <div className="pt-2">
                <button
                  onClick={() => setPharmacyOpen(!pharmacyOpen)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-sm transition-colors text-[13px]",
                    location.pathname.startsWith('/pharmacy')
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Pill className="w-4 h-4" />
                    <span className="font-medium leading-none">Pharmacy</span>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 transition-transform", pharmacyOpen && "rotate-180")} />
                </button>
                
                {pharmacyOpen && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-3">
                    {pharmacyDropdown.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.href;
                      
                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => window.innerWidth < 1024 && onToggle()}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-sm transition-colors text-[12px]",
                            isActive 
                              ? "bg-sidebar-accent text-sidebar-foreground font-medium" 
                              : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Accounts Dropdown */}
            {showAccounts && (
              <div className="pt-2">
                <button
                  onClick={() => setAccountsOpen(!accountsOpen)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-sm transition-colors text-[13px]",
                    location.pathname.startsWith('/accounts')
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="w-4 h-4" />
                    <span className="font-medium leading-none">Accounts</span>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 transition-transform", accountsOpen && "rotate-180")} />
                </button>
                
                {accountsOpen && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-3">
                    {accountsDropdown.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.href;
                      
                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => window.innerWidth < 1024 && onToggle()}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-sm transition-colors text-[12px]",
                            isActive 
                              ? "bg-sidebar-accent text-sidebar-foreground font-medium" 
                              : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {/* Procurement Dropdown */}
            {showProcurement && (
              <div className="pt-2">
                <button onClick={() => setProcurementOpen(!procurementOpen)} className={cn("w-full flex items-center justify-between px-3 py-2 rounded-sm transition-colors text-[13px]", location.pathname.startsWith("/procurement") ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground")}>
                  <div className="flex items-center gap-3"><ShoppingCart className="w-4 h-4" /><span className="font-medium leading-none">Procurement</span></div>
                  <ChevronDown className={cn("w-4 h-4 transition-transform", procurementOpen && "rotate-180")} />
                </button>
                {procurementOpen && (<div className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-3">{procurementDropdown.items.map((item) => {const Icon = item.icon; const isActive = location.pathname === item.href; return (<Link key={item.href} to={item.href} onClick={() => window.innerWidth < 1024 && onToggle()} className={cn("flex items-center gap-3 px-3 py-2 rounded-sm transition-colors text-[12px]", isActive ? "bg-sidebar-accent text-sidebar-foreground font-medium" : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground")}><Icon className="w-4 h-4" /><span>{item.label}</span></Link>);})}</div>)}
              </div>
            )}


            {/* Setup Dropdown */}
            {showSetup && (
              <div className="pt-2">
                <button
                  onClick={() => setSetupOpen(!setupOpen)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-sm transition-colors text-[13px]",
                    location.pathname.startsWith('/setup')
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4" />
                    <span className="font-medium leading-none">Setup</span>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 transition-transform", setupOpen && "rotate-180")} />
                </button>
                
                {setupOpen && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-3">
                    {setupDropdown.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.href;
                      
                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => window.innerWidth < 1024 && onToggle()}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-sm transition-colors text-[12px]",
                            isActive 
                              ? "bg-sidebar-accent text-sidebar-foreground font-medium" 
                              : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* User section */}
          <div className="px-3 py-3 border-t border-sidebar-border">
            <Link
              to="/profile"
              onClick={() => window.innerWidth < 1024 && onToggle()}
              className="flex items-center gap-3 mb-4 p-2 rounded-sm hover:bg-sidebar-accent transition-colors cursor-pointer"
            >
              <div className="w-9 h-9 rounded-sm bg-sidebar-accent flex items-center justify-center">
                <span className="font-semibold text-[13px]">
                  {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[13px] truncate leading-tight">{user?.displayName}</p>
                <p className="text-[11px] text-sidebar-foreground/60 capitalize leading-tight">{user?.role} • {user?.clinic}</p>
              </div>
            </Link>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors text-[13px]"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export const MobileHeader: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  const { user } = useAuth();
  
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-background border-b border-border h-16 flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="p-2 hover:bg-accent rounded-md">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center p-1">
            <img src="/logo.jpeg" alt="Universal Hospital Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-semibold">Universal Hospital</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-xs font-semibold text-primary">
            {user?.displayName?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
      </div>
    </header>
  );
};
