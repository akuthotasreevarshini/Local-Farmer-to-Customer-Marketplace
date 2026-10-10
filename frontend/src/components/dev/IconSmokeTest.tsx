/**
 * IconSmokeTest — confirms lucide-react icons render correctly.
 * Remove or exclude from production builds.
 */
import {
  Leaf,
  ShoppingCart,
  Bell,
  User,
  Menu,
  X,
  Search,
  Star,
  Heart,
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  Info,
  XCircle,
  ChevronRight,
  ArrowLeft,
  Upload,
  Trash2,
  Edit,
  Plus,
  Minus,
  Filter,
  MapPin,
  Phone,
  Mail,
  Eye,
  EyeOff,
  LogOut,
  Settings,
  BarChart3,
  Users,
  PackageOpen,
  AlertTriangle,
} from 'lucide-react'

const ICONS = [
  { Icon: Leaf, name: 'Leaf' },
  { Icon: ShoppingCart, name: 'ShoppingCart' },
  { Icon: Bell, name: 'Bell' },
  { Icon: User, name: 'User' },
  { Icon: Menu, name: 'Menu' },
  { Icon: X, name: 'X' },
  { Icon: Search, name: 'Search' },
  { Icon: Star, name: 'Star' },
  { Icon: Heart, name: 'Heart' },
  { Icon: Package, name: 'Package' },
  { Icon: Truck, name: 'Truck' },
  { Icon: CheckCircle2, name: 'CheckCircle2' },
  { Icon: AlertCircle, name: 'AlertCircle' },
  { Icon: Info, name: 'Info' },
  { Icon: XCircle, name: 'XCircle' },
  { Icon: ChevronRight, name: 'ChevronRight' },
  { Icon: ArrowLeft, name: 'ArrowLeft' },
  { Icon: Upload, name: 'Upload' },
  { Icon: Trash2, name: 'Trash2' },
  { Icon: Edit, name: 'Edit' },
  { Icon: Plus, name: 'Plus' },
  { Icon: Minus, name: 'Minus' },
  { Icon: Filter, name: 'Filter' },
  { Icon: MapPin, name: 'MapPin' },
  { Icon: Phone, name: 'Phone' },
  { Icon: Mail, name: 'Mail' },
  { Icon: Eye, name: 'Eye' },
  { Icon: EyeOff, name: 'EyeOff' },
  { Icon: LogOut, name: 'LogOut' },
  { Icon: Settings, name: 'Settings' },
  { Icon: BarChart3, name: 'BarChart3' },
  { Icon: Users, name: 'Users' },
  { Icon: PackageOpen, name: 'PackageOpen' },
  { Icon: AlertTriangle, name: 'AlertTriangle' },
]

export default function IconSmokeTest() {
  return (
    <section className="p-6">
      <h2 className="mb-4 text-xl font-bold text-[#2D6A2D]">
        Icon Smoke Test — lucide-react
      </h2>
      <div className="grid grid-cols-4 gap-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
        {ICONS.map(({ Icon, name }) => (
          <div
            key={name}
            className="flex flex-col items-center gap-1 rounded-lg border border-gray-200 p-2 text-center"
          >
            <Icon size={24} className="text-[#2D6A2D]" aria-hidden="true" />
            <span className="text-[10px] text-gray-500 leading-tight">{name}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
