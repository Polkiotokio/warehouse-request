"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ========== CONFIG ==========
const CORRECT_PASSWORD = "warehouse2026";
const SEARCH_URL = "https://vincenzo-unnotational-merrilee.ngrok-free.dev/webhook/inventory-search";
const SUBMIT_URL = "https://vincenzo-unnotational-merrilee.ngrok-free.dev/webhook/submit-order";
const CART_KEY = "warehouse_cart";
const RESULTS_PER_PAGE = 12;
// ===========================

interface InventoryItem {
  id: string;
  title: string;
  brand?: string;
  model?: string;
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

useEffect(() => {
  const savedCart = localStorage.getItem(CART_KEY);
  if (savedCart) {
    try {
      setCart(JSON.parse(savedCart));
    } catch {}
  }
}, []);

useEffect(() => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}, [cart]);

  const [loading, setLoading] = useState(false);
  const [requesterName, setRequesterName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [message, setMessage] = useState("");
  const [batchId, setBatchId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  let searchTimeout: NodeJS.Timeout;

  const handleSearch = (value: string) => {
    setQuery(value);
    clearTimeout(searchTimeout);

    if (!value.trim()) {
      setResults([]);
      setCurrentPage(1);
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
        setCurrentPage(1);
      } catch (err) {
        console.error(err);
        setResults([]);
        setCurrentPage(1);
      }
      setLoading(false);
    }, 350);
  };

  const totalPages = Math.ceil(results.length / RESULTS_PER_PAGE);
  const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;
  const paginatedResults = results.slice(startIndex, startIndex + RESULTS_PER_PAGE);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    if (quantity < 0) return;
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
            brand: item.brand || "",
            model: item.model || "",
            note: item.note || "",
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
        setCurrentPage(1);
      } else {
        setMessage(data.message || "Something went wrong");
      }
    } catch (err) {
      console.error(err);
      setMessage("Failed to submit request");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#E0E5EC] flex items-center justify-center px-4 font-sans text-gray-700">
        <div className="w-full max-w-sm">
          <div className="bg-[#E0E5EC] rounded-[2rem] shadow-[12px_12px_24px_#a3b1c6,-12px_-12px_24px_#ffffff] p-10">
            <h1 className="text-2xl font-bold text-gray-700 mb-2 tracking-wide">Warehouse</h1>
            <p className="text-sm font-medium text-gray-500 mb-8">System Access Required</p>
            <form onSubmit={handleLogin} className="space-y-6">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter Password"
                className="w-full px-5 py-4 rounded-xl bg-[#E0E5EC] shadow-[inset_6px_6px_10px_#a3b1c6,inset_-6px_-6px_10px_#ffffff] text-gray-700 font-medium placeholder:text-gray-400 focus:outline-none"
                autoFocus
              />
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

  return (
    <div className="min-h-screen bg-[#E0E5EC] text-gray-700 font-sans pb-20">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-700 tracking-tight drop-shadow-sm">
              Warehouse
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-2">Search & Request Inventory</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/catalogue"
              className="px-5 py-2.5 rounded-xl bg-[#E0E5EC] text-sm font-bold text-gray-500 shadow-[4px_4px_8px_#a3b1c6,-4px_-4px_8px_#ffffff] active:shadow-[inset_2px_2px_5px_#a3b1c6,inset_-2px_-2px_5px_#ffffff] transition-all duration-200"
            >
              Catalogue
            </Link>
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
        </div>

        <div className="mb-12">
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by brand, model, note..."
            className="w-full px-6 py-4 rounded-2xl bg-[#E0E5EC] shadow-[inset_6px_6px_12px_#a3b1c6,inset_-6px_-6px_12px_#ffffff] text-gray-700 font-medium placeholder:text-gray-400 focus:outline-none"
          />
          {loading && (
            <p className="text-sm font-semibold text-gray-400 mt-4 px-2">Scanning index...</p>
          )}
        </div>

        {results.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
              {paginatedResults.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#E0E5EC] rounded-3xl shadow-[8px_8px_16px_#a3b1c6,-8px_-8px_16px_#ffffff] p-6 flex flex-col"
                >
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <h3 className="font-bold text-gray-700 leading-snug">{item.title}</h3>
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
                      <p>
                        <span className="text-gray-400">Brand:</span> {item.brand}
                      </p>
                    )}
                    {item.model && (
                      <p>
                        <span className="text-gray-400">Model:</span> {item.model}
                      </p>
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
                    className="w-full py-3 mt-auto rounded-xl font-bold text-gray-600 bg-[#E0E5EC] shadow-[5px_5px_10px_#a3b1c6,-5px_-5px_10px_#ffffff] active:shadow-[inset_4px_4px_8px_#a3b1c6,inset_-4px_-4px_8px_#ffffff] disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {item.quantity > 0 ? "Push to Cart" : "Depleted"}
                  </button>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl font-bold text-sm bg-[#E0E5EC] shadow-[4px_4px_8px_#a3b1c6,-4px_-4px_8px_#ffffff] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`w-10 h-10 rounded-xl font-bold text-sm ${
                      currentPage === page
                        ? "shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]"
                        : "shadow-[4px_4px_8px_#a3b1c6,-4px_-4px_8px_#ffffff]"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl font-bold text-sm bg-[#E0E5EC] shadow-[4px_4px_8px_#a3b1c6,-4px_-4px_8px_#ffffff] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {cart.length > 0 && (
          <div className="bg-[#E0E5EC] rounded-[2rem] shadow-[12px_12px_24px_#a3b1c6,-12px_-12px_24px_#ffffff] p-8 lg:p-10">
            <h2 className="text-xl font-extrabold text-gray-700 mb-8">
              Active Request
              <span className="ml-3 px-3 py-1 rounded-full shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff] text-sm">
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
                        min="0"
                        value={item.quantity === 0 ? "" : item.quantity}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            updateQuantity(item.id, 0);
                            return;
                          }
                          const num = parseInt(val, 10);
                          if (!isNaN(num) && num >= 0) {
                            updateQuantity(item.id, num);
                          }
                        }}
                        className="w-16 px-2 py-2 text-center font-bold text-gray-700 bg-[#E0E5EC] shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff] rounded-lg focus:outline-none"
                      />
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="px-3 py-2 rounded-lg font-bold text-xs uppercase tracking-wider text-red-400 shadow-[3px_3px_6px_#a3b1c6,-3px_-3px_6px_#ffffff]"
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
                  className="w-full px-5 py-3.5 rounded-xl bg-[#E0E5EC] shadow-[inset_4px_4px_8px_#a3b1c6,inset_-4px_-4px_8px_#ffffff] focus:outline-none"
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
                  className="w-full px-5 py-3.5 rounded-xl bg-[#E0E5EC] shadow-[inset_4px_4px_8px_#a3b1c6,inset_-4px_-4px_8px_#ffffff] focus:outline-none"
                  placeholder="Enter project name"
                />
              </div>
            </div>

            <button
              onClick={submitOrder}
              className="w-full py-4 text-lg font-black tracking-wide rounded-2xl shadow-[8px_8px_16px_#a3b1c6,-8px_-8px_16px_#ffffff] active:shadow-[inset_6px_6px_12px_#a3b1c6,inset_-6px_-6px_12px_#ffffff]"
            >
              Transmit Order
            </button>

            {message && (
              <div className="mt-8 p-5 rounded-2xl shadow-[inset_5px_5px_10px_#a3b1c6,inset_-5px_-5px_10px_#ffffff]">
                <p className="text-sm font-bold">{message}</p>
                {batchId && (
                  <p className="text-xs text-gray-500 mt-2">
                    Batch Signature: <span className="font-mono">{batchId}</span>
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
