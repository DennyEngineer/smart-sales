import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import Sidebar from "./Sidebar";
import { FaBoxOpen, FaDollarSign, FaWarehouse, FaPlusCircle } from "react-icons/fa"; // Icons for aesthetics

const AddItems = () => {
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemStock, setNewItemStock] = useState("");

  // Add a new item to the inventory
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemName || !newItemPrice || !newItemStock) {
      alert("Please fill in all fields.");
      return;
    }

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

  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 bg-[#252836] text-white p-8 min-h-screen">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <FaBoxOpen className="text-4xl text-[#ea7c69]" />
          <h1 className="text-3xl font-bold">Add New Item</h1>
        </header>

        {/* Form */}
        <form onSubmit={handleAddItem} className="space-y-6 max-w-md">
          {/* Item Name Field */}
          <div className="flex items-center bg-[#1f1d2b] rounded-lg px-4 py-3">
            <FaBoxOpen className="text-[#ea7c69] mr-4" />
            <input
              type="text"
              placeholder="Item Name"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="bg-transparent text-white focus:outline-none flex-grow"
              required
            />
          </div>

          {/* Price Field */}
          <div className="flex items-center bg-[#1f1d2b] rounded-lg px-4 py-3">
            <FaDollarSign className="text-[#ea7c69] mr-4" />
            <input
              type="number"
              placeholder="Price"
              value={newItemPrice}
              onChange={(e) => setNewItemPrice(e.target.value)}
              className="bg-transparent text-white focus:outline-none flex-grow"
              required
            />
          </div>

          {/* Stock Field */}
          <div className="flex items-center bg-[#1f1d2b] rounded-lg px-4 py-3">
            <FaWarehouse className="text-[#ea7c69] mr-4" />
            <input
              type="number"
              placeholder="Stock"
              value={newItemStock}
              onChange={(e) => setNewItemStock(e.target.value)}
              className="bg-transparent text-white focus:outline-none flex-grow"
              required
            />
          </div>

          {/* Add Item Button */}
          <button
            type="submit"
            className="w-full bg-[#ea7c69] text-white px-6 py-3 rounded-lg hover:bg-[#ffffff] hover:text-[#252836] transition duration-300 flex items-center justify-center gap-2"
          >
            <FaPlusCircle className="text-xl" /> Add Item
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddItems;