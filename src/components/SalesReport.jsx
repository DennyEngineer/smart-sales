import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import Sidebar from "./Sidebar";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { FaArrowUp, FaArrowDown, FaFilter, FaDownload, FaChevronRight, FaChevronDown } from "react-icons/fa";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const SalesReport = () => {
  const [completedOrders, setCompletedOrders] = useState([]);
  const [timeFilter, setTimeFilter] = useState("all");
  const [expandedOrders, setExpandedOrders] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch completed orders from Firestore
  useEffect(() => {
    const fetchCompletedOrders = async () => {
      setLoading(true);
      try {
        let q = query(collection(db, "orders"), where("status", "==", "completed"));
        
        // Apply time filter if needed
        if (timeFilter !== "all") {
          const now = new Date();
          let startDate;
          
          switch (timeFilter) {
            case "week":
              startDate = new Date(now.setDate(now.getDate() - 7));
              break;
            case "month":
              startDate = new Date(now.setMonth(now.getMonth() - 1));
              break;
            case "year":
              startDate = new Date(now.setFullYear(now.getFullYear() - 1));
              break;
            default:
              startDate = null;
          }
          
          if (startDate) {
            q = query(q, where("timestamp", ">=", startDate));
          }
        }
        
        const querySnapshot = await getDocs(q);
        const ordersData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }));
        
        // Sort by most recent first
        ordersData.sort((a, b) => b.timestamp - a.timestamp);
        
        setCompletedOrders(ordersData);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCompletedOrders();
  }, [timeFilter]);

  // Toggle order details expansion
  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  // Calculate total revenue from completed orders
  const totalRevenue = completedOrders.reduce(
    (sum, order) => sum + order.totalPrice,
    0
  );

  // Calculate average order value
  const averageOrderValue = completedOrders.length > 0 
    ? totalRevenue / completedOrders.length 
    : 0;

  // Group revenue by day for the line chart
  const revenueByDay = completedOrders.reduce((acc, order) => {
    const date = order.timestamp.toLocaleDateString();
    acc[date] = (acc[date] || 0) + order.totalPrice;
    return acc;
  }, {});

  // Sort dates chronologically for the line chart
  const sortedDates = Object.keys(revenueByDay).sort((a, b) => new Date(a) - new Date(b));
  const sortedRevenues = sortedDates.map(date => revenueByDay[date]);

  // Group top customers by total spending
  const customerSpending = completedOrders.reduce((acc, order) => {
    acc[order.customerName] = (acc[order.customerName] || 0) + order.totalPrice;
    return acc;
  }, {});

  // Get top 5 customers
  const topCustomers = Object.entries(customerSpending)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Count payment methods for the pie chart
  const paymentMethodCounts = completedOrders.reduce((acc, order) => {
    acc[order.paymentMethod] = (acc[order.paymentMethod] || 0) + 1;
    return acc;
  }, {});

  // Most popular items
  const itemPopularity = completedOrders.reduce((acc, order) => {
    order.items.forEach(item => {
      acc[item.name] = (acc[item.name] || 0) + item.quantity;
    });
    return acc;
  }, {});

  const topItems = Object.entries(itemPopularity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Chart data
  const lineChartData = {
    labels: sortedDates,
    datasets: [
      {
        label: "Daily Revenue",
        data: sortedRevenues,
        fill: true,
        backgroundColor: "rgba(234, 124, 105, 0.2)",
        borderColor: "#ea7c69",
        tension: 0.4,
      },
    ],
  };

  const barChartData = {
    labels: topCustomers.map(([name]) => name.split(' ')[0]), // Use first name for brevity
    datasets: [
      {
        label: "Total Spending ($)",
        data: topCustomers.map(([_, value]) => value),
        backgroundColor: "#ea7c69",
        borderRadius: 6,
      },
    ],
  };

  const pieChartData = {
    labels: Object.keys(paymentMethodCounts),
    datasets: [
      {
        label: "Payment Methods",
        data: Object.values(paymentMethodCounts),
        backgroundColor: ["#ea7c69", "#6c5ecf", "#FFB572"],
        borderWidth: 0,
      },
    ],
  };

  const itemsBarData = {
    labels: topItems.map(([name]) => name),
    datasets: [
      {
        label: "Units Sold",
        data: topItems.map(([_, value]) => value),
        backgroundColor: "#6c5ecf",
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#ffffff',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: '#252836',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#ea7c69',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: '#9A9A9D',
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: '#9A9A9D',
        }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#ffffff',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: '#252836',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#ea7c69',
        borderWidth: 1,
        padding: 12,
      }
    }
  };

  // Export data as CSV
  const exportCSV = () => {
    const headers = ["Customer Name", "Date", "Total Price", "Payment Method", "Items"];
    
    const csvRows = [
      headers.join(','),
      ...completedOrders.map(order => {
        const itemList = order.items
          .map(item => `${item.name}(${item.quantity})`)
          .join(' | ');
        
        return [
          `"${order.customerName}"`,
          order.timestamp.toLocaleDateString(),
          order.totalPrice.toFixed(2),
          `"${order.paymentMethod}"`,
          `"${itemList}"`
        ].join(',');
      })
    ];
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sales_report.csv');
    link.click();
  };

  return (
    <div className="flex bg-[#1f1d2b] text-white min-h-screen">
      {/* Sidebar - Fixed width without collapse functionality */}
      <div className=" bg-[#252836] flex-shrink-0 h-screen sticky top-0">
        <Sidebar collapsed={false} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-x-hidden">
        {/* Header */}
        <header className="bg-[#252836] p-6 sticky top-0 z-10 shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Sales Report</h1>
            <p className="text-gray-400 text-sm">Track your sales performance</p>
          </div>
          
          <div className="flex gap-4">
            <div className="relative">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="bg-[#1f1d2b] border border-gray-700 rounded-lg px-4 py-2 pr-10 appearance-none focus:outline-none focus:border-[#ea7c69]"
              >
                <option value="all">All Time</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
              </select>
              <FaFilter className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
            </div>
            
            <button 
              onClick={exportCSV}
              className="bg-[#ea7c69] hover:bg-opacity-90 text-white rounded-lg px-4 py-2 flex items-center gap-2"
            >
              <FaDownload size={14} /> Export
            </button>
          </div>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6">
          <div className="bg-[#252836] p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-400 text-sm">Total Revenue</p>
                <h3 className="text-2xl font-bold">${totalRevenue.toFixed(2)}</h3>
              </div>
              <div className="bg-[#ea7c69] bg-opacity-20 p-2 rounded-lg">
                <FaArrowUp className="text-[#ea7c69]" />
              </div>
            </div>
            <p className="text-xs text-green-400">{completedOrders.length} completed orders</p>
          </div>
          
          <div className="bg-[#252836] p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-400 text-sm">Average Order</p>
                <h3 className="text-2xl font-bold">${averageOrderValue.toFixed(2)}</h3>
              </div>
              <div className="bg-[#6c5ecf] bg-opacity-20 p-2 rounded-lg">
                <FaArrowUp className="text-[#6c5ecf]" />
              </div>
            </div>
            <p className="text-xs text-gray-400">Per transaction</p>
          </div>
          
          <div className="bg-[#252836] p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-400 text-sm">Most Popular</p>
                <h3 className="text-2xl font-bold truncate max-w-32">
                  {topItems.length > 0 ? topItems[0][0] : "No data"}
                </h3>
              </div>
              <div className="bg-[#FFB572] bg-opacity-20 p-2 rounded-lg">
                <FaArrowUp className="text-[#FFB572]" />
              </div>
            </div>
            <p className="text-xs text-gray-400">
              {topItems.length > 0 ? `${topItems[0][1]} units sold` : "No data"}
            </p>
          </div>
          
          <div className="bg-[#252836] p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-400 text-sm">Top Customer</p>
                <h3 className="text-2xl font-bold truncate max-w-32">
                  {topCustomers.length > 0 ? topCustomers[0][0].split(' ')[0] : "No data"}
                </h3>
              </div>
              <div className="bg-[#65B0F6] bg-opacity-20 p-2 rounded-lg">
                <FaArrowUp className="text-[#65B0F6]" />
              </div>
            </div>
            <p className="text-xs text-gray-400">
              {topCustomers.length > 0 ? `$${topCustomers[0][1].toFixed(2)} spent` : "No data"}
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend Chart */}
          <div className="bg-[#252836] p-6 rounded-xl shadow-lg">
            <h2 className="text-lg font-semibold mb-6">Revenue Trend</h2>
            <div className="h-64">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <p>Loading chart data...</p>
                </div>
              ) : (
                <Line data={lineChartData} options={chartOptions} />
              )}
            </div>
          </div>

          {/* Payment Methods Chart */}
          <div className="bg-[#252836] p-6 rounded-xl shadow-lg">
            <h2 className="text-lg font-semibold mb-6">Payment Methods</h2>
            <div className="h-64">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <p>Loading chart data...</p>
                </div>
              ) : (
                <Pie data={pieChartData} options={pieOptions} />
              )}
            </div>
          </div>

          {/* Top Customers Chart */}
          <div className="bg-[#252836] p-6 rounded-xl shadow-lg">
            <h2 className="text-lg font-semibold mb-6">Top Customers</h2>
            <div className="h-64">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <p>Loading chart data...</p>
                </div>
              ) : (
                <Bar data={barChartData} options={chartOptions} />
              )}
            </div>
          </div>

          {/* Popular Items Chart */}
          <div className="bg-[#252836] p-6 rounded-xl shadow-lg">
            <h2 className="text-lg font-semibold mb-6">Popular Items</h2>
            <div className="h-64">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <p>Loading chart data...</p>
                </div>
              ) : (
                <Bar data={itemsBarData} options={chartOptions} />
              )}
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="p-6">
          <div className="bg-[#252836] rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Recent Orders</h2>
              <p className="text-sm text-gray-400">Showing {completedOrders.length} completed orders</p>
            </div>
            
            {loading ? (
              <div className="p-6 flex justify-center">
                <p>Loading orders...</p>
              </div>
            ) : completedOrders.length === 0 ? (
              <div className="p-6 text-center">
                <p>No completed orders found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#1f1d2b] text-gray-400 text-sm">
                      <th className="py-3 px-4 text-left">Customer</th>
                      <th className="py-3 px-4 text-left">Date</th>
                      <th className="py-3 px-4 text-left">Amount</th>
                      <th className="py-3 px-4 text-left">Payment</th>
                      <th className="py-3 px-4 text-left">Items</th>
                      <th className="py-3 px-4 text-left sr-only">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedOrders.map((order) => (
                      <React.Fragment key={order.id}>
                        <tr className="border-b border-gray-700 hover:bg-[#2d303e] cursor-pointer" onClick={() => toggleOrderExpansion(order.id)}>
                          <td className="py-4 px-4">{order.customerName}</td>
                          <td className="py-4 px-4">{order.timestamp.toLocaleDateString()}</td>
                          <td className="py-4 px-4 font-medium">${order.totalPrice.toFixed(2)}</td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              order.paymentMethod === "Pay on Delivery" 
                                ? "bg-[#ea7c69] bg-opacity-20 text-white" 
                                : "bg-green-500 bg-opacity-20 text-green-500"
                            }`}>
                              {order.paymentMethod}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-gray-400">{order.items.length} items</td>
                          <td className="py-4 px-4">
                            {expandedOrders[order.id] ? 
                              <FaChevronDown className="text-gray-400" /> : 
                              <FaChevronRight className="text-gray-400" />
                            }
                          </td>
                        </tr>
                        {expandedOrders[order.id] && (
                          <tr className="bg-[#1f1d2b]">
                            <td colSpan="6" className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium mb-2">Order Details</h4>
                                  <p className="text-sm text-gray-400 mb-1">Order ID: {order.id}</p>
                                  <p className="text-sm text-gray-400 mb-1">Time: {order.timestamp.toLocaleTimeString()}</p>
                                  <p className="text-sm text-gray-400">Phone: {order.phone || "Not provided"}</p>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Items</h4>
                                  <ul className="space-y-2">
                                    {order.items.map((item, index) => (
                                      <li key={index} className="flex justify-between text-sm">
                                        <span>
                                          {item.name} × {item.quantity}
                                        </span>
                                        <span className="text-[#ea7c69]">
                                          ${(item.price * item.quantity).toFixed(2)}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesReport;