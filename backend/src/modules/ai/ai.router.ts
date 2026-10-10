/**
 * ai.router.ts  —  POST /api/ai/chat
 *
 * If OPENAI_API_KEY is set in .env: forwards the message to OpenAI GPT.
 * Otherwise: uses a built-in rule-based FAQ system (clearly marked as non-AI).
 *
 * No API keys are ever sent to the frontend.
 */
import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

// ---------------------------------------------------------------------------
// Rule-based FAQ fallback
// ---------------------------------------------------------------------------
interface FaqEntry { patterns: RegExp[]; answer: string }

const FAQ: FaqEntry[] = [
  {
    patterns: [/register|sign up|create account|how to join/i],
    answer: "To register on FarmConnect:\n1. Click 'Sign up' in the top navigation.\n2. Enter your name, email, and a strong password.\n3. Choose your role: Customer (to buy) or Farmer (to sell).\n4. Click 'Create account'.\n\nFarmers will need to complete their farm profile after registration.",
  },
  {
    patterns: [/login|sign in|forgot password/i],
    answer: "To log in:\n1. Click 'Log in' in the top navigation.\n2. Enter your email and password.\n3. Click 'Sign in'.\n\nIf you forgot your password, please contact support (password reset is coming soon).",
  },
  {
    patterns: [/upload.*product|add.*product|list.*product|how.*sell|farmer.*list/i],
    answer: "For farmers to add products:\n1. Go to your Farmer Dashboard.\n2. Click 'New Product' or use 'Easy Mode' for a simplified form.\n3. Fill in product name, category, price, quantity, and harvest date.\n4. Click 'Add Product'.\n\nYour product will be visible on the marketplace immediately.",
  },
  {
    patterns: [/upload.*image|photo|picture|image/i],
    answer: "To upload product images:\n1. Open the product form (New Product or Edit Product).\n2. Click the 'Upload Photo' button in the image section.\n3. Select a JPEG, PNG, or WebP image (max 5 MB).\n4. Wait for the upload to complete.\n\nNote: Image upload requires Cloudinary credentials to be configured in the backend.",
  },
  {
    patterns: [/compare|price comparison|best price|cheapest/i],
    answer: "To compare prices:\n1. Click 'Compare' in the navigation bar.\n2. Search for a product name (e.g., 'tomato', 'rice').\n3. You'll see listings from all farmers, sorted by best price per kg.\n4. The best price is highlighted with a trophy icon.\n\nPrices are normalized to per-kg for fair comparison when possible.",
  },
  {
    patterns: [/group buy|group.*order|bulk.*discount|collective/i],
    answer: "Group Buying allows you to unlock bulk discounts:\n1. Go to 'Group Buys' in the navigation.\n2. Browse open group buys and click 'Join Group Buy'.\n3. Once enough customers join (reaching the minimum quantity), the group buy is confirmed and everyone gets the discounted price.\n\nFarmers can create group buys from their dashboard.",
  },
  {
    patterns: [/cart|add to cart|shopping/i],
    answer: "To add items to your cart:\n1. Browse products and click on any product card.\n2. Set the quantity and click 'Add to Cart'.\n3. Access your cart from the shopping cart icon in the top navigation.\n4. Click 'Proceed to Checkout' when ready.",
  },
  {
    patterns: [/order|place order|checkout|delivery/i],
    answer: "To place an order:\n1. Add products to your cart.\n2. Click the cart icon and then 'Proceed to Checkout'.\n3. Select your payment method (Cash on Delivery or Online).\n4. Click 'Place Order'.\n\nYou can track your order status from 'My Orders' in the navigation.",
  },
  {
    patterns: [/tomato|टमाटर|tomate/i],
    answer: "Tomatoes (टमाटर) cultivation tips:\n• Best season: Oct–Feb (Rabi) or June–Sept (Kharif)\n• Soil: Well-drained loamy soil, pH 6.0–7.0\n• Watering: 1–2 times per week; avoid waterlogging\n• Common pests: whitefly, aphids — use neem oil spray\n• Harvest: 60–80 days after transplanting\n\nFor pesticide advice, always consult your local Krishi Vigyan Kendra (KVK).",
  },
  {
    patterns: [/rice|paddy|wheat|cereal|grain/i],
    answer: "Grain cultivation general tips:\n• Rice: Needs flooded fields; plant in June–July\n• Wheat: Sow Oct–Nov; needs cool weather\n• Both need well-prepared fields with adequate irrigation\n• Use certified seeds for better yield\n\nFor specific fertilizer and pesticide recommendations, consult your local agricultural officer.",
  },
  {
    patterns: [/fertilizer|manure|compost|soil/i],
    answer: "Soil and fertilizer tips:\n• Organic compost improves soil structure and fertility\n• Test soil pH before applying fertilizers\n• Vermicompost is excellent for vegetable crops\n• For N-P-K requirements, consult your local Krishi Vigyan Kendra\n\n⚠️ Always follow label instructions for chemical fertilizers. Overuse harms soil health.",
  },
  {
    patterns: [/pest|disease|insect|fungus|spray/i],
    answer: "Pest management general guidance:\n• Neem oil (5ml/litre) is safe for most insects\n• Remove infected plants to prevent spread\n• Crop rotation reduces soil-borne diseases\n• Early morning spraying is most effective\n\n⚠️ For specific pesticide recommendations, contact your local Krishi Vigyan Kendra or agricultural extension officer. Do not increase dosages beyond label instructions.",
  },
  {
    patterns: [/irrigation|water|drip/i],
    answer: "Irrigation tips:\n• Drip irrigation saves 30–50% water compared to flood irrigation\n• Water vegetables early morning or evening\n• Avoid overwatering — check soil moisture at 2-inch depth\n• Mulching reduces water evaporation significantly",
  },
  {
    patterns: [/price|rate|market|mandi/i],
    answer: "About product pricing on FarmConnect:\n• Farmers set their own prices directly\n• Use the Compare page to see the best prices for any product\n• Prices are updated in real-time as farmers modify them\n• Group buys offer discounted prices when minimum quantities are met",
  },
  {
    patterns: [/language|telugu|hindi|english|భాష|भाषा/i],
    answer: "FarmConnect supports multiple languages:\n• Use the language selector (🌐) in the navigation bar\n• Available languages: English, తెలుగు (Telugu), हिन्दी (Hindi)\n• Your language choice is saved and applied across all pages\n• Voice assistant also adapts to your selected language",
  },
  {
    patterns: [/voice|speak|microphone|audio/i],
    answer: "Voice Assistant features:\n• Click the microphone button (🎤) floating on the right side\n• Speak your search query or question\n• Supports Telugu, Hindi, and English\n• Text-to-speech reads product information aloud\n• Works on Chrome, Edge, and Safari mobile browsers",
  },
  {
    patterns: [/map|location|nearby|distance|village/i],
    answer: "Find nearby farmers:\n• Click 'Nearby Farmers' on the homepage or go to /map\n• Allow location access or enter your village/town manually\n• Map shows all active farmers with product listings\n• Filter by distance (5km, 10km, 25km, 50km)\n• Click any map marker to see that farmer's products",
  },
  {
    patterns: [/hello|hi|hey|namaste|నమస్కారం|नमस्ते/i],
    answer: "Hello! Welcome to FarmConnect AI Assistant 🌱\n\nI can help you with:\n• How to use FarmConnect (buy, sell, compare, group buys)\n• Farming tips (crops, soil, irrigation, pest management)\n• Product information and pricing\n• Technical support\n\nAsk me anything in English, Telugu, or Hindi!",
  },
];

