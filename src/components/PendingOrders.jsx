import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import Sidebar from "./Sidebar";
import { FiCheckCircle, FiClipboard, FiPhone, FiDollarSign, FiClock } from "react-icons/fi";
import { FaClipboardList, FaTable } from "react-icons/fa";

const PendingOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch pending orders from Firestore
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "orders"));
        const ordersData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(ordersData.filter((order) => order.status === "pending"));
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Filter orders based on search term
  const filteredOrders = orders.filter(order =>
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.phone && order.phone.includes(searchTerm))
  );

  // Mark an order as completed
  const handleCompleteOrder = async (id) => {
    try {
      // Get the order to check if it has a tableId
      const orderToComplete = orders.find(order => order.id === id);
      
      await updateDoc(doc(db, "orders", id), {
        status: "completed",
      });

      // If the order has a tableId, update the table status
      if (orderToComplete && orderToComplete.tableId) {
        try {
          await updateDoc(doc(db, "tables", orderToComplete.tableId), {
            status: "free",
            orderId: null,
          });
          console.log(`Table ${orderToComplete.tableId} marked as free`);
        } catch (tableError) {
          console.error("Error updating table status:", tableError);
          // We still continue even if table update fails
        }
      }
      
      setOrders(orders.filter((order) => order.id !== id));
    } catch (error) {
      console.error("Error completing order:", error);
      alert("Failed to complete order. Please try again.");
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
            <FaClipboardList className="text-2xl text-[#ea7c69]" />
            <h1 className="text-2xl font-semibold text-white">Pending Orders</h1>
          </div>
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search orders..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#1f1d2b] border border-[#393C49] text-white focus:outline-none focus:ring-1 focus:ring-[#ea7c69]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FiClipboard className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>

        {/* Stats Card */}
        <div className="mb-8 bg-[#1f1d2b] rounded-lg shadow border border-[#393C49] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-[#ea7c69] bg-opacity-20">
                <FiClock className="text-xl text-[#ea7c69]" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-400">Pending Orders</h3>
                <p className="text-2xl font-bold text-white">{orders.length}</p>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-[#1f1d2b] rounded-lg shadow overflow-hidden border border-[#393C49]">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              {searchTerm ? "No matching orders found" : "No pending orders"}
            </div>
          ) : (
            <div className="divide-y divide-[#393C49]">
              {filteredOrders.map((order) => (
                <div key={order.id} className="p-6 hover:bg-[#252836] transition-colors">
                  <div className="flex justify-between items-start">
                    {/* Order Details */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="flex-shrink-0 h-10 w-10 bg-[#252836] rounded-full flex items-center justify-center border border-[#393C49]">
                          <FiClipboard className="h-5 w-5 text-[#ea7c69]" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{order.customerName}</h3>
                          <div className="flex items-center text-gray-400 text-sm mt-1">
                            <FiPhone className="mr-1" /> {order.phone || "N/A"}
                          </div>
                          
                          {/* Display Table Information if available */}
                          {order.tableId && (
                            <div className="flex items-center text-green-400 text-sm mt-1">
                              <FaTable className="mr-1" /> Table: {order.tableId}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="ml-14">
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-400 mb-2">Order Items</h4>
                          <ul className="space-y-2">
                            {order.items.map((item, index) => (
                              <li key={index} className="flex justify-between">
                                <span className="text-white">
                                  {item.name} × {item.quantity}
                                </span>
                                <span className="text-[#ea7c69]">
                                  ${item.price.toFixed(2)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-[#393C49]">
                          <div className="text-sm text-gray-400">
                            Order ID: {order.id.substring(0, 8)}...
                          </div>
                          <div className="flex items-center text-lg font-bold text-white">
                            <FiDollarSign className="mr-1 text-[#ea7c69]" />
                            {order.totalPrice.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleCompleteOrder(order.id)}
                      className="ml-4 bg-[#ea7c69] hover:bg-[#ff9e8e] text-white px-4 py-2 rounded-lg transition duration-300 flex items-center gap-2"
                    >
                      <FiCheckCircle className="text-lg" />
                      Complete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PendingOrders;