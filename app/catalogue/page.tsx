"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const CATALOGUE_URL =
  "https://vincenzo-unnotational-merrilee.ngrok-free.dev/webhook/inventory-catalogue";
const CART_KEY = "warehouse_cart";

interface InventoryItem {
  id: string;
  group: string;
  title: string;
  brand?: string;
  model?: string;
  sku?: string;
  quantity: number;
  location?: string;
  note?: string;
  photo?: string;
}

interface CartItem extends InventoryItem {
  quantity: number;
}

const CATEGORY_MAP: Record<string, string> = {
  "Ethernet Cable": "Cables",
  "Video Cable": "Cables",
  "Power Cable": "Cables",
  "Power Cable Extender": "Cables",
  "XLR Cable": "Cables",
  "Data cable": "Cables",
  "Data Cable": "Cables",
  "MATRIX Cable": "Cables",
  "USB Cable": "Cables",
  "Display Cable": "Cables",
  "Network Cable": "Cables",
  "USB Cable Extender": "Cables",
  "Audio Cable": "Cables",
  Cable: "Cables",
  "Power Adapter": "Power",
  "USB-C Fast Charger": "Power",
  "Power Supply": "Power",
  "Dummy Battery": "Power",
  Socket: "Power",
  "Power outlets": "Power",
  "Power Outlets": "Power",
  "Battery Charger": "Power",
  Battery: "Power",
  "Camera Lens": "Camera",
  "Camera Support": "Camera",
  "Photography Accessory": "Camera",
  "Focusing Rail": "Camera",
  "Camera Shutter": "Camera",
  "UV Filter Lens": "Camera",
  "Tripod Head": "Camera",
  "Video Adapter": "Video",
  "Micro Converter": "Video",
  "Video Capture": "Video",
  Video: "Video",
  "Microphone Adapter": "Audio",
  "Audio Networking": "Audio",
  Microphone: "Audio",
  "Audio Adapter": "Audio",
  "Audio Video Connector": "Audio",
  "Microphone Accessory": "Audio",
  "Microphone Mount": "Audio",
  "Audio Accessory": "Audio",
  "Audio Splitter": "Audio",
  "Microphone Stand": "Audio",
  "Audio Mixer": "Audio",
  "Audio Stagebox": "Audio",
  "Tube Light": "Lighting",
  "DMX Controller": "Lighting",
  "Lighting Accessory": "Lighting",
  "LED Video Light": "Lighting",
  "Light Stand": "Lighting",
  Softbox: "Lighting",
  "Fresnel Lens": "Lighting",
  "Lighting Equipment": "Lighting",
  "Grip Equipment": "Grip / Studio",
  Acrylic: "Grip / Studio",
  "USB Hub": "Computing / Control",
  "Wireless Calling System": "Computing / Control",
  Numpad: "Computing / Control",
  Scanner: "Computing / Control",
  "Barcode Scanner": "Computing / Control",
  "Tablet Accesories": "Computing / Control",
  "Tablet Accessories": "Computing / Control",
  "Tablet Stand": "Computing / Control",
  Tablet: "Computing / Control",
  "Roulette Controller": "Computing / Control",
  "Memory Storage": "Computing / Control",
  Touchpad: "Computing / Control",
  "Broadcast Controller": "Computing / Control",
  "Broadcast Control": "Computing / Control",
  "Roulette Electronics": "Computing / Control",
  Adapter: "Other",
  "Cable Adapter": "Other",
};

const SECTION_ORDER = [
  "Cables",
  "Power",
  "Camera",
  "Video",
  "Audio",
  "Lighting",
  "Grip / Studio",
  "Computing / Control",
  "Other",
];

function stockLabel(qty: number) {
  if (qty <= 0)
    return { text: "Out of stock", color: "text-[#DC2626]", dot: "bg-[#DC2626]" };
  if (qty <= 2)
    return { text: `${qty} low stock`, color: "text-[#F59E0B]", dot: "bg-[#F59E0B]" };
  return { text: `${qty} available`, color: "text-[#16A34A]", dot: "bg-[#16A34A]" };
}

