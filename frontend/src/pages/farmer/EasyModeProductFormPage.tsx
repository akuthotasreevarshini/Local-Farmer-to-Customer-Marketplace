import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sprout, ArrowLeft, ArrowRight, Check } from 'lucide-react'
import axiosInstance from '../../api/axiosInstance'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const STEPS = ["What are you selling?", "Price & Quantity", "Confirm & Publish"]
const CATEGORIES = [
  { label: "Vegetables 🥦", value: "Vegetables" },
  { label: "Fruits 🍎", value: "Fruits" },
  { label: "Grains 🌾", value: "Grains & Pulses" },
  { label: "Dairy 🥛", value: "Dairy & Eggs" },
  { label: "Herbs 🌿", value: "Herbs & Spices" },
  { label: "Other 🛒", value: "Other" },
]

export default function EasyModeProductFormPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [name, setName] = useState("")
  const [category, setCategory] = useState("Vegetables")
  const [unit, setUnit] = useState("kg")
  const [price, setPrice] = useState("")
  const [qty, setQty] = useState("")
  const [desc, setDesc] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handlePublish() {
    setSaving(true); setError(null)
    try {
      await axiosInstance.post("/api/products", {
        name, category, description: desc || `Fresh ${name} direct from my farm.`,
        unit, pricePerUnit: Number(price), deliveryCharge: 0,
        availableQuantity: Number(qty), harvestDate: new Date().toISOString().split("T")[0],
      })
      setDone(true)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? "Failed to publish. Please try again.")
    } finally { setSaving(false) }
  }

  if (done) return (
    <div className="min-h-screen bg-[#FAF3E0] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-lg p-8 text-center max-w-sm w-full">
        <Check size={56} className="text-[#5DAB24] mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-[#2D6A2D] mb-2">Published!</h2>
        <p className="text-gray-500 mb-6">Your {name} listing is now live on FarmConnect.</p>
        <button onClick={() => navigate("/farmer/products")} className="w-full rounded-full bg-[#2D6A2D] text-white font-bold py-4 text-lg hover:bg-[#245424]">
          View My Products
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FAF3E0] py-8 px-4">
      <div className="max-w-md mx-auto">
        <button onClick={() => navigate("/farmer/products")} className="flex items-center gap-1 text-sm text-[#2D6A2D] hover:underline mb-6"><ArrowLeft size={14} />Back</button>

        <div className="flex items-center gap-3 mb-6">
          <Sprout size={28} className="text-[#2D6A2D]" />
          <div>
            <h1 className="text-2xl font-bold text-[#2D6A2D]">Easy Mode</h1>
            <p className="text-sm text-gray-500">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((_, i) => <div key={i} className={`h-2 flex-1 rounded-full transition-colors ${i <= step ? "bg-[#5DAB24]" : "bg-gray-200"}`} />)}
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-4">{error}</div>}

        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">What is the name of your product?</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fresh Tomatoes"
                className="w-full rounded-2xl border-2 border-gray-200 px-5 py-4 text-lg focus:outline-none focus:border-[#2D6A2D]" />
            </div>
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-3">Select category</label>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((c) => (
                  <button key={c.value} type="button" onClick={() => setCategory(c.value)}
                    className={`rounded-2xl border-2 py-4 text-base font-medium transition-colors ${category === c.value ? "border-[#2D6A2D] bg-[#2D6A2D] text-white" : "border-gray-200 bg-white text-gray-700 hover:border-[#2D6A2D]"}`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Sold by</label>
              <div className="grid grid-cols-3 gap-3">
                {["kg", "piece", "bunch"].map((u) => (
                  <button key={u} type="button" onClick={() => setUnit(u)}
                    className={`rounded-2xl border-2 py-4 text-base font-medium transition-colors ${unit === u ? "border-[#2D6A2D] bg-[#2D6A2D] text-white" : "border-gray-200 bg-white text-gray-700"}`}>
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Price per {unit} (₹)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Enter price"
                className="w-full rounded-2xl border-2 border-gray-200 px-5 py-4 text-2xl font-bold text-[#2D6A2D] focus:outline-none focus:border-[#2D6A2D]" />
            </div>
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">How many {unit} do you have?</label>
              <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Enter quantity"
                className="w-full rounded-2xl border-2 border-gray-200 px-5 py-4 text-2xl font-bold text-[#2D6A2D] focus:outline-none focus:border-[#2D6A2D]" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow p-5 space-y-3">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Product</span><span className="font-semibold">{name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Category</span><span className="font-semibold">{category}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Price</span><span className="font-semibold text-[#2D6A2D]">₹{price}/{unit}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Available</span><span className="font-semibold">{qty} {unit}</span></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Optional: Add a short description</label>
              <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} placeholder={`Fresh ${name} from my farm`}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A2D] resize-none" />
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button type="button" onClick={() => setStep((s) => s - 1)}
              className="flex-1 rounded-full border-2 border-gray-300 py-4 text-base font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2">
              <ArrowLeft size={18} />Back
            </button>
          )}
          {step < 2 ? (
            <button type="button" onClick={() => setStep((s) => s + 1)} disabled={step === 0 ? !name : (!price || !qty)}
              className="flex-1 rounded-full bg-[#2D6A2D] py-4 text-base font-bold text-white hover:bg-[#245424] disabled:opacity-40 flex items-center justify-center gap-2">
              Next <ArrowRight size={18} />
            </button>
          ) : (
            <button type="button" onClick={handlePublish} disabled={saving}
              className="flex-1 rounded-full bg-[#5DAB24] py-4 text-base font-bold text-white hover:bg-[#4d9420] disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <LoadingSpinner size={20} /> : <><Check size={18} />Publish</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

