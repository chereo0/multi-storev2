# Quantum Multiverse — mult-seller-frontend

This repository contains the frontend for the Quantum Multiverse multi-seller storefront. It's a React app (Create React App) using TailwindCSS and GSAP for animations.

This README covers: quick setup, development commands (PowerShell-ready), theme handling, About page specifics (GSAP and particles), troubleshooting, and contribution notes.

## Table of contents

- Requirements
- Quick start (PowerShell)
- Development workflow
- Build & deploy
- About page (animations, theme, files)
- Theme system
- GSAP & animation notes
- Troubleshooting
- Contributing

---

## Requirements

- Node.js 18+ (LTS recommended)
- npm (bundled with Node) or yarn
- Windows PowerShell (instructions use PowerShell-friendly commands)

## Quick start (PowerShell)

Open PowerShell in the repository root and run:

```powershell
cd "e:\mult-seller(frontend)\mult-seller-frontend"
npm install
npm start
```

This runs the development server at http://localhost:3000 by default.

If you see package install permission errors on Windows, re-run PowerShell as Administrator or ensure your workspace path is writable.

## Development workflow

- Start dev server: `npm start`
- Build for production: `npm run build`
- Run tests: `npm test`

When developing, watch for console errors in the browser — the app uses several advanced features (GSAP, canvas particles) that may log helpful messages during development.

## Build & deploy

Use `npm run build` to create a production build in the `build/` directory. Serve that directory with any static host or use your CI to deploy to your platform of choice.

## About page (special notes)

The About page (`src/pages/AboutPage.js`) is a visually-rich, GSAP-animated page with these components in `src/components/about/`:

- `AboutHero.js` — hero with particle background and theme-aware background image (`public/About.png` and `public/About Dark.png`).
- `ParticleField.js` — canvas-based particle system. It resizes using the element bounding rect and uses requestAnimationFrame for smooth animation.
- `MissionSection.js`, `JourneyTimeline.js`, `FeatureCards.js`, `CTASection.js` — sections that use GSAP + ScrollTrigger for entrance and scroll-based animations.

If you plan to modify the hero's background assets, place them in `public/` and update the filenames used in `AboutHero.js`.

### Known caveats

- The particle canvas relies on its container having a non-zero layout size. If the hero appears collapsed, verify parent CSS provides height (or supply an explicit height).
- On mobile and low-powered devices you may want to reduce particle density (the `density` prop in `ParticleField` controls this).

## Theme system

Theme is managed by `ThemeContext` (`src/context/ThemeContext.js`). Key points:

- `ThemeProvider` exposes `isDarkMode` and `toggleTheme` via the `useTheme()` hook.
- The provider applies `theme-dark` or `theme-light` CSS classes to `document.documentElement` so components can target them in CSS or JS.
- Components should use `useTheme()` when they need to react to the theme (preferred) instead of querying `document.documentElement`.

If you'd like to persist theme choices across sessions, add a localStorage sync inside `ThemeContext`.

## GSAP & animation notes

We use GSAP (installed as dependency) and ScrollTrigger in multiple components. Implementation notes:

- Register plugins in files where they are used (e.g., `gsap.registerPlugin(ScrollTrigger)`).
- Prefer `transform` and `opacity` for performant GPU-accelerated animations.
- Use `ScrollTrigger`'s `scrub`, `pin`, and `start`/`end` options for scroll-based animations.
- Avoid running complex animations on mobile. Use `window.matchMedia('(prefers-reduced-motion: reduce)')` and device width checks to disable heavy effects when appropriate.

If you need premium GSAP plugins (SplitText, etc.) you will need a Club GreenSock account and follow GSAP's installation instructions for plugins.

## Troubleshooting

- Missing module `gsap` after pulling the repo: run `npm install gsap --save` in the project root.
- Error `Cannot set property clientWidth of #<Element> which has only a getter`: this means code was assigning `element.clientWidth = ...`. The project uses `getBoundingClientRect()` and sets the canvas `width/height` directly — don't assign to `.clientWidth` or `.clientHeight`.
- If you see duplicate navbars on a page, ensure the page doesn't also render `Navbar` if `App.js` already renders the global navigation (we use a single global nav).

## Contributing

1. Create a branch from `master` for your change.
2. Make changes and run the dev server locally.
3. Run `npm test` if you add tests.
4. Commit and open a PR with a descriptive title.

Coding guidelines

- Follow existing project conventions — Tailwind utility classes and React functional components.
- Keep animations using transform/opacity where possible.

## Commands (PowerShell)

```powershell
# install deps
cd "e:\mult-seller(frontend)\mult-seller-frontend"
npm install

# run dev server
npm start

# build
npm run build

# run tests
npm test
```

## Final notes

