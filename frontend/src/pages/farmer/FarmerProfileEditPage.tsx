import { useEffect, useState, type FormEvent } from 'react'
import { Settings, Save } from 'lucide-react'
import axiosInstance from '../../api/axiosInstance'
import type { FarmerProfile } from '../../api/types'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function FarmerProfileEditPage() {
  const [profile, setProfile] = useState<FarmerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [form, setForm] = useState({ farmName: '', farmDescription: '', district: '', state: '', contactPhone: '', easyModeEnabled: false })

  useEffect(() => {
    axiosInstance.get<{ success: boolean; data: FarmerProfile }>('/api/farmers/profile/me')
      .then((r) => {
        setProfile(r.data.data)
        const p = r.data.data
        setForm({ farmName: p.farmName, farmDescription: p.farmDescription, district: p.district, state: p.state, contactPhone: p.contactPhone, easyModeEnabled: p.easyModeEnabled })
      })
      .catch(() => setMsg({ type: 'error', text: 'Failed to load profile.' }))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setSaving(true); setMsg(null)
    try {
      await axiosInstance.patch('/api/farmers/profile/me', form)
      setMsg({ type: 'success', text: 'Profile updated successfully!' })
    } catch { setMsg({ type: 'error', text: 'Failed to save changes.' }) }
    finally { setSaving(false); setTimeout(() => setMsg(null), 3000) }
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size={48} /></div>

  return (
    <div className="min-h-screen bg-[#FAF3E0] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Settings size={28} className="text-[#2D6A2D]" />
          <h1 className="text-2xl font-bold text-[#2D6A2D]">Edit Farm Profile</h1>
        </div>
        {profile && (
          <div className="mb-4 bg-white rounded-xl p-4 text-sm flex items-center gap-3">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${profile.verificationStatus === 'verified' ? 'bg-green-100 text-green-700' : profile.verificationStatus === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {profile.verificationStatus}
            </span>
            <span className="text-gray-500">Verification status</span>
          </div>
        )}
        {msg && <div className={`mb-4 rounded-xl p-4 text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg.text}</div>}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-6 space-y-4">
          {[
            { key: 'farmName', label: 'Farm Name', placeholder: 'My Farm' },
            { key: 'district', label: 'District', placeholder: 'Krishna' },
            { key: 'state', label: 'State', placeholder: 'Andhra Pradesh' },
            { key: 'contactPhone', label: 'Contact Phone', placeholder: '9876543210' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input value={form[key as keyof typeof form] as string} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A2D]" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Farm Description</label>
            <textarea value={form.farmDescription} onChange={(e) => setForm((f) => ({ ...f, farmDescription: e.target.value }))} rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A2D] resize-none" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className={`w-10 h-6 rounded-full transition-colors ${form.easyModeEnabled ? 'bg-[#2D6A2D]' : 'bg-gray-300'}`} onClick={() => setForm((f) => ({ ...f, easyModeEnabled: !f.easyModeEnabled }))}>
              <div className={`w-5 h-5 bg-white rounded-full shadow m-0.5 transition-transform ${form.easyModeEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm font-medium text-gray-700">Enable Easy Mode</span>
            <span className="text-xs text-gray-400">(simplified product listing)</span>
          </label>
          <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-full bg-[#2D6A2D] text-white px-6 py-2.5 text-sm font-semibold hover:bg-[#245424] disabled:opacity-50">
            {saving ? <LoadingSpinner size={16} /> : <Save size={16} />}{saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
