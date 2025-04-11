import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import Sidebar from "./Sidebar";
import { FaTable, FaCheckCircle, FaTimes, FaSync } from "react-icons/fa";
import { FiUsers, FiClock, FiAlertCircle, FiRefreshCw } from "react-icons/fi";

const TableManagement = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTable, setEditingTable] = useState(null);

  // Status options for dropdown
  const statusOptions = ["free", "occupied", "reserved", "maintenance"];

  // Fetch tables from Firestore
  const fetchTables = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "tables"));
      const tablesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTables(tablesData);
    } catch (error) {
      console.error("Error fetching tables:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  // Handle status change
  const handleStatusChange = async (tableId, newStatus) => {
    try {
      const tableRef = doc(db, "tables", tableId);
      
      // If setting to free, also clear any orderId
      const updateData = {
        status: newStatus,
        timestamp: serverTimestamp()
      };
      
      if (newStatus === "free") {
        updateData.orderId = null;
      }
      
      await updateDoc(tableRef, updateData);
      
      // Update the local state
      setTables(tables.map(table => 
        table.id === tableId ? { ...table, status: newStatus, ...updateData } : table
      ));
      
      setEditingTable(null); // Exit edit mode
    } catch (error) {
      console.error("Error updating table status:", error);
      alert("Failed to update table status. Please try again.");
    }
  };

  // Get status color and icon
  const getStatusInfo = (status) => {
    switch (status) {
      case "free":
        return { 
          color: "bg-green-500", 
          textColor: "text-white",
          icon: <FaCheckCircle className="mr-2" /> 
        };
      case "occupied":
        return { 
          color: "bg-red-500", 
          textColor: "text-white",
          icon: <FiUsers className="mr-2" /> 
        };
      case "reserved":
        return { 
          color: "bg-yellow-500", 
          textColor: "text-yellow-500",
          icon: <FiClock className="mr-2" /> 
        };
      case "maintenance":
        return { 
          color: "bg-gray-500", 
          textColor: "text-gray-500",
          icon: <FiAlertCircle className="mr-2" /> 
        };
      default:
        return { 
          color: "bg-gray-500", 
          textColor: "text-gray-500",
          icon: <FaTimes className="mr-2" /> 
        };
    }
  };

  return (
    <div className="flex bg-[#252836] min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <FaTable className="text-2xl text-[#ea7c69]" />
            <h1 className="text-2xl font-semibold text-white">Table Management</h1>
          </div>
          <button 
            onClick={fetchTables}
            className="flex items-center px-4 py-2 bg-[#ea7c69] text-white rounded-lg hover:bg-opacity-90 transition-all"
          >
            <FiRefreshCw className="mr-2" />
            Refresh
          </button>
        </div>

        {/* Table Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Free Tables Card */}
          <div className="bg-[#1f1d2b] rounded-lg shadow p-4 border border-[#393C49]">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-500 bg-opacity-20 mr-4">
                <FaCheckCircle className="text-xl text-green-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400">Free Tables</h3>
                <p className="text-xl font-bold text-white">
                  {tables.filter(table => table.status === "free").length}
                </p>
              </div>
            </div>
          </div>
          
          {/* Occupied Tables Card */}
          <div className="bg-[#1f1d2b] rounded-lg shadow p-4 border border-[#393C49]">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-500 bg-opacity-20 mr-4">
                <FiUsers className="text-xl text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400">Occupied Tables</h3>
                <p className="text-xl font-bold text-white">
                  {tables.filter(table => table.status === "occupied").length}
                </p>
              </div>
            </div>
          </div>
          
          {/* Reserved Tables Card */}
          <div className="bg-[#1f1d2b] rounded-lg shadow p-4 border border-[#393C49]">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-500 bg-opacity-20 mr-4">
                <FiClock className="text-xl text-yellow-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400">Reserved Tables</h3>
                <p className="text-xl font-bold text-white">
                  {tables.filter(table => table.status === "reserved").length}
                </p>
              </div>
            </div>
          </div>
          
          {/* Maintenance Tables Card */}
          <div className="bg-[#1f1d2b] rounded-lg shadow p-4 border border-[#393C49]">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-gray-500 bg-opacity-20 mr-4">
                <FiAlertCircle className="text-xl text-gray-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400">Maintenance</h3>
                <p className="text-xl font-bold text-white">
                  {tables.filter(table => table.status === "maintenance").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tables Grid/List */}
        <div className="bg-[#1f1d2b] rounded-lg shadow overflow-hidden border border-[#393C49] p-6">
          <h2 className="text-xl font-semibold text-white mb-6">All Tables</h2>
          
          {loading ? (
            <div className="text-center text-gray-400 py-8">
              <FaSync className="animate-spin text-2xl mx-auto mb-4" />
              <p>Loading tables...</p>
            </div>
          ) : tables.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p>No tables found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {tables.map((table) => {
                const statusInfo = getStatusInfo(table.status);
                return (
                  <div 
                    key={table.id} 
                    className="bg-[#252836] border border-[#393C49] rounded-lg p-4 hover:border-[#ea7c69] transition-all relative"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        <FaTable className="text-[#ea7c69] mr-2" />
                        <h3 className="font-semibold text-white">{table.id}</h3>
                      </div>
                      <div className={`px-2 py-1 rounded-full ${statusInfo.color} bg-opacity-20 ${statusInfo.textColor} text-xs flex items-center`}>
                        {statusInfo.icon}
                        {table.status}
                      </div>
                    </div>
                    
                    {/* Order ID if available */}
                    {table.orderId && (
                      <div className="mb-3 text-sm">
                        <span className="text-gray-400">Order ID: </span>
                        <span className="text-white">{table.orderId.substring(0, 8)}...</span>
                      </div>
                    )}
                    
                    {/* Last Updated */}
                    <div className="text-xs text-gray-400 mb-4">
                      Last updated: {table.timestamp ? new Date(table.timestamp.seconds * 1000).toLocaleString() : "N/A"}
                    </div>
                    
                    {/* Edit Interface */}
                    {editingTable === table.id ? (
                      <div className="mt-4">
                        <select 
                          className="w-full p-2 bg-[#1f1d2b] border border-[#393C49] rounded text-white mb-2 focus:outline-none focus:border-[#ea7c69]"
                          defaultValue={table.status}
                          onChange={(e) => handleStatusChange(table.id, e.target.value)}
                        >
                          {statusOptions.map(status => (
                            <option key={status} value={status} className="bg-[#1f1d2b] text-white">
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => setEditingTable(null)}
                            className="px-3 py-1 text-sm text-white bg-gray-600 rounded hover:bg-gray-700"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => handleStatusChange(table.id, document.querySelector(`select[data-table-id="${table.id}"]`)?.value || table.status)}
                            className="px-3 py-1 text-sm text-white bg-[#ea7c69] rounded hover:bg-opacity-90"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingTable(table.id)}
                        className="w-full bg-[#ea7c69] bg-opacity-10 hover:bg-opacity-20 text-[#fff] py-2 rounded flex items-center justify-center transition-all"
                      >
                        Change Status
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TableManagement;