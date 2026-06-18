import { useState, FormEvent } from "react";
import { X, Plus, Image as ImageIcon, Loader2, DollarSign, Clock, HelpCircle } from "lucide-react";
import { motion } from "motion/react";

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onListingCreated: () => void;
}

export default function CreateListingModal({ isOpen, onClose, onListingCreated }: CreateListingModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("minimalist");
  const [startingPrice, setStartingPrice] = useState("");
  const [endsInHours, setEndsInHours] = useState("24");
  const [priority, setPriority] = useState("standard");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim() || !description.trim()) {
      setErrorMsg("Please provide a title and detailed description for your collection asset.");
      return;
    }

    const price = Number(startingPrice);
    if (!startingPrice || isNaN(price) || price <= 0) {
      setErrorMsg("Starting price must be a valid positive currency amount.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auctions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("taskmaster_token")}`,
        },
        body: JSON.stringify({
          title,
          description,
          category,
          startingPrice: price,
          endsInHours: Number(endsInHours) || 24,
          image: imageUrl,
          priority,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to submit new auction listing.");
      }

      onListingCreated();
      onClose();
      // Reset form fields
      setTitle("");
      setDescription("");
      setCategory("minimalist");
      setStartingPrice("");
      setEndsInHours("24");
      setPriority("standard");
      setImageUrl("");
    } catch (err: any) {
      setErrorMsg(err.message || "Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Preset stock images to make visual popups exciting and extremely polished
  const presetImages: Record<string, string[]> = {
    watches: [
      "https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=600"
    ],
    art: [
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=600"
    ],
    automobiles: [
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&q=80&w=600"
    ],
    hardware: [
      "https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&q=80&w=600"
    ],
    minimalist: [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600"
    ]
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-xl bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">List Custom Collection Asset</h3>
            <p className="text-xs text-slate-500 mt-1">Configure Appraisal specifications for physical/digital items</p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Form Scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl leading-relaxed">
              {errorMsg}
            </div>
          )}

          {/* Form Fields: Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1.5">
                Listing Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. vintage titanium mechanical chronometer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-slate-900 transition bg-slate-50/50"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1.5">
                Item Description
              </label>
              <textarea
                required
                rows={3}
                placeholder="Give high-fidelity highlights, rarity parameters, state conditions, and certification files..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-slate-900 transition bg-slate-50/50 resize-y"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  // Auto pick stock preset to make forms easy
                  setImageUrl(presetImages[e.target.value][0]);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-slate-900 transition bg-slate-50/50"
              >
                <option value="minimalist">Design Objects</option>
                <option value="watches">Fine Watches</option>
                <option value="art">Fine Art & Prints</option>
                <option value="automobiles">Automobiles</option>
                <option value="hardware">Tech Hardware</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1.5">
                Priority Tag
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-slate-900 transition bg-slate-50/50"
              >
                <option value="standard">Standard Auction</option>
                <option value="featured">Featured Hub</option>
                <option value="ultra_rare">⭐ Ultra Rare Asset</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1.5">
                Starting Bidding Price ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-medium">$</span>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="2500"
                  value={startingPrice}
                  onChange={(e) => setStartingPrice(e.target.value)}
                  className="w-full pl-7 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-slate-900 transition bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1.5">
                Bidding Duration
              </label>
              <select
                value={endsInHours}
                onChange={(e) => setEndsInHours(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-slate-900 transition bg-slate-50/50"
              >
                <option value="0.05">Testing Timer (3 minutes)</option>
                <option value="1">Express Auction (1 Hour)</option>
                <option value="12">Hot Half-Day (12 Hours)</option>
                <option value="24">Standard Premium (24 Hours)</option>
                <option value="72">Showcase (3 Days)</option>
                <option value="168">Grand Salon (7 Days)</option>
              </select>
            </div>
          </div>

          {/* Quick Image Presets Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-2">
              Choose Premium Image Preset
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {(presetImages[category] || presetImages.minimalist).map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setImageUrl(url)}
                  className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition ${
                    imageUrl === url ? "border-slate-950 ring-2 ring-slate-950/10" : "border-slate-200 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={url} alt="preset thumbnail" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/10 hover:bg-transparent transition" />
                </button>
              ))}
            </div>
          </div>

          {/* Manual URL field */}
          <div>
            <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1.5">
              Or Custom Image URL
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">
                <ImageIcon className="h-4 w-4" />
              </span>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-slate-900 transition bg-slate-50/50"
              />
            </div>
          </div>
        </form>

        {/* Footer actions */}
        <div className="p-5 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/60">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2.5 text-xs font-medium rounded-xl text-slate-700 hover:bg-slate-150 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-slate-950 text-white hover:bg-slate-900 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Appraising Ledger...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                List Asset to Ballroom
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