function getRuleBasedAnswer(message: string): string {
  const msg = message.trim();
  for (const entry of FAQ) {
    if (entry.patterns.some((p) => p.test(msg))) {
      return entry.answer;
    }
  }
  return `I don't have a specific answer for that, but I can help with:\n• Registering and using FarmConnect\n• Farming tips (crops, soil, water, pests)\n• Comparing prices and placing orders\n• Group buying and farmer features\n\nTry asking about a specific topic, or visit your local Krishi Vigyan Kendra for agricultural advice.`;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
router.post('/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, history } = req.body as {
      message: string;
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    };

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const openaiKey = process.env['OPENAI_API_KEY'];
    const hasOpenAI = openaiKey && openaiKey.length > 10 && !openaiKey.startsWith('sk-placeholder');

    if (hasOpenAI) {
      // Try OpenAI (without importing the SDK to keep dependencies minimal)
      try {
        const messages = [
          {
            role: 'system',
            content: `You are FarmConnect AI Assistant, a helpful assistant for an Indian agricultural marketplace. 
Help farmers and customers with: using the platform, farming tips, crop cultivation, soil care, irrigation, pest management, pricing, orders, and group buying. 
For pesticide/chemical advice: provide only general safe guidance and always recommend consulting local Krishi Vigyan Kendra.
Support English, Telugu, and Hindi. Keep responses concise and practical.`,
          },
          ...(history ?? []).slice(-6),
          { role: 'user', content: message },
        ];

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
          body: JSON.stringify({ model: 'gpt-3.5-turbo', messages, max_tokens: 500, temperature: 0.7 }),
        });

        if (response.ok) {
          const data = await response.json() as { choices: Array<{ message: { content: string } }> };
          const reply = data.choices[0]?.message?.content ?? '';
          return res.json({ success: true, data: { reply, source: 'ai' } });
        }
      } catch {
        // Fall through to rule-based
      }
    }

    // Rule-based fallback
    const reply = getRuleBasedAnswer(message);
    return res.json({
      success: true,
      data: {
        reply,
        source: 'rules',
        note: hasOpenAI
          ? 'AI service temporarily unavailable. Using built-in FAQ.'
          : 'Using built-in FAQ assistant. Set OPENAI_API_KEY in backend/.env for AI responses.',
      },
    });
  } catch (err) {
    return next(err);
  }
});

// Suggested questions endpoint
router.get('/suggestions', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      suggestions: [
        'How do I register as a farmer?',
        'How to add my products to the marketplace?',
        'How does group buying work?',
        'How to compare prices?',
        'Tips for growing tomatoes organically',
        'How to protect crops from pests?',
        'How to use voice search?',
        'Find nearby farmers on the map',
      ],
    },
  });
});

export default router;
