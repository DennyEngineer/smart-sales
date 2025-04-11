import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";

const AdminDashboard = () => {
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemStock, setNewItemStock] = useState("");
  const [editItemId, setEditItemId] = useState(null);
  const [editItemName, setEditItemName] = useState("");
  const [editItemPrice, setEditItemPrice] = useState("");
  const [editItemStock, setEditItemStock] = useState("");

  // Fetch inventory items from Firestore
  useEffect(() => {
    const fetchItems = async () => {
      const querySnapshot = await getDocs(collection(db, "inventory"));
      const itemsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItems(itemsData);
    };
    fetchItems();
  }, []);

  // Fetch pending orders from Firestore
  useEffect(() => {
    const fetchOrders = async () => {
      const q = query(collection(db, "orders"), where("status", "==", "pending"));
      const querySnapshot = await getDocs(q);
      const ordersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(ordersData);
    };
    fetchOrders();
  }, []);

  // Fetch completed orders from Firestore
  useEffect(() => {
    const fetchCompletedOrders = async () => {
      const q = query(collection(db, "orders"), where("status", "==", "completed"));
      const querySnapshot = await getDocs(q);
      const ordersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCompletedOrders(ordersData);
    };
    fetchCompletedOrders();
  }, []);

  // Add a new item to the inventory
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemName || !newItemPrice || !newItemStock) return;

    try {
      await addDoc(collection(db, "inventory"), {
        name: newItemName,
        price: parseFloat(newItemPrice),
        stock: parseInt(newItemStock),
      });
      setNewItemName("");
      setNewItemPrice("");
      setNewItemStock("");
      alert("Item added successfully!");
    } catch (error) {
      console.error("Error adding item:", error.message);
    }
  };

  // Delete an item from the inventory
  const handleDeleteItem = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await deleteDoc(doc(db, "inventory", id));
        setItems(items.filter((item) => item.id !== id));
        alert("Item deleted successfully!");
      } catch (error) {
        console.error("Error deleting item:", error.message);
      }
    }
  };

  // Edit an item in the inventory
  const handleEditItem = async (id) => {
    if (!editItemName || !editItemPrice || !editItemStock) return;

    try {
      await updateDoc(doc(db, "inventory", id), {
        name: editItemName,
        price: parseFloat(editItemPrice),
        stock: parseInt(editItemStock),
      });
      setEditItemId(null);
      setEditItemName("");
      setEditItemPrice("");
      setEditItemStock("");
      alert("Item updated successfully!");
    } catch (error) {
      console.error("Error updating item:", error.message);
    }
  };

  // Mark an order as completed
  const handleCompleteOrder = async (id) => {
    try {
      await updateDoc(doc(db, "orders", id), {
        status: "completed",
      });
      setOrders(orders.filter((order) => order.id !== id));
      alert("Order marked as completed!");
    } catch (error) {
      console.error("Error completing order:", error.message);
    }
  };

  // Calculate total revenue from completed orders
  const totalRevenue = completedOrders.reduce(
    (sum, order) => sum + order.totalPrice,
    0
  );

  return (
    <div className="min-h-screen bg-[#252836] text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Pending Orders Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Pending Orders</h2>
        <ul className="space-y-4">
          {orders.length > 0 ? (
            orders.map((order) => (
              <li key={order.id} className="bg-[#1f1d2b] p-4 rounded flex justify-between items-center">
                <div>
                  <p className="font-bold">{order.customerName}</p>
                  <p>Total: ${order.totalPrice.toFixed(2)}</p>
                  <p>Items:</p>
                  <ul className="pl-4">
                    {order.items.map((item, index) => (
                      <li key={index}>
                        {item.name} x {item.quantity} - ${item.price.toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => handleCompleteOrder(order.id)}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition duration-300"
                >
                  Complete Order
                </button>
              </li>
            ))
          ) : (
            <p>No pending orders.</p>
          )}
        </ul>
      </div>

      {/* Sales Report Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Sales Report</h2>
        <p className="text-lg">Total Revenue: ${totalRevenue.toFixed(2)}</p>
        <ul className="space-y-4 mt-4">
          {completedOrders.map((order) => (
            <li key={order.id} className="bg-[#1f1d2b] p-4 rounded">
              <p className="font-bold">{order.customerName}</p>
              <p>Total: ${order.totalPrice.toFixed(2)}</p>
              <p>Items:</p>
              <ul className="pl-4">
                {order.items.map((item, index) => (
                  <li key={index}>
                    {item.name} x {item.quantity} - ${item.price.toFixed(2)}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>

      {/* Inventory Management Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Inventory</h2>
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id} className="bg-[#1f1d2b] p-4 rounded flex justify-between items-center">
              {editItemId === item.id ? (
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={editItemName}
                    onChange={(e) => setEditItemName(e.target.value)}
                    className="px-4 py-2 bg-[#252836] border border-[#ea7c69] rounded text-white focus:outline-none"
                  />
                  <input
                    type="number"
                    value={editItemPrice}
                    onChange={(e) => setEditItemPrice(e.target.value)}
                    className="px-4 py-2 bg-[#252836] border border-[#ea7c69] rounded text-white focus:outline-none"
                  />
                  <input
                    type="number"
                    value={editItemStock}
                    onChange={(e) => setEditItemStock(e.target.value)}
                    className="px-4 py-2 bg-[#252836] border border-[#ea7c69] rounded text-white focus:outline-none"
                  />
                </div>
              ) : (
                <span>
                  {item.name} - ${item.price.toFixed(2)} (Stock: {item.stock})
                </span>
              )}
              <div className="flex gap-2">
                {editItemId === item.id ? (
                  <button
                    onClick={() => handleEditItem(item.id)}
                    className="bg-[#ea7c69] text-white px-4 py-2 rounded hover:bg-[#ffffff] hover:text-[#252836] transition duration-300"
                  >
                    Save
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditItemId(item.id);
                        setEditItemName(item.name);
                        setEditItemPrice(item.price.toString());
                        setEditItemStock(item.stock.toString());
                      }}
                      className="bg-[#ea7c69] text-white px-4 py-2 rounded hover:bg-[#ffffff] hover:text-[#252836] transition duration-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition duration-300"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Add Item Form */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Item</h2>
        <form onSubmit={handleAddItem} className="flex gap-4">
          <input
            type="text"
            placeholder="Item Name"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="px-4 py-2 bg-[#1f1d2b] border border-[#ea7c69] rounded text-white focus:outline-none"
            required
          />
          <input
            type="number"
            placeholder="Price"
            value={newItemPrice}
            onChange={(e) => setNewItemPrice(e.target.value)}
            className="px-4 py-2 bg-[#1f1d2b] border border-[#ea7c69] rounded text-white focus:outline-none"
            required
          />
          <input
            type="number"
            placeholder="Stock"
            value={newItemStock}
            onChange={(e) => setNewItemStock(e.target.value)}
            className="px-4 py-2 bg-[#1f1d2b] border border-[#ea7c69] rounded text-white focus:outline-none"
            required
          />
          <button
            type="submit"
            className="bg-[#ea7c69] text-white px-4 py-2 rounded hover:bg-[#ffffff] hover:text-[#252836] transition duration-300"
          >
            Add Item
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;