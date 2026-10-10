import { useEffect, useState, useRef, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FilePlus, Save, ArrowLeft, Upload, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import axiosInstance from '../../api/axiosInstance'
import type { Product } from '../../api/types'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const CATEGORIES = ['Vegetables', 'Fruits', 'Grains & Pulses', 'Dairy & Eggs', 'Herbs & Spices', 'Flowers', 'Other']
const UNITS = ['kg', 'g', 'litre', 'piece', 'bunch', 'dozen']
const MAX_IMAGES = 5
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

interface FormData {
  name: string; category: string; description: string; unit: string;
  pricePerUnit: string; deliveryCharge: string; availableQuantity: string; harvestDate: string;
}
const EMPTY: FormData = { name: '', category: 'Vegetables', description: '', unit: 'kg', pricePerUnit: '', deliveryCharge: '0', availableQuantity: '', harvestDate: '' }

interface ImageEntry { url: string; uploading?: boolean; error?: string; local?: string }

export default function FarmerProductFormPage() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<FormData>(EMPTY)
  const [images, setImages] = useState<ImageEntry[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isEdit || !id) return
    axiosInstance.get<{ success: boolean; data: Product }>(`/api/products/${id}`)
      .then((r) => {
        const p = r.data.data
        setForm({
          name: p.name, category: p.category, description: p.description, unit: p.unit,
          pricePerUnit: String(p.pricePerUnit), deliveryCharge: String(p.deliveryCharge),
          availableQuantity: String(p.availableQuantity),
          harvestDate: p.harvestDate ? new Date(p.harvestDate).toISOString().split('T')[0]! : '',
        })
        setImages((p.images ?? []).map((url) => ({ url })))
      })
      .catch(() => setError('Failed to load product.'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  function set(key: keyof FormData, val: string) { setForm((prev) => ({ ...prev, [key]: val })) }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    if (images.length + files.length > MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed.`); return
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) { setError(`${file.name} exceeds 5 MB limit.`); continue }
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        setError(`${file.name} is not a supported image type.`); continue
      }

      const localPreview = URL.createObjectURL(file)
      setImages((prev) => [...prev, { url: '', uploading: true, local: localPreview }])

      try {
        const formData = new FormData()
        formData.append('image', file)
        const { data } = await axiosInstance.post<{
          success: boolean
          data: { url: string; configured: boolean; message?: string }
        }>('/api/upload/product-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

        if (!data.data.configured) {
          // Cloudinary not configured — keep local preview for demo, show warning
          setImages((prev) => prev.map((img) => img.local === localPreview ? { url: localPreview, local: localPreview, error: t('farmer.uploadNotConfigured') } : img))
        } else {
          setImages((prev) => prev.map((img) => img.local === localPreview ? { url: data.data.url } : img))
        }
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Upload failed.'
        setImages((prev) => prev.map((img) => img.local === localPreview ? { url: '', local: localPreview, error: msg } : img))
      }
    }
    // Reset file input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeImage(idx: number) {
    const img = images[idx]
    if (img?.local) URL.revokeObjectURL(img.local)
    setImages((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setSaving(true); setError(null)
    const imageUrls = images.map((img) => img.url).filter((u) => u && !u.startsWith('blob:'))
    const body = {
      name: form.name.trim(), category: form.category, description: form.description.trim(),
      unit: form.unit, pricePerUnit: Number(form.pricePerUnit), deliveryCharge: Number(form.deliveryCharge),
      availableQuantity: Number(form.availableQuantity), harvestDate: form.harvestDate,
      images: imageUrls,
    }
    try {
      if (isEdit) { await axiosInstance.put(`/api/products/${id}`, body) }
      else { await axiosInstance.post('/api/products', body) }
      navigate('/farmer/products')
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save product.')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size={48} /></div>

  return (
    <div className="min-h-screen bg-[#FAF3E0] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate('/farmer/products')} className="flex items-center gap-1 text-sm text-[#2D6A2D] hover:underline mb-6">
          <ArrowLeft size={14} />{t('common.back')}
        </button>
        <div className="flex items-center gap-3 mb-6">
          <FilePlus size={28} className="text-[#2D6A2D]" />
          <h1 className="text-2xl font-bold text-[#2D6A2D]">{isEdit ? t('farmer.editProduct') : t('farmer.addProduct')}</h1>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-6 space-y-5">
          {/* ── Image Upload Section ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('farmer.uploadPhoto')}
              <span className="ml-2 text-xs font-normal text-gray-400">{t('farmer.uploadPhotoHint')}</span>
            </label>

            {/* Image grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden h-28 bg-gray-100 border-2 border-dashed border-gray-200">
                    {img.uploading ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                        <LoadingSpinner size={24} />
                        <span className="text-xs text-gray-500">{t('farmer.uploadProgress')}</span>
                      </div>
                    ) : (
                      <>
                        <img src={img.local ?? img.url} alt={`Product image ${idx + 1}`} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow">
                          <X size={12} />
                        </button>
                        {img.error && (
                          <div className="absolute bottom-0 left-0 right-0 bg-orange-500/90 text-white text-[10px] px-1.5 py-0.5 leading-tight">{img.error}</div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            {images.length < MAX_IMAGES && (
              <>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleFileChange} />
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#2D6A2D]/40 bg-[#FAF3E0] text-[#2D6A2D] py-3 text-sm font-medium hover:border-[#2D6A2D] hover:bg-[#2D6A2D]/5 transition-colors">
                  <Upload size={18} />
                  {images.length === 0 ? t('farmer.uploadPhoto') : `Add more (${images.length}/${MAX_IMAGES})`}
                </button>
              </>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('farmer.productName')} *</label>
              <input value={form.name} onChange={(e) => set('name', e.target.value)} required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A2D] focus:border-[#2D6A2D]" placeholder="e.g. Fresh Tomatoes" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('farmer.category')} *</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A2D]">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('farmer.unit')} *</label>
              <select value={form.unit} onChange={(e) => set('unit', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A2D]">
                {UNITS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('farmer.price')} per {form.unit} (₹) *</label>
              <input type="number" min="0.01" step="0.01" value={form.pricePerUnit} onChange={(e) => set('pricePerUnit', e.target.value)} required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A2D]" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('farmer.deliveryCharge')} (₹)</label>
              <input type="number" min="0" step="0.01" value={form.deliveryCharge} onChange={(e) => set('deliveryCharge', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A2D]" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('farmer.quantity')} ({form.unit}) *</label>
              <input type="number" min="0" step="1" value={form.availableQuantity} onChange={(e) => set('availableQuantity', e.target.value)} required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A2D]" placeholder="100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('farmer.harvestDate')} *</label>
              <input type="date" value={form.harvestDate} max={new Date().toISOString().split('T')[0]} onChange={(e) => set('harvestDate', e.target.value)} required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A2D]" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('farmer.description')} *</label>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)} required rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A2D] resize-none"
                placeholder="Tell customers about your product, how it was grown, freshness, etc." />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-full bg-[#2D6A2D] text-white px-6 py-2.5 text-sm font-semibold hover:bg-[#245424] disabled:opacity-50 transition-colors">
              {saving ? <LoadingSpinner size={16} /> : <Save size={16} />}
              {saving ? t('farmer.saving') : isEdit ? t('farmer.save') : t('farmer.addProduct')}
            </button>
            <button type="button" onClick={() => navigate('/farmer/products')} className="rounded-full border border-gray-300 text-gray-600 px-6 py-2.5 text-sm hover:bg-gray-50">{t('farmer.cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}


