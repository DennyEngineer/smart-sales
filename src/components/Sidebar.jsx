import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaClipboardList,
  FaChartBar,
  FaBoxOpen,
  FaPlusCircle,
  FaAngleRight,
  FaAngleLeft,
  FaBars,
  FaTable
} from "react-icons/fa";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  // Handle screen resize to adjust sidebar state
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Define sidebar links with icons
  const sidebarLinks = [
    { path: "/summary", label: "Dashboard", icon: <FaHome /> },
    { path: "/pending-orders", label: "Pending Orders", icon: <FaClipboardList /> },
    { path: "/sales-report", label: "Sales Report", icon: <FaChartBar /> },
    { path: "/inventory", label: "Inventory", icon: <FaBoxOpen /> },
    { path: "/add-items", label: "Add Items", icon: <FaPlusCircle /> },
    { path: "/tables", label: "Tables", icon: <FaTable /> },
  ];

  // Toggle sidebar collapse
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Toggle mobile sidebar
  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={toggleMobileSidebar}
        className="fixed top-4 left-4 z-50 md:hidden bg-[#ea7c69] text-white p-3 rounded-lg shadow-lg hover:bg-white hover:text-[#ea7c69] transition-all duration-300 flex items-center justify-center"
        aria-label="Toggle menu"
      >
        <FaBars className="text-lg" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-[#252836] shadow-xl z-40 transition-all duration-300 ease-in-out flex flex-col
          ${isCollapsed ? 'w-20' : 'w-64'} 
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-[#ea7c69] text-white p-2 rounded-lg">
              <FaHome className="text-xl" />
            </div>
            {!isCollapsed && (
              <span className="ml-3 font-bold text-white text-lg">Smart POS</span>
            )}
          </div>
          
          {/* Toggle Button */}
          <button
            onClick={toggleSidebar}
            className="hidden md:flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
          >
            {isCollapsed ? <FaAngleRight /> : <FaAngleLeft />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {sidebarLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <li key={link.path} className="group">
                  <Link
                    to={link.path}
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 
                      ${isActive
                        ? 'bg-[#ea7c69] text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                  >
                    <div className={`text-xl ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#ea7c69]'}`}>
                      {link.icon}
                    </div>
                    {!isCollapsed && (
                      <span className={`ml-3 font-medium ${isActive ? 'text-white' : 'text-gray-300'}`}>{link.label}</span>
                    )}
                    {isCollapsed && (
                      <span className="absolute left-full rounded-md px-2 py-1 ml-6 bg-[#1F1D2B] text-sm font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 invisible group-hover:visible whitespace-nowrap shadow-lg border border-[#ea7c69] border-opacity-50">
                        {link.label}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          {!isCollapsed ? (
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 bg-[#ea7c69] bg-opacity-20 p-2 rounded-full">
                <span className="text-sm font-medium text-[#ea7c69]">JD</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">John Doe</p>
                <p className="text-xs text-gray-400">Admin</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="flex-shrink-0 bg-[#ea7c69] bg-opacity-20 p-2 rounded-full">
                <span className="text-sm font-medium text-[#ea7c69]">JD</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Content Padding */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        {/* Your main content goes here */}
      </div>
    </>
  );
};

export default Sidebar;