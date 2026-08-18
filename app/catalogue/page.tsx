"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const CORRECT_PASSWORD = "warehouse2026";
const CATALOGUE_URL =
  "https://vincenzo-unnotational-merrilee.ngrok-free.dev/webhook/inventory-catalogue";

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
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("All");

  useEffect(() => {
    if (localStorage.getItem("warehouse_auth") === "true") {
      setIsAuthenticated(true);
    }
  }, []);

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#E0E5EC] flex items-center justify-center px-4 font-sans text-gray-700">
        <div className="w-full max-w-sm">
          <div className="bg-[#E0E5EC] rounded-[2rem] shadow-[12px_12px_24px_#a3b1c6,-12px_-12px_24px_#ffffff] p-10">
            <h1 className="text-2xl font-bold mb-2">Warehouse</h1>
            <p className="text-sm text-gray-500 mb-8">System Access Required</p>
            <form onSubmit={handleLogin} className="space-y-6">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter Password"
                className="w-full px-5 py-4 rounded-xl bg-[#E0E5EC] shadow-[inset_6px_6px_10px_#a3b1c6,inset_-6px_-6px_10px_#ffffff] focus:outline-none"
                autoFocus
              />
              {passwordError && (
                <p className="text-sm font-semibold text-red-500">{passwordError}</p>
              )}
              <button
                type="submit"
                className="w-full py-4 rounded-xl font-bold shadow-[6px_6px_12px_#a3b1c6,-6px_-6px_12px_#ffffff]"
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
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-extrabold">Catalogue</h1>
            <p className="text-sm font-semibold text-gray-500 mt-2">
              Inventory grouped by type
            </p>
          </div>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl text-sm font-bold shadow-[4px_4px_8px_#a3b1c6,-4px_-4px_8px_#ffffff]"
          >
            Back to Search
          </Link>
        </div>

        <div className="flex flex-wrap gap-3 mb-10">
          {["All", ...sections].map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`px-4 py-2 rounded-xl text-sm font-bold ${
                activeSection === section
                  ? "shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]"
                  : "shadow-[4px_4px_8px_#a3b1c6,-4px_-4px_8px_#ffffff]"
              }`}
            >
              {section}
            </button>
          ))}
        </div>

        {loading && <p className="text-sm font-semibold text-gray-400">Loading catalogue...</p>}

        {!loading &&
          sections
            .filter((s) => activeSection === "All" || s === activeSection)
            .map((section) => (
              <div key={section} className="mb-14">
                <h2 className="text-xl font-extrabold mb-6">{section}</h2>

                {Object.entries(grouped[section]).map(([groupName, groupItems]) => (
                  <div key={groupName} className="mb-8">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">
                      {groupName}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {groupItems.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-3xl p-5 shadow-[8px_8px_16px_#a3b1c6,-8px_-8px_16px_#ffffff]"
                        >
                          <div className="flex justify-between items-start gap-3 mb-3">
                            <p className="font-bold">{item.brand || item.title}</p>
                            <span
                              className={`text-xs font-black ${
                                item.quantity > 0 ? "text-emerald-600" : "text-red-500"
                              }`}
                            >
                              {item.quantity}
                            </span>
                          </div>
                          {item.model && (
                            <p className="text-sm text-gray-500 mb-1">Model: {item.model}</p>
                          )}
                          {item.location && (
                            <p className="text-sm text-gray-500 mb-1">Location: {item.location}</p>
                          )}
                          {item.note && (
                            <p className="text-xs text-gray-600 mt-2">{item.note}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
      </div>
    </div>
  );
}
