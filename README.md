# 🏪 Multi-Store E-Commerce Platform

> **A Revolutionary Multi-Vendor Marketplace** - Shop from hundreds of independent stores in one unified platform!

A comprehensive **multi-store, multi-vendor** e-commerce marketplace with modern UI/UX, enabling customers to browse products from multiple independent vendors, manage wishlists across stores, track orders from different sellers, and enjoy a seamless shopping experience—all in one place.

![Version](https://img.shields.io/badge/Version-2.0.0-blue)
![React](https://img.shields.io/badge/React-18.x-61dafb)
![Laravel](https://img.shields.io/badge/Laravel-Backend-red)
![Multi--Vendor](https://img.shields.io/badge/Multi--Vendor-Marketplace-orange)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### 🎨 Design & UI
- **Modern Theme System**: Beautiful light/dark mode with smooth transitions and theme persistence
- **Responsive Design**: Fully responsive across all devices (mobile, tablet, desktop)
- **Glassmorphism Effects**: Modern glass-effect UI components with backdrop blur
- **Animated Components**: Smooth transitions and hover effects throughout
- **Intuitive Navigation**: Easy-to-use navigation with contextual breadcrumbs

### 🛒 Multi-Store E-Commerce Functionality
- **🏪 Multi-Vendor Marketplace**: Browse and shop from hundreds of independent stores in one platform
- **🎯 Smart Store Discovery**: Filter stores by categories, ratings (1-5 stars), and location
- **🔍 Unified Search**: Search across all stores for products with real-time suggestions
- **🛒 Multi-Store Cart**: Add products from different vendors to a single cart with store-based grouping
- **❤️ Cross-Store Wishlist**: Save favorite products from any store with persistent storage
- **📦 Centralized Order Management**: Track orders from multiple vendors in one place with real-time status updates
- **🎨 Product Variants**: Full support for product options (size, color, style, etc.)
- **💰 Smart Pricing**: Visual discount display with original price strikethrough and sale badges
- **🆕 Latest Products**: Discover newest arrivals across all stores
- **⭐ Store & Product Reviews**: Rate and review individual stores and products

### 🏪 Multi-Vendor Store Features
- **🎪 Independent Store Storefronts**: Each vendor gets a dedicated branded page with custom styling
- **📦 Vendor Product Catalogs**: Browse complete product collections from individual stores
- **📍 Store Information**: Vendor contact details, social media links, descriptions, and policies
- **⭐ Vendor Ratings**: Rate and review store performance, service quality, and shipping speed
- **💬 Product Reviews**: Customer reviews and ratings for individual products
- **🏷️ Store Categories**: Vendors organized by product categories for easy discovery
- **📊 Store Performance**: Ratings filter helps customers find top-performing vendors

### 👤 User Features
- **Authentication**: Secure login/signup with OTP verification
- **User Profile**: Manage personal information and preferences
- **Address Management**: Save and manage multiple shipping addresses
- **Order History**: View past orders with detailed information
- **Order Status Notifications**: Real-time toast notifications for order updates
- **Cancelled Orders Hidden**: Automatically hide cancelled orders from order list

### 📱 Pages & Navigation
- **🏠 Homepage**: Dynamic hub with hero carousel, store categories, new arrivals from all vendors, and wishlist products
- **🏪 Multi-Store Marketplace**: Browse all vendor stores with category sidebar and rating filters (⭐1-5)
- **🎪 Individual Store Pages**: Dedicated vendor storefronts with complete product catalogs and store info
- **📦 Product Details**: Detailed product view with vendor info, images, variants, and add to cart
- **🆕 Latest Products**: Discover newest arrivals across all stores (browse-only mode)
- **🔍 Universal Search**: Search across all vendors for products and stores with instant results
- **🛒 Multi-Vendor Cart**: Unified shopping cart with store-grouped items and streamlined checkout
- **📋 Order Hub**: View all orders from different vendors with status tracking and notifications
- **👤 Profile Management**: User account settings and preferences
- **ℹ️ About Us**: Platform information and marketplace mission
- **📞 Contact**: Support and inquiry form

## 🚀 Tech Stack

### Frontend (React)
- **React** 18.x - UI Framework
- **React Router DOM** v6 - Client-side routing and navigation
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API requests
- **React Hot Toast** - Toast notifications
- **Heroicons** - Icon library
- **Lucide React** - Additional icon library
- **Three.js** (@react-three/fiber) - 3D graphics (store backgrounds)

### State Management
- **Context API** - Global state management
  - `AuthContext` - User authentication state
  - `CartContext` - Shopping cart state
  - `WishlistContext` - Wishlist state
  - `ThemeContext` - Theme preferences (light/dark mode)
  - `ToastContext` - Toast notifications

### Backend API (Laravel)
- **Laravel** - PHP framework
- **RESTful API** - API architecture
- **OAuth2** - Token-based authentication
- **MySQL** - Database

### Backend Endpoints
- **Authentication**: `/login`, `/register`, `/verify_otp`, `/logout`
- **Products**: `/products/:id`, `/latest`, `/store/:id/products`
- **Stores**: `/store/:id`, `/getstoresbycategoryid/:id`
- **Categories**: `/categories`
- **Cart**: `/cart` (GET, POST, PUT, DELETE)
- **Wishlist**: `/wishlist/:id` (GET, POST, DELETE)
- **Orders**: `/orders`, `/orders/:id`, `/orders/:id/cancel`
- **Addresses**: `/address` (CRUD operations)
- **Profile**: `/profile` (GET, PUT)
- **Shipping**: `/shippingmethods`, `/selectshipping`
- **Payment**: `/paymentmethods`, `/selectpayment`
- **Checkout**: `/confirmCheckout`
- **Homepage**: `/home_page_builder` (dynamic widgets)

## 📦 Installation

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Git**

### Frontend Setup

1. **Clone the repository**
```bash
git clone https://github.com/chereo0/multi-storev2.git
cd multi-storev2/mult-seller-frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create a `.env` file in the frontend root:
```env
REACT_APP_API_URL=https://multi-store-api.cloudgoup.com/api/rest
REACT_APP_TOKEN_URL=https://multi-store-api.cloudgoup.com/api/rest/oauth2/token
REACT_APP_OAUTH_CLIENT_ID=shopping_oauth_client
REACT_APP_OAUTH_CLIENT_SECRET=shopping_oauth_secret
```

4. **Start the development server**
```bash
npm start
```
The app will run on `http://localhost:3000`

5. **Build for production**
```bash
npm run build
```

### Backend Setup (Laravel API)

1. **API Base URL**
```
https://multi-store-api.cloudgoup.com/api/rest
```

2. **Authentication**
- OAuth2 client credentials flow for guest access
- Bearer token authentication for user-specific operations
- Tokens stored in localStorage/sessionStorage

3. **API Documentation**
Refer to backend API documentation for detailed endpoint specifications

## 📁 Project Structure

```
multi-storev2/
├── mult-seller-frontend/           # Multi-Store Frontend (React)
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── slideshow/              # Hero slideshow images
│   ├── src/
│   │   ├── api/
│   │   │   ├── index.js           # Axios instance configuration
│   │   │   ├── services.js        # API service functions
│   │   │   └── tokenManager.js    # Token management
│   │   ├── components/
│   │   │   ├── CategoryCard.jsx
│   │   │   ├── Header.js
│   │   │   ├── HeroSlideshow.js
│   │   │   ├── LoadingSpinner.js
│   │   │   ├── LocationPicker.jsx
│   │   │   ├── Logo.js
│   │   │   ├── ModernHeader.js
│   │   │   ├── Navbar.js
│   │   │   ├── StarRating.js
│   │   │   ├── StoreCard.jsx
│   │   │   ├── ThemeToggle.js
│   │   │   ├── ThreeScene.js
│   │   │   ├── Toast.js
│   │   │   └── about/             # About page components
│   │   ├── context/
│   │   │   ├── AuthContext.js     # Authentication state
│   │   │   ├── CartContext.js     # Shopping cart state
│   │   │   ├── ThemeContext.js    # Theme preferences
│   │   │   ├── ToastContext.js    # Toast notifications
│   │   │   └── WishlistContext.js # Wishlist state
│   │   ├── hooks/
│   │   │   └── useApiCall.js      # Custom API call hook
│   │   ├── pages/
│   │   │   ├── AboutPage.js
│   │   │   ├── AddressPage.js
│   │   │   ├── CategoryPage.jsx
│   │   │   ├── ContactPage.js
│   │   │   ├── ProfilePage.js
│   │   │   ├── ServicesPage.js
│   │   │   ├── StoresPage.js
│   │   │   ├── auth/
│   │   │   │   ├── AuthPage.js
│   │   │   │   ├── Login.js
│   │   │   │   ├── Signup.js
│   │   │   │   └── VerifyOTP.js
│   │   │   ├── cart/
│   │   │   │   └── CartPage.js
│   │   │   ├── home/
│   │   │   │   └── Homepage.js
│   │   │   ├── orders/
│   │   │   │   ├── OrderDetailPage.js
│   │   │   │   └── OrdersPage.js
│   │   │   ├── product/
│   │   │   │   ├── LatestProductsPage.js
│   │   │   │   └── ProductPage.js
│   │   │   ├── search/
│   │   │   │   └── SearchPage.js
│   │   │   └── store/
│   │   │       ├── PhoenixEmporium.js
│   │   │       ├── ProductPage.js
│   │   │       └── StorePage.js
│   │   ├── styles/
│   │   │   └── animations.css
│   │   ├── App.css
│   │   ├── App.js
│   │   ├── App.test.js
│   │   ├── index.css
│   │   ├── index.js
│   │   ├── reportWebVitals.js
│   │   └── setupTests.js
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
├── README.md
├── URGENT_BACKEND_FIX_REQUIRED.md
└── WISHLIST_ISSUES_REPORT.md
```

## 🎯 Key Components & Features

### 1. Authentication System
```javascript
// AuthContext provides authentication state
const { user, isAuthenticated, login, logout } = useAuth();

// Login flow with token management
await login(userInfo); // Stores user and token in localStorage
```

**Features:**
- OAuth2 token authentication
- OTP verification for signup
- Session persistence across refreshes
- Automatic token refresh
- Fallback to client token for guest access

### 2. Multi-Store Shopping Cart
```javascript
// CartContext for multi-vendor cart operations
const { 
  cartItems,           // Products from multiple vendors
  addToCart,          // Add from any store
  removeFromCart, 
  updateQuantity,
  clearCart,
  getCartItemsCount 
} = useCart();

// Add product with store identification
await addToCart(product, storeId); // storeId links to vendor
```

**Multi-Store Features:**
- **🏪 Multi-Vendor Support**: Add products from unlimited different stores to one cart
- **📦 Store Grouping**: Cart items automatically grouped by vendor for clarity
- **⚙️ Product Options**: Full support for variants (size, color, etc.) across all vendors
- **🔄 Real-Time Sync**: Cart syncs with backend across all vendor stores
- **⚠️ Conflict Resolution**: Handles inventory conflicts across multiple stores
- **📊 Store-Based Checkout**: Separate checkout flows per vendor when needed

### 3. Cross-Store Wishlist System
```javascript
// WishlistContext for multi-vendor wishlist
const { 
  wishlist,              // Products from any store
  addToWishlist,         // Save from any vendor
  removeFromWishlist, 
  isInWishlist           // Check across all stores
} = useWishlist();
```

**Multi-Vendor Wishlist Features:**
- **🏪 Cross-Store Favorites**: Save products from any vendor in one unified wishlist
- **💾 Persistent Storage**: Wishlist survives across sessions and devices
- **🔄 Multi-Store Sync**: Server synchronization across all vendor products
- **⚡ Quick Toggle**: One-click add/remove from any store's products
- **🏠 Homepage Display**: Featured wishlist products from all vendors on homepage

### 4. Theme System
```javascript
// ThemeContext for theme management
const { isDarkMode, toggleTheme, colors } = useTheme();
```

**Features:**
- Light/Dark mode toggle
- Persistent theme preference
- Smooth transitions
- Theme-aware color palette
- Automatic color adjustments

### 5. Multi-Store Discovery & Filtering
```javascript
// StoresPage with smart vendor filtering
const handleSelectCategory = (categoryId) => {
  // Updates URL: /stores?categoryId=123
  // Shows only stores in selected category
  navigate(`/stores?categoryId=${categoryId}`);
};
```

**Multi-Store Discovery Features:**
- **🎯 Category-Based Discovery**: Filter vendors by product categories (Electronics, Fashion, Home, etc.)
- **⭐ Rating Filter**: Find top-rated stores with 1-5 star filtering
- **🔗 URL-Based State**: Shareable filtered marketplace views
- **📱 Sidebar Navigation**: Easy category browsing for store discovery
- **✅ Accuracy Layer**: Client-side filtering ensures only actual stores appear (no products)
- **🔍 Smart Detection**: Distinguishes between stores and products for clean listings

### 6. Order Management
```javascript
// Order tracking with notifications
const [orders, setOrders] = useState([]);

// Poll for order updates
useEffect(() => {
  const interval = setInterval(checkOrderUpdates, 30000);
  return () => clearInterval(interval);
}, []);
```

**Features:**
- Real-time order status updates
- Toast notifications for changes
- Hide cancelled orders
- Order detail view
- Order cancellation

### 7. Product Options & Variants
```javascript
// Handle product options
const [selectedOptions, setSelectedOptions] = useState({});

// Validate required options
const requiredOptions = product.options.filter(opt => opt.required);
const allSelected = requiredOptions.every(opt => 
  selectedOptions[opt.id]
);
```

**Features:**
- Dynamic option rendering (select, radio, checkbox)
- Required option validation
- Price adjustments per option
- Multiple option types support

### 8. Discount Price Display
```javascript
// Product with discount
{product.hasDiscount && (
  <>
    <span className="text-3xl font-bold text-cyan-400">
      {product.specialPriceDisplay}
    </span>
    <span className="line-through text-gray-500">
      {product.originalPriceDisplay}
    </span>
    <span className="bg-red-500 text-white">SALE</span>
  </>
)}
```

## 🎨 Theme Configuration

### Dark Mode
- Deep navy/purple gradient backgrounds
- Cyan (#00E5FF) and purple (#FF00FF) accents
- Glassmorphism effects with backdrop blur
- Glowing borders and shadows
- High contrast for readability

### Light Mode
- Clean white/gray backgrounds
- Soft cyan and purple accents
- Subtle shadows
- High contrast text
- Professional appearance

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#00E5FF',
        secondary: '#FF00FF',
      },
    },
  },
  plugins: [],
};
```

## 🌐 Environment Variables

### Frontend (.env)
```env
# API Configuration
REACT_APP_API_URL=https://multi-store-api.cloudgoup.com/api/rest
REACT_APP_TOKEN_URL=https://multi-store-api.cloudgoup.com/api/rest/oauth2/token

# OAuth2 Credentials
REACT_APP_OAUTH_CLIENT_ID=shopping_oauth_client
REACT_APP_OAUTH_CLIENT_SECRET=shopping_oauth_secret
```

### Backend (Laravel .env)
```env
# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=multi_store
DB_USERNAME=root
DB_PASSWORD=

# Application
APP_URL=https://multi-store-api.cloudgoup.com

# OAuth2
PASSPORT_CLIENT_ID=1
PASSPORT_CLIENT_SECRET=your_secret_here
```

## 📱 Responsive Breakpoints

```javascript
// Tailwind breakpoints
- xs: < 640px   (Mobile)
- sm: 640px     (Small tablets)
- md: 768px     (Tablets)
- lg: 1024px    (Laptops)
- xl: 1280px    (Desktops)
- 2xl: 1536px   (Large screens)
```

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)

1. **Build the project**
```bash
cd mult-seller-frontend
npm run build
```

2. **Deploy to Vercel**
```bash
npm install -g vercel
vercel --prod
```

3. **Deploy to Netlify**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=build
```

4. **Environment Variables**
Add these in your hosting platform:
- `REACT_APP_API_URL`
- `REACT_APP_TOKEN_URL`
- `REACT_APP_OAUTH_CLIENT_ID`
- `REACT_APP_OAUTH_CLIENT_SECRET`

### Backend Deployment (Laravel)

1. **Server Requirements**
- PHP >= 8.0
- MySQL >= 5.7
- Composer
- Apache/Nginx with mod_rewrite

2. **Deploy Steps**
```bash
composer install --optimize-autoloader --no-dev
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan migrate --force
```

3. **Configure Web Server**
Point document root to `/public`

## 🐛 Known Issues & Solutions

### Frontend Issues

1. **Stores showing products instead of stores**
   - **Solution**: Implemented filtering to exclude items with `product_id`
   - **Status**: ✅ Fixed

2. **Authentication state not updating after signup/login**
   - **Solution**: Added token extraction, fallback to client_token, and improved state sync
   - **Status**: ✅ Fixed

3. **Category filter showing all stores**
   - **Solution**: Added client-side filtering and URL-based category selection
   - **Status**: ✅ Fixed

4. **Duplicate navbar on product page**
   - **Solution**: Removed custom header from ProductPage
   - **Status**: ✅ Fixed

### Backend Issues

1. **Inconsistent API response shapes**
   - **Solution**: Added defensive parsing and multiple field fallbacks
   - **Workaround**: Frontend normalizes all responses

2. **Token field variations in auth responses**
   - **Solution**: Check multiple possible token locations
   - **Status**: Handled in frontend

## 🔜 Roadmap & Future Enhancements

### Phase 1 (Completed ✅)
- [x] Multi-store support
- [x] Category-based filtering
- [x] Shopping cart with options
- [x] Wishlist functionality
- [x] Order management with notifications
- [x] Authentication with OTP
- [x] Product discount display
- [x] Latest products page
- [x] Dark/Light theme

### Phase 2 (In Progress 🚧)
- [ ] Backend API consistency improvements
- [ ] Enhanced search with filters
- [ ] Product comparison feature
- [ ] Store analytics dashboard
- [ ] Email notifications for orders
- [ ] SMS notifications

### Phase 3 (Planned 📋)
- [ ] Payment gateway integration (Stripe, PayPal)
- [ ] Vendor dashboard for store owners
- [ ] Advanced product reviews with images
- [ ] Live chat support
- [ ] Multi-language support (i18n)
- [ ] PWA capabilities
- [ ] Push notifications
- [ ] Social media integration
- [ ] Product recommendations AI
- [ ] Loyalty points system

## 🔒 API Authentication Flow

### 1. Guest Access (Client Credentials)
```javascript
// Automatic on app load
POST /oauth2/token
{
  grant_type: "client_credentials",
  client_id: "shopping_oauth_client",
  client_secret: "shopping_oauth_secret"
}
// Returns: { access_token, token_type, expires_in }
```

### 2. User Registration
```javascript
// Step 1: Register
POST /register
{ name, email, telephone, password, password_confirmation }

// Step 2: Verify OTP
POST /verify_otp
{ email, otp, telephone }
// Returns: { success, customer_id, token }
```

### 3. User Login
```javascript
POST /login
{ email, password }
// Returns: { success, token, customer_id, ... }
```

### 4. Authenticated Requests
```javascript
// All subsequent requests include:
headers: {
  'Authorization': 'Bearer {token}',
  'Content-Type': 'application/json'
}
```

## 🧪 Testing

### Frontend Testing
```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

### Manual Testing Checklist
- [ ] Light/Dark mode toggle works
- [ ] Category filtering on stores page
- [ ] Add to cart with product options
- [ ] Wishlist add/remove
- [ ] Checkout flow
- [ ] Order status updates
- [ ] Search functionality
- [ ] Authentication (signup, login, logout)
- [ ] Responsive design on mobile/tablet
- [ ] Product discount display

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Getting Started
1. Fork the repository
2. Clone your fork: `git clone https://github.com/chereo0/multi-storev2.git`
3. Create a feature branch: `git checkout -b feature/AmazingFeature`
4. Make your changes
5. Commit with clear messages: `git commit -m 'feat: add amazing feature'`
6. Push to your fork: `git push origin feature/AmazingFeature`
7. Open a Pull Request

### Commit Message Convention
```
feat: new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: adding tests
chore: maintenance tasks
```

### Coding Standards
- **React**: Use functional components with hooks
- **Styling**: Use Tailwind CSS utility classes
- **State**: Use Context API for global state
- **API**: Centralize all API calls in `services.js`
- **Naming**: Use camelCase for JS, PascalCase for components
- **Comments**: Add JSDoc comments for complex functions
- **Responsive**: Test on mobile, tablet, and desktop
- **Theme**: Ensure components work in both light and dark modes
- **Error Handling**: Always handle API errors gracefully

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors & Contributors

- **Development Team** - Multi-Store Platform
- **Repository**: [github.com/chereo0/multi-storev2](https://github.com/chereo0/multi-storev2)

## 🙏 Acknowledgments

- **React Team** - For the amazing framework
- **Tailwind CSS** - For utility-first CSS
- **Laravel Team** - For the robust backend framework
- **Three.js** - For 3D graphics capabilities
- **Heroicons & Lucide** - For beautiful icons
- **Community** - For feedback and contributions

## 📞 Support & Contact

### Bug Reports
- Open an issue on [GitHub Issues](https://github.com/chereo0/multi-storev2/issues)
- Include: OS, browser, steps to reproduce, expected vs actual behavior

### Feature Requests
- Open a feature request on GitHub
- Describe the feature and its benefits
- Include mockups if applicable

### Questions
- Check existing GitHub Issues first
- Open a discussion for general questions

## 📊 Project Stats

- **Frontend**: React 18.x
- **Backend**: Laravel (REST API)
- **Database**: MySQL
- **Deployment**: Production-ready
- **Status**: Active Development

## 🎯 Quick Links

- [Live Demo](https://multi-store-api.cloudgoup.com) (if available)
- [API Documentation](https://multi-store-api.cloudgoup.com/api/docs) (if available)
- [GitHub Repository](https://github.com/chereo0/multi-storev2)
- [Issue Tracker](https://github.com/chereo0/multi-storev2/issues)

## 💡 Tips & Best Practices

### For Developers
1. Always test in both light and dark modes
2. Use the provided Context APIs for state management
3. Follow the existing component structure
4. Handle API errors gracefully with toast notifications
5. Keep components small and focused
6. Use meaningful variable names
7. Add PropTypes or TypeScript types
8. Test responsive design at all breakpoints

### For Marketplace Users (Shoppers)
1. Add items to wishlist for later
2. Check order status regularly
3. Save multiple addresses for convenience
4. Enable notifications for order updates
5. Review products after purchase
6. Contact support if needed

---

**🏪 Built with ❤️ for the next generation of multi-store marketplaces**

*Empowering vendors, delighting customers, unifying commerce.*

*Version 2.0.0 - Multi-Store Platform - Last Updated: November 2025*