export default function CataloguePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState("Cables");
  const [activeGroup, setActiveGroup] = useState("All");
  const [addedId, setAddedId] = useState("");
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (localStorage.getItem("warehouse_auth") === "true") {
      setIsAuthenticated(true);
    }
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

  useEffect(() => {
    if (!isAuthenticated) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(CATALOGUE_URL, {
          headers: { "ngrok-skip-browser-warning": "true" },
        });
        const data = await res.json();
        setItems(data.items || []);
      } catch (err) {
        console.error(err);
        setItems([]);
      }
      setLoading(false);
    };
    load();
  }, [isAuthenticated]);

  const grouped = useMemo(() => {
    const buckets: Record<string, Record<string, InventoryItem[]>> = {};
    for (const item of items) {
      const section = CATEGORY_MAP[item.group] || "Other";
      if (!buckets[section]) buckets[section] = {};
      if (!buckets[section][item.group]) buckets[section][item.group] = [];
      buckets[section][item.group].push(item);
    }
    return buckets;
  }, [items]);

  const sections = SECTION_ORDER.filter((s) => grouped[s]);
  const subGroups = Object.keys(grouped[activeSection] || {});

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) {
      return items.filter((item) =>
        `${item.title} ${item.brand} ${item.model} ${item.sku} ${item.note} ${item.group}`
          .toLowerCase()
          .includes(q)
      );
    }
    if (activeGroup === "All") {
      return Object.values(grouped[activeSection] || {}).flat();
    }
    return grouped[activeSection]?.[activeGroup] || [];
  }, [items, query, activeSection, activeGroup, grouped]);

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
    setAddedId(item.id);
    setTimeout(() => setAddedId(""), 1200);
  };

  const toggleFlip = (id: string) => {
    setFlipped((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F6F7F9] flex items-center justify-center text-[#172033]">
        <p className="font-semibold">Please log in from the Warehouse page first.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7F9] text-[#172033] font-sans">
      {/* Fullscreen photo overlay */}
      {fullscreenPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setFullscreenPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 h-10 px-4 rounded-lg bg-white text-sm font-semibold"
            onClick={() => setFullscreenPhoto(null)}
          >
            Close
          </button>
          <img
            src={fullscreenPhoto}
            alt="Product"
            className="max-h-[90vh] max-w-[95vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-4 py-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight">Warehouse Catalogue</h1>
            <p className="text-[13px] text-[#667085] mt-1">
              Find → identify → add to cart
            </p>
          </div>
          <Link
            href="/"
            className="h-10 px-4 rounded-lg border border-[#E4E7EC] bg-white text-sm font-medium hover:bg-[#F6F7F9]"
          >
            Cart ({cart.length})
          </Link>
        </div>

        {/* Search */}
        <div className="mb-5">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search item, SKU, connector, brand or description..."
            className="w-full h-12 px-4 rounded-lg border border-[#E4E7EC] bg-white text-[15px] placeholder:text-[#667085] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
        </div>

        <div className="flex gap-5 items-start">
          {/* Left fixed sidebar */}
          {!query && (
            <aside className="w-56 shrink-0 sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto">
              <div className="bg-white border border-[#E4E7EC] rounded-lg p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#667085] mb-2 px-1">
                  Categories
                </p>
                <div className="space-y-1 mb-4">
                  {sections.map((section) => (
                    <button
                      key={section}
                      onClick={() => {
                        setActiveSection(section);
                        setActiveGroup("All");
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-md text-sm ${
                        activeSection === section
                          ? "bg-[#EFF6FF] text-[#1D4ED8] font-semibold"
                          : "text-[#667085] hover:bg-[#F6F7F9] font-medium"
                      }`}
                    >
                      {section}
                    </button>
                  ))}
                </div>

                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#667085] mb-2 px-1">
                  Subcategories
                </p>
                <div className="space-y-1">
                  <button
                    onClick={() => setActiveGroup("All")}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-[13px] ${
                      activeGroup === "All"
                        ? "bg-[#EFF6FF] text-[#1D4ED8] font-semibold"
                        : "text-[#667085] hover:bg-[#F6F7F9]"
                    }`}
                  >
                    All
                  </button>
                  {subGroups.map((group) => (
                    <button
                      key={group}
                      onClick={() => setActiveGroup(group)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-[13px] ${
                        activeGroup === group
                          ? "bg-[#EFF6FF] text-[#1D4ED8] font-semibold"
                          : "text-[#667085] hover:bg-[#F6F7F9]"
                      }`}
                    >
                      {group}
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          )}

          {/* Main list */}
          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">
                {query
                  ? "Search results"
                  : activeGroup === "All"
                  ? activeSection
                  : activeGroup}
              </h2>
              <p className="text-[13px] text-[#667085]">{visibleItems.length} items</p>
            </div>

            {loading && <p className="text-sm text-[#667085]">Loading catalogue...</p>}

            {!loading && visibleItems.length === 0 && (
              <div className="bg-white border border-[#E4E7EC] rounded-lg p-6 text-sm text-[#667085]">
                No items found.
              </div>
            )}

            <div className="space-y-2">
              {visibleItems.map((item) => {
                const stock = stockLabel(item.quantity);
                const isFlipped = !!flipped[item.id];

                return (
                  <div key={item.id} className="relative [perspective:1000px]">
                    <div
                      className={`relative transition-transform duration-500 [transform-style:preserve-3d] ${
                        isFlipped ? "[transform:rotateY(180deg)]" : ""
                      }`}
                    >
                      {/* FRONT */}
                      <div className="bg-white border border-[#E4E7EC] rounded-lg px-4 py-3 flex items-center justify-between gap-4 [backface-visibility:hidden]">
                        {item.photo && (
                          <button
                            onClick={() => toggleFlip(item.id)}
                            title="Show photo"
                            className="absolute top-0 right-3 w-7 h-4 bg-[#2563EB] rounded-b-md text-white text-[10px] font-bold flex items-end justify-center pb-0.5 hover:bg-[#1D4ED8]"
                          >
                            ▾
                          </button>
                        )}

                        <div className="min-w-0 pr-8">
                          <p className="text-[15px] font-semibold leading-snug">
                            {item.brand || item.title}
                            {item.model ? ` · ${item.model}` : ""}
                          </p>
                          <p className="text-[13px] text-[#667085] mt-0.5">
                            {item.group}
                          </p>
                          {item.note && (
                            <p className="text-[12px] text-[#667085] mt-1 line-clamp-1">
                              {item.note}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div
                            className={`flex items-center gap-1.5 text-[13px] font-medium ${stock.color}`}
                          >
                            <span className={`w-2 h-2 rounded-full ${stock.dot}`} />
                            {stock.text}
                          </div>
                          <button
                            onClick={() => addToCart(item)}
                            disabled={item.quantity <= 0}
                            className="h-9 px-3 rounded-md border border-[#E4E7EC] bg-white text-sm font-medium hover:bg-[#F6F7F9] disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {item.quantity <= 0
                              ? "Unavailable"
                              : addedId === item.id
                              ? "Added"
                              : "+ Add"}
                          </button>
                        </div>
                      </div>

                      {/* BACK (photo) */}
                      <div className="absolute inset-0 bg-white border border-[#E4E7EC] rounded-lg p-3 flex items-center justify-center gap-3 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                        {item.photo ? (
                          <img
                            src={item.photo}
                            alt={item.brand || item.title}
                            className="max-h-28 max-w-[70%] object-contain cursor-zoom-in rounded-md"
                            onClick={() => setFullscreenPhoto(item.photo || null)}
                          />
                        ) : (
                          <p className="text-sm text-[#667085]">No photo</p>
                        )}
                        <button
                          onClick={() => toggleFlip(item.id)}
                          className="absolute top-2 right-2 h-8 px-3 rounded-md border border-[#E4E7EC] bg-white text-xs font-semibold"
                        >
                          Back
                        </button>
                        {item.photo && (
                          <button
                            onClick={() => setFullscreenPhoto(item.photo || null)}
                            className="absolute bottom-2 right-2 h-8 px-3 rounded-md bg-[#2563EB] text-white text-xs font-semibold"
                          >
                            Expand
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
