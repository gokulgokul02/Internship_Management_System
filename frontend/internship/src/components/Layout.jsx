// components/Layout.js
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "../frontend_assets/logo.png";

const Layout = ({ children, pageTitle }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const location = useLocation();
  const navigate = useNavigate();
  const admin = JSON.parse(localStorage.getItem("admin") || "{}");
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Notifications: listen for student registrations, payments, and for visits to Students page
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const existing = JSON.parse(localStorage.getItem('newRegistrations') || '[]');
        setNotifications(existing || []);
      } catch (e) {
        setNotifications([]);
      }
    };

    const onNew = (e) => {
      const detail = e?.detail;
      const item = detail ? { 
        id: detail.id, 
        name: detail.name, 
        studentId: detail.id,
        type: 'registration',
        time: new Date().toISOString() 
      } : { 
        id: Date.now(), 
        name: 'New Registration', 
        type: 'registration',
        time: new Date().toISOString() 
      };
      setNotifications((prev) => {
        const next = [item, ...(prev || [])];
        try { localStorage.setItem('newRegistrations', JSON.stringify(next)); } catch (err) { console.error(err); }
        return next;
      });
    };

    // ✅ NEW: Handle payment processed events
    const onPayment = (e) => {
      const detail = e?.detail;
      if (!detail) return;
      
      const item = {
        id: `payment_${detail.studentId}_${Date.now()}`,
        name: detail.studentName,
        studentId: detail.studentId,
        amount: detail.amount,
        type: 'payment',
        time: detail.timestamp || new Date().toISOString()
      };
      
      setNotifications((prev) => {
        const next = [item, ...(prev || [])];
        try { localStorage.setItem('newRegistrations', JSON.stringify(next)); } catch (err) { console.error(err); }
        return next;
      });
      
      console.log('✅ Payment notification added:', item);
    };

    const onVisited = () => {
      // Clear notifications when admin visits Students page
      setNotifications([]);
      try { localStorage.removeItem('newRegistrations'); } catch (err) { console.error(err); }
    };

    loadFromStorage();
    window.addEventListener('student:registered', onNew);
    window.addEventListener('payment:processed', onPayment); // ✅ NEW: Listen for payment events
    
    // listen to storage events so cross-tab writes to localStorage update notifications
    const onStorage = (e) => {
      if (!e) return;
      if (e.key === 'newRegistrations') {
        loadFromStorage();
      }
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('students:visited', onVisited);

    return () => {
      window.removeEventListener('student:registered', onNew);
      window.removeEventListener('payment:processed', onPayment); // ✅ NEW: Cleanup
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('students:visited', onVisited);
    };
  }, []);

  const navigation = [
    { 
      name: "Dashboard", 
      href: "/", 
      icon: "📊",
      description: "Overview and analytics"
    },
    { 
      name: "Students", 
      href: "/students", 
      icon: "👨‍🎓",
      description: "Manage student records"
    },
    { 
      name: "Payments", 
      href: "/payments", 
      icon: "💰",
      description: "Payment transactions & revenue"
    },
    { 
      name: "Admins", 
      href: "/admins", 
      icon: "👨‍💼",
      description: "Manage administrators"
    }
  ];

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ✅ FIXED: Sidebar - Fixed on both mobile and desktop */}
      <>
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Fixed positioning */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:fixed
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="h-full flex flex-col">
            {/* Logo Section */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm"><img src={Logo} alt="" /></span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">RORIRI</h1>
                  <p className="text-xs text-gray-500">Admin Panel</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation - Scrollable */}
            <nav className="flex-1 overflow-y-auto px-4 py-6">
              <div className="space-y-2">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 group
                        ${isActive 
                          ? 'bg-blue-50 border border-blue-200 text-blue-700' 
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </div>
                      {isActive && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* Footer Section - Fixed at bottom */}
            <div className="flex-shrink-0 p-4 border-t border-gray-200">
              <div className="flex items-center space-x-3 px-3 py-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {admin.name ? admin.name.charAt(0).toUpperCase() : 'A'}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {admin.name || 'Admin User'}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {admin.type?.toLowerCase() || 'Super Admin'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>

      {/* ✅ FIXED: Main Content Area with proper spacing for fixed sidebar */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64"> {/* Added margin for fixed sidebar */}
        {/* ✅ FIXED: Topbar - Fixed Position */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
            {/* Left Section */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>
                <p className="text-sm text-gray-500">
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* Time Display */}
              <div className="hidden sm:flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">
                  {currentTime.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true 
                  })}
                </span>
              </div>


              {/* User Menu */}
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
                  aria-label="Notifications"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notifications && notifications.length > 0 && (
                    <span className="absolute -top-0 -right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">{notifications.length}</span>
                  )}
                </button>

                {showNotifDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-3 border-b text-sm font-medium">Notifications</div>
                    <div className="max-h-96 overflow-auto">
                      {notifications && notifications.length > 0 ? (
                        notifications.map((n, idx) => (
                          <div key={n.id + idx} className="p-3 text-sm border-b last:border-b-0 hover:bg-gray-50 transition-colors">
                            {n.type === 'payment' ? (
                              // ✅ Payment notification with student name and ID
                              <div>
                                <div className="flex items-start gap-2">
                                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900">Payment Received</div>
                                    <div className="text-sm text-gray-700 mt-1">
                                      <span className="font-medium">{n.name}</span>
                                      <span className="text-gray-500"> (ID: {n.studentId})</span>
                                    </div>
                                    {n.amount && (
                                      <div className="text-sm font-semibold text-green-600 mt-1">
                                        Amount: ₹{Number(n.amount).toFixed(2)}
                                      </div>
                                    )}
                                    <div className="text-xs text-gray-500 mt-1">
                                      {new Date(n.time).toLocaleString('en-IN', {
                                        dateStyle: 'medium',
                                        timeStyle: 'short'
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              // ✅ Registration notification with student name and ID
                              <div>
                                <div className="flex items-start gap-2">
                                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900">New Registration</div>
                                    <div className="text-sm text-gray-700 mt-1">
                                      <span className="font-medium">{n.name}</span>
                                      {n.studentId && (
                                        <span className="text-gray-500"> (ID: {n.studentId})</span>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {new Date(n.time).toLocaleString('en-IN', {
                                        dateStyle: 'medium',
                                        timeStyle: 'short'
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center">
                          <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          <div className="text-sm text-gray-500">No new notifications</div>
                        </div>
                      )}
                    </div>
                    <div className="p-2 border-t text-right bg-gray-50">
                      <button 
                        onClick={() => { 
                          setNotifications([]); 
                          try { localStorage.removeItem('newRegistrations'); } catch(e){}; 
                          setShowNotifDropdown(false); 
                        }} 
                        className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50 transition-colors font-medium"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="relative group">
                <button className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {admin.name ? admin.name.charAt(0).toUpperCase() : 'A'}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {admin.name || 'Admin User'}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {admin.type?.toLowerCase() || 'Super Admin'}
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-900">{admin.name || 'Admin User'}</div>
                    <div className="text-xs text-gray-500">{admin.email || 'admin@example.com'}</div>
                  </div>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    Profile Settings
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    System Settings
                  </button>
                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ✅ FIXED: Page Content - Proper scrolling area with fixed sidebar offset */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="h-full overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;