If you'd like, I can:

- Add a small accessibility audit checklist (focus indicators, ARIA labels, keyboard timeline controls).
- Add prefers-reduced-motion handling across GSAP animations.
- Move theme toggle into a single shared header and remove any ad-hoc toggles.

Tell me what to do next and I’ll make the change.

# Multi-Seller Frontend

A React-based e-commerce platform that allows users to browse multiple stores, view products, manage cart, and place orders.

## Features

### 🔐 Authentication

- **Sign Up**: Create new user accounts with full name, email, phone, and address
- **Login**: Secure user authentication
- **Guest Mode**: Browse and shop without creating an account

### 🏠 Homepage

- **Categories**: Browse products by category (Electronics, Fashion, Home & Garden, etc.)
- **Featured Stores**: View all available stores with ratings and verification status
- **Store Navigation**: Click on any store to view its products and details

### 🏪 Store Pages

- **Store Information**: View store banner, logo, description, and ratings
- **Product Catalog**: Browse all products from a specific store
- **Product Details**: View product images, descriptions, prices, and ratings
- **Add to Cart**: Add products to shopping cart with quantity selection
- **Store Reviews**: Read and write reviews for stores
- **Product Reviews**: Read and write reviews for individual products

### 🛒 Cart & Checkout

- **Shopping Cart**: View all selected products organized by store
- **Quantity Management**: Increase/decrease product quantities
- **Remove Items**: Remove products from cart
- **Checkout Form**: Complete order with:
  - Full Name
  - Email Address
  - Phone Number
  - Current Location
  - Preferred Delivery Time
- **Order Confirmation**: Receive order confirmation with estimated delivery

### ⭐ Reviews & Ratings

- **Store Ratings**: Rate stores from 1-5 stars
- **Product Ratings**: Rate individual products
- **Public Reviews**: All reviews are visible to other users
- **User Authentication**: Must be logged in to submit reviews

## Technology Stack

- **React**: Frontend framework
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **React Bits**: UI component library
- **Context API**: State management for authentication and cart

## Project Structure

```
src/
├── api/
│   └── services.js          # Placeholder API functions
├── components/
│   ├── Header.js           # Reusable header component
│   ├── LoadingSpinner.js   # Loading spinner component
│   └── StarRating.js       # Star rating component
├── context/
│   ├── AuthContext.js      # Authentication state management
│   └── CartContext.js      # Shopping cart state management
├── pages/
│   ├── auth/
│   │   ├── Login.js        # Login page
│   │   └── Signup.js       # Signup page
│   ├── cart/
│   │   └── CartPage.js     # Cart and checkout page
│   ├── home/
│   │   └── Homepage.js     # Main homepage
│   └── store/
│       └── StorePage.js    # Individual store page
├── App.js                  # Main app component with routing
└── index.js               # App entry point
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd mult-seller-frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (one-way operation)

## API Integration

The project includes placeholder API functions in `src/api/services.js`. These functions simulate API calls with mock data and can be easily replaced with actual Laravel backend endpoints:

### Available API Functions

- `getCategories()` - Fetch all product categories
- `getStores()` - Fetch all stores
- `getStore(storeId)` - Fetch specific store details
- `getProducts(storeId)` - Fetch products for a specific store
- `getProduct(productId)` - Fetch specific product details
- `getStoreReviews(storeId)` - Fetch reviews for a store
- `getProductReviews(productId)` - Fetch reviews for a product
- `submitStoreReview(storeId, reviewData)` - Submit a store review
- `submitProductReview(productId, reviewData)` - Submit a product review
- `submitOrder(orderData)` - Submit an order

### Backend Integration

To connect with your Laravel backend:

1. Replace the mock data in `services.js` with actual API calls
2. Update the API endpoints to match your Laravel routes
3. Add proper error handling and authentication headers
4. Implement real user authentication flow

Example API call:

```javascript
export const getStores = async () => {
  try {
    const response = await fetch("/api/stores", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

## Features Implementation

### Authentication Flow

- Users can sign up with detailed information
- Login/logout functionality with persistent sessions
- Guest users can browse but need to login for reviews and checkout

### Shopping Cart

- Add/remove products with quantity management
- Cart persists across browser sessions
- Items are organized by store for better UX

### Reviews System

- Star-based rating system (1-5 stars)
- Text reviews with user information
- Separate reviews for stores and products
- Authentication required for submitting reviews

### Responsive Design

- Mobile-first approach with Tailwind CSS
- Responsive grid layouts
- Touch-friendly interface elements

## Future Enhancements

- User profile management
- Order history and tracking
- Wishlist functionality
- Advanced search and filtering
- Payment integration
- Real-time notifications
- Multi-language support
- Dark mode theme

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
