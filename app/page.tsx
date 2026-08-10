"use client";

import { useState } from "react";

// ========== PUT YOUR n8n URLS HERE ==========
const SEARCH_URL = "http://localhost:5678/webhook/inventory-search";
const SUBMIT_URL = "http://localhost:5678/webhook/submit-order";
// ===========================================

interface InventoryItem {
  id: string;
  title: string;
  sku?: string;
  quantity: number;
  location?: string;
  category?: string;
  note?: string;
}

interface CartItem extends InventoryItem {
  quantity: number;
}

export default function Home() {
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
        const res = await fetch(`${SEARCH_URL}?query=${encodeURIComponent(value)}`);
        const data = await res.json();
        setResults(data.items || []);
      } catch (err) {
        console.error(err);
        setResults([]);
      }
      setLoading(false);
    }, 400);
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
      alert("Please fill in your name, project name, and add at least one item.");
      return;
    }

    setMessage("Submitting request...");
    setBatchId("");

    try {
      const res = await fetch(SUBMIT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requesterName,
          projectName,
          items: cart.map((item) => ({
            id: item.id,
            itemName: item.title,
            sku: item.sku,
            quantity: item.quantity,
            location: item.location,
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
      setMessage("Failed to submit request. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Warehouse Request</h1>
          <p className="text-gray-500 mt-1">Search items and submit a request</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search inventory (e.g. nanlite, hdmi, adapter)..."
            className="w-full px-5 py-3 rounded-xl border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          />
        </div>

        {loading && <p className="text-gray-500 mb-4">Searching...</p>}

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {results.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start gap-3">
                <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                  {item.title}
                </h3>
                <span
                  className={`font-bold whitespace-nowrap ${
                    item.quantity > 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {item.quantity} pcs
                </span>
              </div>

              <div className="mt-3 space-y-1 text-sm text-gray-600">
                {item.sku && (
                  <div>
                    <span className="text-gray-400">SKU:</span> {item.sku}
                  </div>
                )}
                {item.location && (
                  <div>
                    <span className="text-gray-400">Location:</span> {item.location}
                  </div>
                )}
                {item.category && (
                  <div>
                    <span className="text-gray-400">Category:</span> {item.category}
                  </div>
                )}
                {item.note && <div className="mt-2 text-gray-500">{item.note}</div>}
              </div>

              <button
                onClick={() => addToCart(item)}
                disabled={item.quantity <= 0}
                className="mt-4 w-full py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                {item.quantity > 0 ? "Add to Request" : "Out of Stock"}
              </button>
            </div>
          ))}
        </div>

        {/* Cart + Form */}
        {cart.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Your Request ({cart.length} item{cart.length > 1 ? "s" : ""})
            </h2>

            <div className="space-y-4 mb-6">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b pb-3"
                >
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-gray-500">{item.location}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(item.id, parseInt(e.target.value) || 1)
                      }
                      className="w-16 px-2 py-1 border rounded text-center"
                    />
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Steve"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Kitchen Reno"
                />
              </div>
            </div>

            <button
              onClick={submitOrder}
              className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold text-lg hover:bg-green-700 transition"
            >
              Submit Request
            </button>

            {message && (
              <div className="mt-4 p-4 rounded-lg bg-green-50 text-green-800">
                <p className="font-medium">{message}</p>
                {batchId && (
                  <p className="text-sm mt-1">
                    Batch ID: <strong>{batchId}</strong>
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
