import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  where,
  query,
  setDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase";

import { FaShoppingCart, FaCheckCircle, FaBell, FaBoxes, FaTimes, FaPlus, FaMinus, FaArrowRight, FaTable } from "react-icons/fa";

const BuyerDashboard = () => {
  const [items, setItems] = useState([]); // Menu items
  const [cart, setCart] = useState({}); // Cart: { itemId: quantity }
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state
  const [activeCategory, setActiveCategory] = useState("all");
  const [tables, setTables] = useState([]); // Available tables
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    payOnDelivery: true,
    tableId: "", // Added table selection
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize tables in Firestore if they don't exist
  useEffect(() => {
    const initializeTables = async () => {
      try {
        // Check if tables collection has any documents
        const tablesSnapshot = await getDocs(collection(db, "tables"));
        
        // If no tables exist, create default tables
        if (tablesSnapshot.empty) {
          console.log("No tables found. Creating default tables...");
          const defaultTables = ["table1", "table2", "table3", "table4", "table5", "table6"];
          
          // Create each table
          for (const tableId of defaultTables) {
            await setDoc(doc(db, "tables", tableId), {
              status: "free",
              orderId: null,
              timestamp: serverTimestamp()
            });
            console.log(`Created table: ${tableId}`);
          }
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing tables:", error);
      }
    };
    
    initializeTables();
  }, []);

  // Fetch inventory items from Firestore
  useEffect(() => {
    const fetchItems = async () => {
      const querySnapshot = await getDocs(collection(db, "inventory"));
      const itemsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        category: doc.data().category || "other", // Add default category if none exists
      }));
      setItems(itemsData);
    };
    fetchItems();
  }, []);

  // Fetch tables from Firestore
  useEffect(() => {
    if (!isInitialized) return;
    
    const fetchTables = async () => {
      try {
        // Get all tables first instead of filtering
        const querySnapshot = await getDocs(collection(db, "tables"));
        const tablesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        // Filter for free tables client-side
        const freeTables = tablesData.filter(table => table.status === "free");
        setTables(freeTables);
      } catch (error) {
        console.error("Error fetching tables:", error);
      }
    };
    
    fetchTables();
  }, [isModalOpen, isInitialized]); // Re-fetch when modal opens or after initialization

  // Get unique categories
  const categories = ["all", ...new Set(items.map(item => item.category))];

  // Filter items by category
  const filteredItems = activeCategory === "all" 
    ? items 
    : items.filter(item => item.category === activeCategory);

  // Handle adding/removing items from the cart
  const updateCart = (itemId, quantity) => {
    setCart((prevCart) => {
      const newCart = { ...prevCart };
      if (quantity > 0) {
        newCart[itemId] = quantity;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  // Calculate cart total
  const calculateTotal = () => {
    return Object.keys(cart).reduce((sum, itemId) => {
      const item = items.find(i => i.id === itemId);
      return sum + (item ? item.price * cart[itemId] : 0);
    }, 0);
  };

  // Open the modal and reset customer info
  const openModal = () => {
    setCustomerInfo({
      name: "",
      phone: "",
      payOnDelivery: true,
      tableId: "", // Reset table selection
    });
    setIsModalOpen(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCustomerInfo((prevInfo) => ({
      ...prevInfo,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Place an order and save it to Firestore
  const placeOrder = async () => {
    try {
      // Create order items array and check inventory
      const orderItems = [];
      const inventoryUpdates = [];
      
      // Check if we have enough stock for all items
      for (const itemId in cart) {
        const item = items.find((i) => i.id === itemId);
        if (!item) continue;
        
        const orderedQuantity = cart[itemId];
        
        // Check if enough stock is available
        if (item.stock < orderedQuantity) {
          alert(`Not enough stock for ${item.name}. Only ${item.stock} available.`);
          return;
        }
        
        // Add to order items
        orderItems.push({
          id: itemId,
          name: item.name,
          price: item.price,
          quantity: orderedQuantity,
        });
        
        // Prepare inventory update
        inventoryUpdates.push({
          id: itemId,
          newStock: item.stock - orderedQuantity
        });
      }

      const totalPrice = calculateTotal();

      // Validate customer info
      if (!customerInfo.name || !customerInfo.phone) {
        alert("Please fill in all required fields.");
        return;
      }

      // Validate table selection if tables are available and the user is dining in
      if (tables.length > 0 && !customerInfo.tableId) {
        alert("Please select a table.");
        return;
      }

      // Create order data
      const orderData = {
        customerName: customerInfo.name,
        phone: customerInfo.phone,
        paymentMethod: customerInfo.payOnDelivery ? "Pay on Delivery" : "Other",
        items: orderItems,
        totalPrice,
        status: "pending",
        timestamp: serverTimestamp(),
      };
      
      // Add tableId only if one was selected
      if (customerInfo.tableId) {
        orderData.tableId = customerInfo.tableId;
      }

      // Save the order to Firestore
      const orderRef = await addDoc(collection(db, "orders"), orderData);

      // Update inventory for each item
      for (const update of inventoryUpdates) {
        const itemRef = doc(db, "inventory", update.id);
        await updateDoc(itemRef, {
          stock: update.newStock
        });
      }

      // If a table was selected, update its status
      if (customerInfo.tableId) {
        try {
          const tableRef = doc(db, "tables", customerInfo.tableId);
          await updateDoc(tableRef, {
            status: "occupied",
            orderId: orderRef.id,
            timestamp: serverTimestamp(),
          });
        } catch (error) {
          console.error("Error updating table:", error);
          alert("Order placed but table status couldn't be updated.");
        }
      }

      // Update local state to reflect inventory changes
      setItems(prevItems => {
        return prevItems.map(item => {
          const update = inventoryUpdates.find(u => u.id === item.id);
          if (update) {
            return { ...item, stock: update.newStock };
          }
          return item;
        });
      });

      // Close the modal and clear the cart
      setIsModalOpen(false);
      setCart({});
      alert("Order placed successfully!");

      // Print the receipt
      printReceipt(orderItems, totalPrice);
    } catch (error) {
      console.error("Error placing order:", error.message);
      alert("Failed to place order. Please try again.");
    }
  };

  // Print the receipt
  const printReceipt = (orderItems, totalPrice) => {
    // Get the table name/number if a table was selected
    const selectedTable = tables.find(table => table.id === customerInfo.tableId);
    const tableInfo = selectedTable ? `<p><strong>Table:</strong> ${selectedTable.id}</p>` : '';

    const receiptContent = `
      <h1>Order Receipt</h1>
      <p><strong>Customer Name:</strong> ${customerInfo.name}</p>
      <p><strong>Phone Number:</strong> ${customerInfo.phone}</p>
      ${tableInfo}
      <p><strong>Payment Method:</strong> ${
        customerInfo.payOnDelivery ? "Pay on Delivery" : "Other"
      }</p>
      <h2>Order Details:</h2>
      <ul>
        ${orderItems
          .map(
            (item) =>
              `<li>${item.name} x ${item.quantity} - $${(
                item.price * item.quantity
              ).toFixed(2)}</li>`
          )
          .join("")}
      </ul>
      <p><strong>Total Price:</strong> $${totalPrice.toFixed(2)}</p>
    `;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              padding: 20px;
            }
            h1, h2 {
              color: #333;
            }
            p {
              margin: 5px 0;
            }
            ul {
              list-style-type: none;
              padding: 0;
            }
            li {
              background-color: #fff;
              margin: 5px 0;
              padding: 10px;
              border-radius: 5px;
              box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            }
          </style>
        </head>
        <body>
          ${receiptContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="min-h-screen bg-[#1f1d2b] text-white flex">
      {/* Sidebar */}
      <div className="hidden lg:block w-64 bg-[#252836] p-6 flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-8 text-center text-[#ea7c69]">Food Order</h2>
          
          <div className="space-y-4">
            <p className="text-gray-400 text-sm uppercase">Categories</p>
            {categories.map(category => (
              <div 
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`p-3 rounded-lg cursor-pointer flex items-center transition-all ${
                  activeCategory === category 
                    ? "bg-[#ea7c69] text-white" 
                    : "hover:bg-[#2d303e] text-gray-300"
                }`}
              >
                <span className="capitalize">{category}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-auto pt-6 border-t border-gray-700">
          <p className="text-gray-400 text-sm mb-2">Customer Support</p>
          <p className="text-gray-300">help@foodorder.com</p>
          <p className="text-gray-300">+1 234 567 8900</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-[#1f1d2b] px-8 py-6 flex justify-between items-center border-b border-gray-800">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="ml-6 hidden md:flex">
              {categories.slice(0, 4).map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 mx-1 rounded-full text-sm ${
                    activeCategory === category
                      ? "bg-[#ea7c69] text-white"
                      : "bg-[#252836] text-gray-300 hover:bg-[#2d303e]"
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div 
              className="relative cursor-pointer lg:hidden"
              onClick={() => document.getElementById('cart-drawer').classList.toggle('translate-x-full')}
            >
              <FaShoppingCart className="text-xl text-gray-300 hover:text-[#ea7c69]" />
              {Object.keys(cart).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#ea7c69] text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                  {Object.keys(cart).length}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Menu Grid */}
          <div className="flex-1 p-8 overflow-y-auto">
            <h2 className="text-xl font-semibold mb-6">Available Items</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-[#252836] rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:translate-y-1"
              >
                <div className="h-32 bg-[#2d303e] flex items-center justify-center">
                  {/* Render Image */}
                  {item.imageFileName ? (
                    <img
                      src={`/${item.imageFileName}`} // Use the image file name from Firestore
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-[#ea7c69] bg-opacity-20 flex items-center justify-center text-[#ea7c69]">
                      <FaBoxes size={32} />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">{item.name}</h3>
                    <span className="text-[#ea7c69] font-bold">${item.price.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">Stock: {item.stock}</p>
                  <div className="flex items-center justify-between bg-[#2d303e] rounded-lg p-1">
                    <button
                      onClick={() => updateCart(item.id, (cart[item.id] || 0) - 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-md bg-[#252836] text-gray-300 hover:text-white disabled:opacity-50"
                      disabled={!cart[item.id]}
                    >
                      <FaMinus size={12} />
                    </button>
                    <span className="font-medium">{cart[item.id] || 0}</span>
                    <button
                      onClick={() => updateCart(item.id, (cart[item.id] || 0) + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-md bg-[#ea7c69] text-white hover:bg-opacity-90 disabled:opacity-50"
                      disabled={(cart[item.id] || 0) >= item.stock}
                    >
                      <FaPlus size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>

          {/* Cart Sidebar */}
          <div id="cart-drawer" className="bg-[#252836] w-full max-w-sm flex-shrink-0 transition-transform duration-300 transform translate-x-0 lg:translate-x-0 absolute top-0 right-0 bottom-0 z-20 lg:static">
            <div className="h-full flex flex-col p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Your Cart</h2>
                <button 
                  className="lg:hidden text-gray-400 hover:text-white"
                  onClick={() => document.getElementById('cart-drawer').classList.add('translate-x-full')}
                >
                  <FaTimes />
                </button>
              </div>

              {Object.keys(cart).length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                  <FaShoppingCart size={48} className="mb-4 text-gray-600" />
                  <p className="text-center">Your cart is empty</p>
                  <p className="text-center text-sm mt-2">Add items to get started</p>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto">
                    <div className="space-y-4">
                      {Object.keys(cart).map((itemId) => {
                        const item = items.find((i) => i.id === itemId);
                        if (!item) return null;
                        return (
                          <div key={itemId} className="bg-[#1f1d2b] p-4 rounded-xl flex items-center">
                            <div className="mr-4 w-10 h-10 rounded-full bg-[#ea7c69] bg-opacity-20 flex items-center justify-center text-[#ea7c69]">
                              <FaBoxes />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium">{item.name}</h3>
                              <p className="text-sm text-gray-400">${item.price.toFixed(2)} x {cart[itemId]}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-[#ea7c69]">${(item.price * cart[itemId]).toFixed(2)}</p>
                              <div className="flex items-center justify-end mt-1">
                                <button
                                  onClick={() => updateCart(itemId, cart[itemId] - 1)}
                                  className="text-sm text-gray-400 hover:text-white"
                                >
                                  <FaMinus size={10} />
                                </button>
                                <span className="mx-2 text-sm">{cart[itemId]}</span>
                                <button
                                  onClick={() => updateCart(itemId, cart[itemId] + 1)}
                                  className="text-sm text-[#ea7c69]"
                                  disabled={cart[itemId] >= item.stock}
                                >
                                  <FaPlus size={10} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-6 border-t border-gray-700 pt-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400">Subtotal</span>
                      <span className="font-medium">${calculateTotal().toFixed(2)}</span>
                    </div>
                    <button
                      onClick={openModal}
                      className="mt-4 w-full bg-[#ea7c69] text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all"
                    >
                      Checkout <FaArrowRight size={12} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Customer Info */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
          <div className="bg-[#252836] rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-[#1f1d2b] p-6">
              <h2 className="text-2xl font-bold">Complete Your Order</h2>
              <p className="text-gray-400">Please provide your details</p>
            </div>
            
            <form className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={customerInfo.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-[#1f1d2b] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#ea7c69]"
                    placeholder="John Doe"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={customerInfo.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-[#1f1d2b] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#ea7c69]"
                    placeholder="+1 234 567 8900"
                    required
                  />
                </div>
                
                {/* Table Selection */}
                {tables.length > 0 && (
                  <div>
                    <label htmlFor="tableId" className="block text-sm font-medium text-gray-300 mb-1">
                      Select Table
                    </label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {tables.map((table) => (
                        <div
                          key={table.id}
                          onClick={() => setCustomerInfo({ ...customerInfo, tableId: table.id })}
                          className={`border rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer transition-all ${
                            customerInfo.tableId === table.id
                              ? "border-[#ea7c69] bg-[#ea7c69] bg-opacity-20"
                              : "border-gray-700 hover:border-gray-500"
                          }`}
                        >
                          <FaTable size={24} className={customerInfo.tableId === table.id ? "text-[#ea7c69]" : "text-gray-400"} />
                          <span className="text-sm mt-1">{table.id}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center py-2">
                  <input
                    type="checkbox"
                    id="payOnDelivery"
                    name="payOnDelivery"
                    checked={customerInfo.payOnDelivery}
                    onChange={handleInputChange}
                    className="w-5 h-5 rounded bg-[#1f1d2b] border-gray-700 text-[#ea7c69] focus:ring-[#ea7c69]"
                  />
                  <label htmlFor="payOnDelivery" className="ml-2 text-gray-300">
                    Pay on Delivery
                  </label>
                </div>
              </div>
              
              <div className="mt-8 flex gap-4">
                <button
                  type="button"
                  className="flex-1 px-4 py-3 bg-[#1f1d2b] text-white rounded-lg hover:bg-[#2d303e] transition-colors"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="flex-1 px-4 py-3 bg-[#ea7c69] text-white rounded-lg flex items-center justify-center gap-2 hover:bg-opacity-90 transition-colors"
                  onClick={placeOrder}
                >
                  Place Order <FaCheckCircle />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerDashboard;