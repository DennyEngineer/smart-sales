import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import Sidebar from "./Sidebar";
import { 
  FiEdit2, FiTrash2, FiCheck, FiX, FiPackage, 
  FiSearch, FiAlertTriangle, FiBox, FiShoppingBag, FiPlus
} from "react-icons/fi";

const InventoryManagement = () => {
  const [items, setItems] = useState([]);
  const [editItemId, setEditItemId] = useState(null);
  const [editItemName, setEditItemName] = useState("");
  const [editItemPrice, setEditItemPrice] = useState("");
  const [editItemStock, setEditItemStock] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Fetch inventory items from Firestore
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "inventory"));
        const itemsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems(itemsData);
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  // Filter items based on search term
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Delete an item from the inventory
  const handleDeleteItem = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await deleteDoc(doc(db, "inventory", id));
        setItems(items.filter((item) => item.id !== id));
      } catch (error) {
        console.error("Error deleting item:", error);
        alert("Failed to delete item. Please try again.");
      }
    }
  };

  // Edit an item in the inventory
  const handleEditItem = async (id) => {
    if (!editItemName || !editItemPrice || !editItemStock) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      await updateDoc(doc(db, "inventory", id), {
        name: editItemName,
        price: parseFloat(editItemPrice),
        stock: parseInt(editItemStock),
      });
      
      // Update local state
      setItems(items.map(item => 
        item.id === id ? { 
          ...item, 
          name: editItemName,
          price: parseFloat(editItemPrice),
          stock: parseInt(editItemStock)
        } : item
      ));
      
      setEditItemId(null);
      alert("Item updated successfully!");
    } catch (error) {
      console.error("Error updating item:", error);
      alert("Failed to update item. Please try again.");
    }
  };

  // Cancel edit mode
  const cancelEdit = () => {
    setEditItemId(null);
  };

  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="flex flex-col md:flex-row bg-[#252836] min-h-screen">
      {/* Mobile Header with Menu Toggle */}
      <div className="md:hidden bg-[#1F1D2B] border-b border-[#393C49] p-4 flex justify-between items-center">
        <div className="flex items-center">
          <FiPackage className="text-[#ea7c69] text-xl mr-2" />
          <h1 className="text-lg font-medium text-white">Inventory</h1>
        </div>
        <button 
          className="p-2 rounded-md text-gray-400 hover:bg-[#2D303E]"
          onClick={toggleMenu}
        >
          {isMenuOpen ? (
            <FiX className="h-6 w-6" />
          ) : (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Sidebar for desktop / Mobile menu */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} md:block md:w-64 bg-[#1F1D2B] border-r border-[#393C49]`}>
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8">
        {/* Desktop Header */}
        <div className="hidden md:flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <FiPackage className="text-2xl text-[#ea7c69]" />
            <h1 className="text-2xl font-semibold text-white">Inventory Management</h1>
          </div>
        </div>

        {/* Search and Summary Row */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center mb-6 gap-4">
          {/* Search Bar */}
          <div className="relative w-full lg:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search inventory..."
              className="block w-full pl-10 pr-3 py-2 border border-[#393C49] rounded-lg bg-[#1F1D2B] focus:outline-none focus:ring-2 focus:ring-[#ea7c69] focus:border-[#ea7c69] text-white text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Stats Cards - Responsive Row for Desktop, Hidden on Mobile */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="flex items-center px-4 py-2 bg-[#1F1D2B] border border-[#393C49] rounded-lg shadow">
              <div className="p-2 rounded-full bg-[#252836]">
                <FiPackage className="h-5 w-5 text-[#ea7c69]" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-400">Total Items</p>
                <p className="text-lg font-semibold text-white">{items.length}</p>
              </div>
            </div>
            <div className="flex items-center px-4 py-2 bg-[#1F1D2B] border border-[#393C49] rounded-lg shadow">
              <div className="p-2 rounded-full bg-[#252836]">
                <FiBox className="h-5 w-5 text-green-500" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-400">In Stock</p>
                <p className="text-lg font-semibold text-white">
                  {items.filter(item => item.stock > 0).length}
                </p>
              </div>
            </div>
            <div className="flex items-center px-4 py-2 bg-[#1F1D2B] border border-[#393C49] rounded-lg shadow">
              <div className="p-2 rounded-full bg-[#252836]">
                <FiAlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-400">Out of Stock</p>
                <p className="text-lg font-semibold text-white">
                  {items.filter(item => item.stock === 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards for Mobile */}
        <div className="grid grid-cols-3 gap-2 mb-4 lg:hidden">
          <div className="bg-[#1F1D2B] p-3 rounded-lg border border-[#393C49] shadow flex flex-col items-center">
            <div className="p-1 mb-1 rounded-full bg-[#252836]">
              <FiPackage className="h-4 w-4 text-[#ea7c69]" />
            </div>
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-sm font-bold text-white">{items.length}</p>
          </div>
          <div className="bg-[#1F1D2B] p-3 rounded-lg border border-[#393C49] shadow flex flex-col items-center">
            <div className="p-1 mb-1 rounded-full bg-[#252836]">
              <FiBox className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xs text-gray-400">In Stock</p>
            <p className="text-sm font-bold text-white">
              {items.filter(item => item.stock > 0).length}
            </p>
          </div>
          <div className="bg-[#1F1D2B] p-3 rounded-lg border border-[#393C49] shadow flex flex-col items-center">
            <div className="p-1 mb-1 rounded-full bg-[#252836]">
              <FiAlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-xs text-gray-400">Out</p>
            <p className="text-sm font-bold text-white">
              {items.filter(item => item.stock === 0).length}
            </p>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-[#1F1D2B] rounded-lg shadow border border-[#393C49] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#393C49]">
              <thead className="bg-[#252836]">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Item
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Stock
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[#1F1D2B] divide-y divide-[#393C49]">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ea7c69]"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center">
                        <FiShoppingBag className="h-8 w-8 text-gray-600 mb-2" />
                        <p className="text-gray-300 font-medium">
                          {searchTerm ? "No matching items found" : "No items in inventory"}
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                          {searchTerm ? "Try a different search term" : "Add items to get started"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-[#252836] transition-colors">
                      {editItemId === item.id ? (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={editItemName}
                              onChange={(e) => setEditItemName(e.target.value)}
                              className="w-full px-3 py-2 bg-[#252836] border border-[#393C49] rounded-md shadow-sm focus:outline-none focus:ring-[#ea7c69] focus:border-[#ea7c69] text-white"
                              placeholder="Item name"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="relative mt-1 rounded-md shadow-sm">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-400 sm:text-sm">$</span>
                              </div>
                              <input
                                type="number"
                                step="0.01"
                                value={editItemPrice}
                                onChange={(e) => setEditItemPrice(e.target.value)}
                                className="w-full pl-7 pr-3 py-2 bg-[#252836] border border-[#393C49] rounded-md shadow-sm focus:outline-none focus:ring-[#ea7c69] focus:border-[#ea7c69] text-white"
                                placeholder="0.00"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              value={editItemStock}
                              onChange={(e) => setEditItemStock(e.target.value)}
                              className="w-full px-3 py-2 bg-[#252836] border border-[#393C49] rounded-md shadow-sm focus:outline-none focus:ring-[#ea7c69] focus:border-[#ea7c69] text-white"
                              placeholder="Quantity"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                            <button
                              onClick={() => handleEditItem(item.id)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-[#ea7c69] hover:bg-[#ff9e8e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ea7c69]"
                            >
                              <FiCheck className="mr-1" /> Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="inline-flex items-center px-3 py-1 border border-[#393C49] shadow-sm text-sm leading-4 font-medium rounded-md text-gray-300 bg-[#252836] hover:bg-[#2D303E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ea7c69]"
                            >
                              <FiX className="mr-1" /> Cancel
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-[#252836] rounded-full flex items-center justify-center border border-[#393C49]">
                                <FiPackage className="h-5 w-5 text-[#ea7c69]" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-white">{item.name}</div>
                                <div className="text-sm text-gray-400">ID: {item.id.substring(0, 8)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">${item.price.toFixed(2)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full 
                              ${item.stock > 10 ? 'bg-green-900 text-green-100' : 
                                item.stock > 0 ? 'bg-yellow-900 text-yellow-100' : 'bg-red-900 text-red-100'}`}>
                              {item.stock} in stock
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => {
                                setEditItemId(item.id);
                                setEditItemName(item.name);
                                setEditItemPrice(item.price.toString());
                                setEditItemStock(item.stock.toString());
                              }}
                              className="text-[#ea7c69] hover:text-[#ff9e8e] inline-flex items-center"
                            >
                              <span className="hidden sm:inline"><FiEdit2 className="sm:mr-1" /> Edit</span>
                              <span className="sm:inline md:hidden lg:hidden"><FiEdit2 /></span>
                            </button>
                            <span className="mx-2 text-gray-600">|</span>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-500 hover:text-red-400 inline-flex items-center"
                            >
                              <span className="hidden sm:inline"><FiTrash2 className="sm:mr-1" /> Delete</span>
                              <span className="sm:inline md:hidden lg:hidden"><FiTrash2 /></span>
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add New Item Button (Fixed at bottom on mobile) */}
        <div className="fixed bottom-6 right-6 md:relative md:mt-6 md:flex md:justify-end md:bottom-auto md:right-auto">
          <button 
            className="flex items-center justify-center p-3 md:px-4 md:py-2 bg-[#ea7c69] text-white rounded-full md:rounded-lg shadow-lg hover:bg-[#ff9e8e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ea7c69] transition-colors"
          >
            <span className="hidden md:inline mr-2">Add New Item</span>
            <FiPlus className="h-6 w-6 md:h-5 md:w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryManagement;