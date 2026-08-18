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

export default function CataloguePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("Cables");
  const [activeGroup, setActiveGroup] = useState("");
  const [addedId, setAddedId] = useState("");

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

  useEffect(() => {
    if (subGroups.length > 0 && !subGroups.includes(activeGroup)) {
      setActiveGroup(subGroups[0]);
    }
  }, [activeSection, subGroups, activeGroup]);

  const visibleItems = grouped[activeSection]?.[activeGroup] || [];

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#E0E5EC] flex items-center justify-center text-gray-700">
        <p className="font-bold">Please log in from the Warehouse page first.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E0E5EC] text-gray-700 font-sans pb-24">
      <div className="max-w-6xl mx-auto px-5 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold">Catalogue</h1>
            <p className="text-sm font-semibold text-gray-500 mt-1">
              {visibleItems.length} items in {activeGroup || activeSection}
            </p>
          </div>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl text-sm font-bold shadow-[4px_4px_8px_#a3b1c6,-4px_-4px_8px_#ffffff]"
          >
            Search / Cart ({cart.length})
          </Link>
        </div>

        <div className="mb-4 p-3 rounded-2xl shadow-[6px_6px_12px_#a3b1c6,-6px_-6px_12px_#ffffff]">
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <button
                key={section}
                onClick={() => {
                  setActiveSection(section);
                  setActiveGroup("");
                }}
                className={`px-4 py-2 rounded-xl text-sm font-bold ${
                  activeSection === section
                    ? "shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]"
                    : "shadow-[3px_3px_6px_#a3b1c6,-3px_-3px_6px_#ffffff]"
                }`}
              >
                {section}
              </button>
            ))}
          </div>
        </div>

        {subGroups.length > 0 && (
          <div className="mb-8 p-3 rounded-2xl shadow-[inset_4px_4px_8px_#a3b1c6,inset_-4px_-4px_8px_#ffffff]">
            <div className="flex flex-wrap gap-2">
              {subGroups.map((group) => (
                <button
                  key={group}
                  onClick={() => setActiveGroup(group)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold ${
                    activeGroup === group
                      ? "shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]"
                      : "shadow-[3px_3px_6px_#a3b1c6,-3px_-3px_6px_#ffffff]"
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && <p className="text-sm font-semibold text-gray-400">Loading catalogue...</p>}

        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleItems.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl p-5 shadow-[8px_8px_16px_#a3b1c6,-8px_-8px_16px_#ffffff] flex flex-col"
              >
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div>
                    <p className="font-bold leading-snug">{item.brand || item.title}</p>
                    {item.model && (
                      <p className="text-sm text-gray-500 mt-1">{item.model}</p>
                    )}
                  </div>
                  <span
                    className={`text-sm font-black ${
                      item.quantity > 0 ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {item.quantity}
                  </span>
                </div>

                {item.location && (
                  <p className="text-sm text-gray-500 mb-2">{item.location}</p>
                )}
                {item.note && (
                  <p className="text-xs text-gray-600 mb-4 line-clamp-2">{item.note}</p>
                )}

                <button
                  onClick={() => addToCart(item)}
                  disabled={item.quantity <= 0}
                  className="mt-auto w-full py-2.5 rounded-xl text-sm font-bold shadow-[4px_4px_8px_#a3b1c6,-4px_-4px_8px_#ffffff] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {item.quantity <= 0
                    ? "Depleted"
                    : addedId === item.id
                    ? "Added"
                    : "Push to Cart"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
