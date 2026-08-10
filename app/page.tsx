"use client";

import { useState, useEffect } from "react";

// ========== CONFIG ==========
const CORRECT_PASSWORD = "warehouse2026";
const SEARCH_URL = "https://vincenzo-unnotational-merrilee.ngrok-free.dev/webhook/inventory-search";
const SUBMIT_URL = "https://vincenzo-unnotational-merrilee.ngrok-free.dev/webhook/submit-order";
// ===========================

// ========== TYPESCRIPT INTERFACES ==========
interface InventoryItem {
  id: string;
  title: string;
  brand?: string;
  sku?: string;
  quantity: number;
  location?: string;
  field8?: string;
  field9?: string;
  category?: string;
  note?: string;
  note2?: string;
}

interface CartItem extends InventoryItem {
  quantity: number;
}
// =========================================

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("warehouse_auth");
    if (saved === "true") setIsAuthenticated(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === CORRECT_PASSWORD) {
      localStorage.setItem("warehouse_auth", "true");
      setIsAuthenticated(true);
      setPasswordError("");
    } else {
      setPasswordError("Incorrect password");
    }
  };

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<InventoryItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [requesterName, setRequesterName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [message, setMessage] = useState("");
  const [batchId, setBatchId] = useState("");

  let searchTimeout: NodeJS.Timeout;

  const handleSearch = (value: string) => {
    setQuery(value);
    clearTimeout(searchTimeout);

    if (!value.trim()) {
      setResults([]);
      return;
    }

    searchTimeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${SEARCH_URL}?query=${encodeURIComponent(value)}`,
          {
            headers: {
              "ngrok-skip-browser-warning": "true",
            },
          }
        );
        const data = await res.json();
        setResults(data.items || []);
      } catch (err) {
        console.error(err);
        setResults([]);
      }
      setLoading(false);
    }, 350);
  };

  const addToCart = (item: InventoryItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const submitOrder = async () => {
    if (!requesterName.trim() || !projectName.trim() || cart.length === 0) {
      alert("Please fill in your name, project, and add at least one item.");
      return;
    }

    setMessage("Submitting...");
    setBatchId("");

    try {
      const res = await fetch(SUBMIT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          requesterName,
          projectName,
          items: cart.map((item) => ({
            id: item.id,
            itemName: item.title,
            sku: item.sku || "",
            quantity: item.quantity,
            location: item.location || "",
          })),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setBatchId(data.batchId);
        setMessage(data.message);
        setCart([]);
        setRequesterName("");
        setProjectName("");
        setResults([]);
        setQuery("");
      } else {
        setMessage(data.message || "Something went wrong");
      }
    } catch (err) {
      console.error(err);
      setMessage("Failed to submit request");
    }
  };

  // ==========================================
  // UI: Password Screen (Neumorphic)
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#E0E5EC] flex items-center justify-center px-4 font-sans text-gray-700">
        <div className="w-full max-w-sm">
          <div className="bg-[#E0E5EC] rounded-[2rem] shadow-[12px_12px_24px_#a3b1c6,-12px_-12px_24px_#ffffff] p-10">
            <h1 className="text-2xl font-bold text-gray-700 mb-2 tracking-wide">Warehouse</h1>
            <p className="text-sm font-medium text-gray-500 mb-8">System Access Required</p>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="relative">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter Password"
                  className="w-full px-5 py-4 rounded-xl bg-[#E0E5EC] shadow-[inset_6px_6px_10px_#a3b1c6,inset_-6px_-6px_10px_#ffffff] text-gray-700 font-medium placeholder:text-gray-400 focus:outline-none transition-all"
                  autoFocus
                />
              </div>
              {passwordError && (
                <p className="text-sm font-semibold text-red-500 px-2">{passwordError}</p>
              )}
              <button
                type="submit"
                className="w-full py-4 bg-[#E0E5EC] text-gray-600 font-bold tracking-wide rounded-xl shadow-[6px_6px_12px_#a3b1c6,-6px_-6px_12px_#ffffff] active:shadow-[inset_4px_4px_8px_#a3b1c6,inset_-4px_-4px_8px_#ffffff] transition-all duration-200"
              >
                Unlock
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // UI: Main App (Neumorphic)
  // ==========================================
  return (
    <div className="min-h-screen bg-[#E0E5EC] text-gray-700 font-sans pb-20">
      <div className="max-w-5xl mx-auto px-6 py-12">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-700 tracking-tight drop-shadow-sm">
              Warehouse
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-2">Search & Request Inventory</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("warehouse_auth");
              setIsAuthenticated(false);
            }}
            className="px-5 py-2.5 rounded-xl bg-[#E0E5EC] text-sm font-bold text-gray-500 shadow-[4px_4px_8px_#a3b1c6,-4px_-4px_8px_#ffffff] active:shadow-[inset_2px_2px_5px_#a3b1c6,inset_-2px_-2px_5px_#ffffff] transition-all duration-200"
          >
            Log Out
          </button>
        </div>

        {/* Search */}
        <div className="mb-12">
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by brand, model, note..."
            className="w-full px-6 py-4 rounded-2xl bg-[#E0E5EC] shadow-[inset_6px_6px_12px_#a3b1c6,inset_-6px_-6px_12px_#ffffff] text-gray-700 font-medium placeholder:text-gray-400 focus:outline-none transition-all"
          />
          {loading && (
            <p className="text-sm font-semibold text-gray-400 mt-4 px-2">Scanning index...</p>
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {results.map((item) => (
              <div
                key={item.id}
                className="bg-[#E0E5EC] rounded-3xl shadow-[8px_8px_16px_#a3b1c6,-8px_-8px_16px_#ffffff] p-6 flex flex-col"
              >
                <div className="flex justify-between items-start gap-4 mb-4">
                  <h3 className="font-bold text-gray-700 leading-snug">
                    {item.title}
                  </h3>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-black shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff] ${
                      item.quantity > 0 ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {item.quantity}
                  </div>
                </div>

                <div className="space-y-2 text-sm font-medium text-gray-500 mb-6 flex-grow">
                  {item.brand && (
                    <p><span className="text-gray-400">Brand:</span> {item.brand}</p>
                  )}
                  {item.sku && (
                    <p><span className="text-gray-400">SKU:</span> {item.sku}</p>
                  )}
                  {item.location && (
                    <p><span className="text-gray-400">Location:</span> {item.location}</p>
                  )}
                  {(item.field8 || item.field9) && (
                    <p>
                      <span className="text-gray-400">Category:</span>{" "}
                      {[item.field8, item.field9].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {item.note && (
                    <p className="text-gray-600 mt-3 p-3 rounded-lg shadow-[inset_2px_2px_5px_#a3b1c6,inset_-2px_-2px_5px_#ffffff] text-xs">
                      {item.note}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => addToCart(item)}
                  disabled={item.quantity <= 0}
                  className="w-full py-3 mt-auto rounded-xl font-bold text-gray-600 bg-[#E0E5EC] shadow-[5px_5px_10px_#a3b1c6,-5px_-5px_10px_#ffffff] active:shadow-[inset_4px_4px_8px_#a3b1c6,inset_-4px_-4px_8px_#ffffff] disabled:shadow-[inset_4px_4px_8px_#a3b1c6,inset_-4px_-4px_8px_#ffffff] disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {item.quantity > 0 ? "Push to Cart" : "Depleted"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Cart */}
        {cart.length > 0 && (
          <div className="bg-[#E0E5EC] rounded-[2rem] shadow-[12px_12px_24px_#a3b1c6,-12px_-12px_24px_#ffffff] p-8 lg:p-10">
            <h2 className="text-xl font-extrabold text-gray-700 mb-8 flex items-center gap-3">
              Active Request
              <span className="px-3 py-1 rounded-full shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff] text-sm text-gray-600">
                {cart.length} item{cart.length > 1 ? "s" : ""}
              </span>
            </h2>

            <div className="space-y-2 mb-10">
              {cart.map((item, index) => (
                <div key={item.id}>
                  {index > 0 && (
                    <div className="w-full h-[2px] bg-[#E0E5EC] shadow-[inset_1px_1px_2px_#a3b1c6,inset_-1px_-1px_2px_#ffffff] my-4 rounded-full" />
                  )}
                  <div className="flex items-center justify-between gap-6 py-2">
                    <div className="min-w-0 flex-grow">
                      <p className="font-bold text-gray-700 truncate">{item.title}</p>
                      <p className="text-sm font-medium text-gray-500 mt-1">{item.location}</p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item.id, parseInt(e.target.value) || 1)
                        }
                        className="w-16 px-2 py-2 text-center font-bold text-gray-700 bg-[#E0E5EC] shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff] rounded-lg focus:outline-none"
                      />
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="px-3 py-2 rounded-lg font-bold text-xs uppercase tracking-wider text-red-400 bg-[#E0E5EC] shadow-[3px_3px_6px_#a3b1c6,-3px_-3px_6px_#ffffff] active:shadow-[inset_2px_2px_4px_#a3b1c6,inset_-2px_-2px_4px_#ffffff] transition-all duration-200"
                      >
                        Drop
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 px-2">
                  Requester ID
                </label>
                <input
                  type="text"
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-xl bg-[#E0E5EC] shadow-[inset_4px_4px_8px_#a3b1c6,inset_-4px_-4px_8px_#ffffff] text-gray-700 font-medium focus:outline-none transition-all"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 px-2">
                  Project Designation
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-xl bg-[#E0E5EC] shadow-[inset_4px_4px_8px_#a3b1c6,inset_-4px_-4px_8px_#ffffff] text-gray-700 font-medium focus:outline-none transition-all"
                  placeholder="Enter project name"
                />
              </div>
            </div>

            <button
              onClick={submitOrder}
              className="w-full py-4 bg-[#E0E5EC] text-gray-700 text-lg font-black tracking-wide rounded-2xl shadow-[8px_8px_16px_#a3b1c6,-8px_-8px_16px_#ffffff] active:shadow-[inset_6px_6px_12px_#a3b1c6,inset_-6px_-6px_12px_#ffffff] transition-all duration-200"
            >
              Transmit Order
            </button>

            {message && (
              <div className="mt-8 p-5 rounded-2xl bg-[#E0E5EC] shadow-[inset_5px_5px_10px_#a3b1c6,inset_-5px_-5px_10px_#ffffff]">
                <p className="text-sm font-bold text-gray-700">{message}</p>
                {batchId && (
                  <p className="text-xs font-medium text-gray-500 mt-2">
                    Batch Signature: <span className="font-mono bg-[#E0E5EC] px-2 py-1 rounded shadow-[inset_1px_1px_3px_#a3b1c6,inset_-1px_-1px_3px_#ffffff]">{batchId}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
