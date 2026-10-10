import { Leaf, ShoppingCart, Bell, User, Menu, X, Globe } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../stores/useAuthStore'
import { useCartStore } from '../../stores/useCartStore'
import { useNotifStore } from '../../stores/useNotifStore'
import axiosInstance from '../../api/axiosInstance'
import { setAppLanguage } from '../../i18n/index'

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'hi', label: 'हिन्दी' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuthStore()
  const cartCount = useCartStore((s) => s.cartCount)
  const unreadCount = useNotifStore((s) => s.unreadCount)
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const notifLabel = unreadCount > 99 ? '99+' : String(unreadCount)
  const currentLang = LANGS.find((l) => l.code === i18n.language) ?? LANGS[0]!

  const handleLogout = async () => {
    try { await axiosInstance.post('/api/auth/logout', {}, { withCredentials: true }) } catch {}
    logout()
    navigate('/')
    setMobileOpen(false)
  }

  const handleLangChange = (code: string) => {
    setAppLanguage(code)
    setLangOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#2D6A2D]/20 bg-[#2D6A2D] text-white shadow-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3" aria-label="Main navigation">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight" aria-label="FarmConnect home">
          <Leaf size={24} aria-hidden="true" />
          <span>FarmConnect</span>
        </Link>

        <ul className="hidden items-center gap-5 md:flex" role="list">
          <li><Link to="/products" className="hover:text-[#FAF3E0] transition-colors text-sm">{t('nav.shop')}</Link></li>
          <li><Link to="/compare" className="hover:text-[#FAF3E0] transition-colors text-sm">{t('nav.compare')}</Link></li>
          <li><Link to="/group-buys" className="hover:text-[#FAF3E0] transition-colors text-sm">{t('nav.groupBuys')}</Link></li>
          <li><Link to="/map" className="hover:text-[#FAF3E0] transition-colors text-sm">{t('nav.nearbyFarmers')}</Link></li>
          {user?.role === 'farmer' && <li><Link to="/farmer/dashboard" className="hover:text-[#FAF3E0] transition-colors text-sm">{t('nav.dashboard')}</Link></li>}
          {user?.role === 'admin' && <li><Link to="/admin/dashboard" className="hover:text-[#FAF3E0] transition-colors text-sm">{t('nav.admin')}</Link></li>}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => setLangOpen((o) => !o)}
              className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1.5 text-sm hover:bg-white/20 transition-colors"
              aria-label="Select language"
            >
              <Globe size={14} aria-hidden="true" />
              <span>{currentLang.label}</span>
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg py-1 z-50 min-w-[130px]">
                {LANGS.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLangChange(lang.code)}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${i18n.language === lang.code ? 'bg-[#FAF3E0] text-[#2D6A2D] font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link to="/cart" className="relative p-1 hover:text-[#FAF3E0] transition-colors" aria-label={`${t('nav.cart')}, ${cartCount} items`}>
            <ShoppingCart size={22} aria-hidden="true" />
            {cartCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#5DAB24] text-[10px] font-bold leading-none" aria-hidden="true">{cartCount}</span>}
          </Link>

          {isAuthenticated && (
            <Link to="/notifications" className="relative p-1 hover:text-[#FAF3E0] transition-colors" aria-label={`${t('nav.notifications')}, ${unreadCount} unread`}>
              <Bell size={22} aria-hidden="true" />
              {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex min-w-[1rem] items-center justify-center rounded-full bg-[#8B5E3C] px-0.5 text-[10px] font-bold leading-none" aria-hidden="true">{notifLabel}</span>}
            </Link>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link to={user?.role === 'farmer' ? '/farmer/profile' : '/profile'} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20 transition-colors">
                <User size={16} aria-hidden="true" /><span>{user?.name?.split(' ')[0]}</span>
              </Link>
              <button onClick={handleLogout} className="rounded-full bg-[#8B5E3C] px-3 py-1.5 text-sm font-medium hover:bg-[#7a5234] transition-colors">{t('nav.logout')}</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="rounded-full bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20 transition-colors">{t('nav.login')}</Link>
              <Link to="/register" className="rounded-full bg-[#5DAB24] px-3 py-1.5 text-sm font-medium hover:bg-[#4d9420] transition-colors">{t('nav.signup')}</Link>
            </div>
          )}
        </div>

        <button className="p-2 md:hidden" onClick={() => setMobileOpen((o) => !o)} aria-expanded={mobileOpen} aria-controls="mobile-menu" aria-label={mobileOpen ? 'Close menu' : 'Open menu'}>
          {mobileOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>
      </nav>

      {mobileOpen && (
        <div id="mobile-menu" className="border-t border-white/10 bg-[#2D6A2D] px-4 pb-4 md:hidden">
          <ul className="flex flex-col gap-3 pt-3" role="list">
            <li><Link to="/products" className="block py-1 hover:text-[#FAF3E0]" onClick={() => setMobileOpen(false)}>{t('nav.shop')}</Link></li>
            <li><Link to="/compare" className="block py-1 hover:text-[#FAF3E0]" onClick={() => setMobileOpen(false)}>{t('nav.compare')}</Link></li>
            <li><Link to="/group-buys" className="block py-1 hover:text-[#FAF3E0]" onClick={() => setMobileOpen(false)}>{t('nav.groupBuys')}</Link></li>
            <li><Link to="/map" className="block py-1 hover:text-[#FAF3E0]" onClick={() => setMobileOpen(false)}>{t('nav.nearbyFarmers')}</Link></li>
            <li><Link to="/cart" className="block py-1 hover:text-[#FAF3E0]" onClick={() => setMobileOpen(false)}>{t('nav.cart')} ({cartCount})</Link></li>
            {/* Mobile language switcher */}
            <li className="flex gap-2 pt-1">
              {LANGS.map((lang) => (
                <button key={lang.code} onClick={() => { handleLangChange(lang.code); setMobileOpen(false); }}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${i18n.language === lang.code ? 'bg-white text-[#2D6A2D] border-white' : 'border-white/30 hover:border-white'}`}>
                  {lang.label}
                </button>
              ))}
            </li>
            {isAuthenticated ? (
              <>
                <li><Link to="/notifications" className="block py-1 hover:text-[#FAF3E0]" onClick={() => setMobileOpen(false)}>{t('nav.notifications')} ({notifLabel})</Link></li>
                <li><Link to={user?.role === 'farmer' ? '/farmer/profile' : '/profile'} className="block py-1 hover:text-[#FAF3E0]" onClick={() => setMobileOpen(false)}>{t('nav.profile')}</Link></li>
                {user?.role === 'farmer' && <li><Link to="/farmer/dashboard" className="block py-1 hover:text-[#FAF3E0]" onClick={() => setMobileOpen(false)}>{t('nav.dashboard')}</Link></li>}
                <li><button onClick={handleLogout} className="w-full rounded bg-[#8B5E3C] py-2 text-left font-medium px-2">{t('nav.logout')}</button></li>
              </>
            ) : (
              <>
                <li><Link to="/login" className="block py-1 hover:text-[#FAF3E0]" onClick={() => setMobileOpen(false)}>{t('nav.login')}</Link></li>
                <li><Link to="/register" className="block py-1 hover:text-[#FAF3E0]" onClick={() => setMobileOpen(false)}>{t('nav.signup')}</Link></li>
              </>
            )}
          </ul>
        </div>
      )}
    </header>
  )
}
