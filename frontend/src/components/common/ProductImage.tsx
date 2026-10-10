/**
 * ProductImage — renders a product image with onError fallback.
 * Falls back to a category-specific emoji if the URL fails to load.
 * Never shows a broken-image icon.
 */
import { useState } from 'react'

const CATEGORY_EMOJI: Record<string, string> = {
  Vegetables:        '🥦',
  Fruits:            '🍎',
  'Grains & Pulses': '🌾',
  'Dairy & Eggs':    '🥛',
  'Herbs & Spices':  '🌿',
  Flowers:           '🌸',
  Other:             '🛒',
}

// Keyword → guaranteed fallback image for the most common products
const NAME_FALLBACK: Array<[RegExp, string]> = [
  [/tomato/i,      'https://images.unsplash.com/photo-1546094096-0df4bcabd2ef?w=400&q=70'],
  [/onion/i,       'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=400&q=70'],
  [/potato/i,      'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=70'],
  
 
  
  
  [/carrot/i,      'https://images.unsplash.com/photo-1447175008436-054170c2e979?w=400&q=70'],
  [/banana/i,      'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=400&q=70'],
  [/papaya/i,      'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=400&q=70'],
  [/mango/i,       'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400&q=70'],
  [/rice/i,        'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=70'],
  [/dal|lentil|pulse/i,'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&q=70'],
  
  [/turmeric|haldi/i,'https://images.unsplash.com/photo-1615485291066-9a6a3fcdf1c9?w=400&q=70'],
  [/wheat/i,       'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=70'],
  [/milk/i,        'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=70'],
]

function getNameFallback(productName: string): string | null {
  for (const [pattern, url] of NAME_FALLBACK) {
    if (pattern.test(productName)) return url
  }
  return null
}

interface ProductImageProps {
  src: string | null | undefined
  alt: string
  category?: string
  className?: string
}

export default function ProductImage({ src, alt, category = 'Other', className = '' }: ProductImageProps) {
  const [failed, setFailed] = useState(false)

  // Determine what to show
  const nameFallback = getNameFallback(alt)
  const effectiveSrc = failed ? (nameFallback ?? null) : src

  if (!effectiveSrc) {
    // No image at all — show emoji fallback
    return (
      <div className={`flex items-center justify-center bg-[#FAF3E0] ${className}`}>
        <span className="text-5xl select-none" role="img" aria-label={alt}>
          {CATEGORY_EMOJI[category] ?? '🛒'}
        </span>
      </div>
    )
  }

  return (
    <img
      src={effectiveSrc}
      alt={alt}
      className={`w-full h-full object-cover ${className}`}
      loading="lazy"
      onError={() => {
        if (!failed) setFailed(true)
      }}
    />
  )
}