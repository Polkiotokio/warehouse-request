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

  // Password Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
            <h1 className="text-xl font-semibold text-neutral-900 mb-1">Warehouse</h1>
            <p className="text-sm text-neutral-500 mb-6">Enter password to continue</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                autoFocus
              />
              {passwordError && (
                <p className="text-sm text-red-600">{passwordError}</p>
              )}
              <button
                type="submit"
                className="w-full py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition"
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Main App
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">Warehouse</h1>
            <p className="text-sm text-neutral-500 mt-1">Search & request inventory</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("warehouse_auth");
              setIsAuthenticated(false);
            }}
            className="text-sm text-neutral-500 hover:text-neutral-900 transition"
          >
            Logout
          </button>
        </div>

        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by brand, model, note..."
            className="w-full px-5 py-3.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent shadow-sm"
          />
          {loading && (
            <p className="text-sm text-neutral-400 mt-3">Searching...</p>
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {results.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-neutral-200 p-5 hover:border-neutral-300 transition"
              >
                <div className="flex justify-between items-start gap-3 mb-3">
                  <h3 className="font-medium text-neutral-900 leading-snug">
                    {item.title}
                  </h3>
                  <span
                    className={`text-sm font-medium tabular-nums ${
                      item.quantity > 0 ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {item.quantity}
                  </span>
                </div>

                <div className="space-y-1.5 text-sm text-neutral-500 mb-4">
                  {item.brand && (
                    <p>
                      <span className="text-neutral-400">Brand:</span> {item.brand}
                    </p>
                  )}
                  {item.sku && (
                    <p>
                      <span className="text-neutral-400">SKU:</span> {item.sku}
                    </p>
                  )}
                  {item.location && (
                    <p>
                      <span className="text-neutral-400">Location:</span> {item.location}
                    </p>
                  )}
                  {(item.field8 || item.field9) && (
                    <p>
                      <span className="text-neutral-400">Category:</span>{" "}
                      {[item.field8, item.field9].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {item.note && (
                    <p className="text-neutral-600 mt-1">{item.note}</p>
                  )}
                </div>

                <button
                  onClick={() => addToCart(item)}
                  disabled={item.quantity <= 0}
                  className="w-full py-2 rounded-lg text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed bg-neutral-900 text-white hover:bg-neutral-800"
                >
                  {item.quantity > 0 ? "Add" : "Out of stock"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Cart */}
        {cart.length > 0 && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
            <h2 className="text-lg font-medium text-neutral-900 mb-5">
              Request · {cart.length} item{cart.length > 1 ? "s" : ""}
            </h2>

            <div className="space-y-4 mb-6">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 py-3 border-b border-neutral-100 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-900 truncate">{item.title}</p>
                    <p className="text-sm text-neutral-500">{item.location}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(item.id, parseInt(e.target.value) || 1)
                      }
                      className="w-14 px-2 py-1.5 text-center text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-sm text-neutral-400 hover:text-red-600 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                  Your name
                </label>
                <input
                  type="text"
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                  placeholder="Name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                  Project
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                  placeholder="Project name"
                />
              </div>
            </div>

            <button
              onClick={submitOrder}
              className="w-full py-3 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition"
            >
              Submit Request
            </button>

            {message && (
              <div className="mt-5 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="text-sm font-medium text-emerald-800">{message}</p>
                {batchId && (
                  <p className="text-xs text-emerald-700 mt-1">
                    Batch ID: <span className="font-mono">{batchId}</span>
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
