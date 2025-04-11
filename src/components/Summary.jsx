import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import Sidebar from "./Sidebar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { FiDollarSign, FiShoppingCart, FiPackage, FiLogOut, FiClock, FiUser, FiRefreshCw, FiPlus } from "react-icons/fi";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

const Summary = () => {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [lowStockItems, setLowStockItems] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [timeFilter, setTimeFilter] = useState("month"); // "week", "month", "year"
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState({
    revenue: true,
    orders: true,
    items: true,
    recent: true,
    sales: true
  });
  const [error, setError] = useState({
    revenue: null,
    orders: null,
    items: null,
    recent: null,
    sales: null
  });
  const navigate = useNavigate();

  // Refresh data function
  const refreshData = () => {
    setIsRefreshing(true);
    setLoading({
      revenue: true,
      orders: true,
      items: true,
      recent: true,
      sales: true
    });
    
    fetchData().finally(() => {
      setIsRefreshing(false);
    });
  };

  // Fetch all dashboard data
  const fetchData = async () => {
    try {
      // First fetch all orders - we'll filter them in memory to avoid complex queries
      const ordersSnapshot = await getDocs(collection(db, "orders"));
      const ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      // Set total orders
      setTotalOrders(ordersData.length);
      setLoading(prev => ({...prev, orders: false}));

      // Set recent orders (limited to 5)
      const sortedOrders = [...ordersData].sort((a, b) => {
        if (!a.timestamp || !b.timestamp) return 0;
        return b.timestamp.seconds - a.timestamp.seconds;
      });
      setRecentOrders(sortedOrders.slice(0, 5));
      setLoading(prev => ({...prev, recent: false}));

      // Calculate total revenue from completed orders
      const revenue = ordersData
        .filter(order => order.status === "completed")
        .reduce((sum, order) => sum + order.totalPrice, 0);
        
      setTotalRevenue(revenue);
      setLoading(prev => ({...prev, revenue: false}));

      // Process sales data for chart based on time filter
      const completedOrders = ordersData.filter(order => order.status === "completed" && order.timestamp);
      
      // Prepare chart data based on time filter
      const aggregatedData = {};
      
      completedOrders.forEach((order) => {
        if (order.timestamp) {
          const date = new Date(order.timestamp.seconds * 1000);
          
          let periodKey;
          if (timeFilter === "week") {
            // Group by day of week
            periodKey = date.toLocaleString("default", { weekday: "short" });
          } else if (timeFilter === "month") {
            // Group by day of month
            periodKey = date.getDate().toString();
          } else {
            // Group by month for year view
            periodKey = date.toLocaleString("default", { month: "short" });
          }
          
          if (!aggregatedData[periodKey]) {
            aggregatedData[periodKey] = {
              period: periodKey,
              revenue: 0,
              orders: 0
            };
          }
          
          aggregatedData[periodKey].revenue += order.totalPrice;
          aggregatedData[periodKey].orders += 1;
        }
      });
      
      // Convert to array and sort
      let chartData = Object.values(aggregatedData);
      
      // Sort by period
      if (timeFilter === "week") {
        const daysOrder = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        chartData.sort((a, b) => daysOrder.indexOf(a.period) - daysOrder.indexOf(b.period));
      } else if (timeFilter === "month") {
        chartData.sort((a, b) => parseInt(a.period) - parseInt(b.period));
      } else {
        const monthsOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        chartData.sort((a, b) => monthsOrder.indexOf(a.period) - monthsOrder.indexOf(b.period));
      }
      
      setSalesData(chartData);
      setLoading(prev => ({...prev, sales: false}));

      // Fetch inventory items
      const itemsSnapshot = await getDocs(collection(db, "inventory"));
      const inventoryItems = itemsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      setTotalItems(inventoryItems.length);
      
      // Count items with low stock (quantity < 10)
      const lowStock = inventoryItems.filter(item => item.quantity < 10).length;
      setLowStockItems(lowStock);
      setLoading(prev => ({...prev, items: false}));
      
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(prev => ({
        ...prev, 
        revenue: "Failed to load revenue data",
        orders: "Failed to load orders data",
        items: "Failed to load inventory data",
        recent: "Failed to load recent orders",
        sales: "Failed to load sales data"
      }));
      
      // Reset loading states on error
      setLoading({
        revenue: false,
        orders: false,
        items: false,
        recent: false,
        sales: false
      });
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [timeFilter]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
      alert("Failed to log out. Please try again.");
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
          <div>
            <h1 className="text-2xl font-semibold text-white">Dashboard Overview</h1>
            <p className="text-gray-400">Welcome back! Here's what's happening with your store.</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className={`flex items-center gap-2 bg-[#1f1d2b] text-white px-4 py-2 rounded-lg transition duration-300 ${isRefreshing ? 'opacity-50' : 'hover:bg-[#393C49]'}`}
            >
              <FiRefreshCw className={`${isRefreshing ? 'animate-spin' : ''}`} /> {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-[#1f1d2b] hover:bg-[#ea7c69] text-white px-4 py-2 rounded-lg transition duration-300"
            >
              <FiLogOut /> Logout
            </button>
          </div>
        </div>

        {/* Time Filter */}
        <div className="flex justify-end mb-6">
          <div className="inline-flex bg-[#1f1d2b] rounded-lg overflow-hidden">
            <button 
              onClick={() => setTimeFilter("week")}
              className={`px-4 py-2 text-sm ${timeFilter === "week" ? 'bg-[#ea7c69] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Week
            </button>
            <button 
              onClick={() => setTimeFilter("month")}
              className={`px-4 py-2 text-sm ${timeFilter === "month" ? 'bg-[#ea7c69] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Month
            </button>
            <button 
              onClick={() => setTimeFilter("year")}
              className={`px-4 py-2 text-sm ${timeFilter === "year" ? 'bg-[#ea7c69] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Year
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Revenue Card */}
          <div className="bg-[#1f1d2b] p-6 rounded-lg border border-[#393C49] hover:border-[#ea7c69] transition-colors">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 rounded-full bg-[#ea7c69] bg-opacity-20">
                <FiDollarSign className="text-xl text-[#ea7c69]" />
              </div>
              <div>
                <h3 className="text-gray-400">Total Revenue</h3>
                {loading.revenue ? (
                  <div className="h-8 w-24 bg-[#252836] rounded animate-pulse"></div>
                ) : error.revenue ? (
                  <p className="text-red-500">{error.revenue}</p>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-white">${totalRevenue.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-400">From all completed orders</p>
          </div>

          {/* Orders Card */}
          <div className="bg-[#1f1d2b] p-6 rounded-lg border border-[#393C49] hover:border-[#ea7c69] transition-colors">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 rounded-full bg-[#ea7c69] bg-opacity-20">
                <FiShoppingCart className="text-xl text-[#ea7c69]" />
              </div>
              <div>
                <h3 className="text-gray-400">Total Orders</h3>
                {loading.orders ? (
                  <div className="h-8 w-24 bg-[#252836] rounded animate-pulse"></div>
                ) : error.orders ? (
                  <p className="text-red-500">{error.orders}</p>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-white">{totalOrders}</p>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-400">All orders in system</p>
          </div>

          {/* Inventory Card */}
          <div className="bg-[#1f1d2b] p-6 rounded-lg border border-[#393C49] hover:border-[#ea7c69] transition-colors">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 rounded-full bg-[#ea7c69] bg-opacity-20">
                <FiPackage className="text-xl text-[#ea7c69]" />
              </div>
              <div>
                <h3 className="text-gray-400">Inventory Items</h3>
                {loading.items ? (
                  <div className="h-8 w-24 bg-[#252836] rounded animate-pulse"></div>
                ) : error.items ? (
                  <p className="text-red-500">{error.items}</p>
                ) : (
                  <p className="text-2xl font-bold text-white">{totalItems}</p>
                )}
              </div>
            </div>
            {lowStockItems > 0 && (
              <p className="text-xs text-yellow-400">{lowStockItems} item{lowStockItems !== 1 ? 's' : ''} low on stock</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#1f1d2b] p-4 rounded-lg border border-[#393C49] mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate('/add-items')}
              className="flex flex-col items-center justify-center p-4 bg-[#252836] rounded-lg hover:bg-[#ea7c69] hover:text-white transition-colors"
            >
              <FiPlus className="text-xl mb-2" />
              <span>Add Product</span>
            </button>
            <button 
              onClick={() => navigate('/inventory')}
              className="flex flex-col items-center justify-center p-4 bg-[#252836] rounded-lg hover:bg-[#ea7c69] hover:text-white transition-colors"
            >
              <FiPackage className="text-xl mb-2" />
              <span>Manage Inventory</span>
            </button>
            <button 
              onClick={() => navigate('/sales-report')}
              className="flex flex-col items-center justify-center p-4 bg-[#252836] rounded-lg hover:bg-[#ea7c69] hover:text-white transition-colors"
            >
              <FiClock className="text-xl mb-2" />
              <span>View All Orders</span>
            </button>
          </div>
        </div>

        {/* Charts and Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sales Chart */}
          <div className="bg-[#1f1d2b] p-6 rounded-lg border border-[#393C49]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                {timeFilter === "week" ? "Weekly" : timeFilter === "month" ? "Monthly" : "Yearly"} Sales
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <FiClock /> {timeFilter === "week" ? "By Day" : timeFilter === "month" ? "By Date" : "By Month"}
              </div>
            </div>
            {loading.sales ? (
              <div className="h-64 bg-[#252836] rounded animate-pulse"></div>
            ) : error.sales ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-red-500">{error.sales}</p>
              </div>
            ) : salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#393C49" />
                  <XAxis dataKey="period" stroke="#fff" />
                  <YAxis stroke="#fff" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f1d2b', borderColor: '#393C49' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="revenue" 
                    fill="#ea7c69" 
                    radius={[4, 4, 0, 0]}
                    name="Revenue ($)"
                  />
                  <Bar 
                    dataKey="orders" 
                    fill="#6E5AC3" 
                    radius={[4, 4, 0, 0]}
                    name="Orders"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No sales data available
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="bg-[#1f1d2b] p-6 rounded-lg border border-[#393C49]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
              <button 
                onClick={() => navigate('/sales-report')}
                className="text-sm text-[#ea7c69] hover:text-[#ff9e8e] flex items-center"
              >
                View All Orders ({totalOrders})
              </button>
            </div>
            {loading.recent ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-[#252836] rounded animate-pulse"></div>
                ))}
              </div>
            ) : error.recent ? (
              <p className="text-red-500 p-4">{error.recent}</p>
            ) : recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="flex items-center justify-between p-4 bg-[#252836] rounded-lg hover:bg-[#2d303d] transition-colors cursor-pointer"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <div>
                      <p className="font-medium text-white">{order.customerName || "Anonymous Customer"}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-400">${order.totalPrice.toFixed(2)}</p>
                        {order.timestamp && (
                          <p className="text-xs text-gray-500">
                            {new Date(order.timestamp.seconds * 1000).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs rounded-full ${
                      order.status === 'pending' ? 'bg-yellow-900 text-yellow-100' : 
                      order.status === 'completed' ? 'bg-green-900 text-green-100' : 
                      'bg-red-900 text-red-100'
                    }`}>
                      {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || "Unknown"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No recent orders
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Summary;