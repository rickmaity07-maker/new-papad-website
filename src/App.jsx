import React, { useState } from 'react';

// --- DATA ---
const PRODUCTS = [
  {
    id: 1,
    name: 'Roasted Moong Dal Papad',
    price: 4.99,
    image: 'https://restaurantindia.s3.ap-south-1.amazonaws.com/s3fs-public/2025-06/Mastering%20the%20Art%20of%20Roasting%20Techniques%20Every%20Restaurant%20Chef%20Should%20Know.jpg',
    description: 'Classic, crisp, and perfectly seasoned with black pepper.'
  },
  {
    id: 2,
    name: 'Spicy Garlic Papad',
    price: 5.49,
    image: 'https://restaurantindia.s3.ap-south-1.amazonaws.com/s3fs-public/2025-10/What%20is%20Kimchi%20Top%20Veg%20Kimchi%20You%20Can%20Try%20at%20Home.jpg',
    description: 'Infused with fiery red chilies and roasted garlic.'
  },
  {
    id: 3,
    name: 'Classic Urad Dal',
    price: 4.49,
    image: 'https://cpimg.tistatic.com/08847598/b/4/CORN-FLOUR-PAPAD.jpg',
    description: 'The traditional plain urad dal base, perfect for frying or roasting.'
  }
];

// --- ICONS ---
const ShoppingBag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
);
const User = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const Menu = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
);
const Package = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><path d="M9 4v16"/><path d="M4 9h16"/><path d="M4 15h16"/></svg>
);
const Search = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);
const X = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);
const Trash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);

// --- MAIN APP COMPONENT ---
export default function App() {
  const [currentRoute, setCurrentRoute] = useState('home');
  const [cart, setCart] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const addToCart = (product) => {
    setCart([...cart, product]);
    showToast(`${product.name} added to cart!`);
    setIsCartOpen(true); // Auto-open cart when adding an item
  };

  const removeFromCart = (indexToRemove) => {
    setCart(cart.filter((_, index) => index !== indexToRemove));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setIsCartOpen(false);
    setCart([]); // Empty the cart
    showToast("Processing Stripe Payment... Order Placed Successfully!");
  };

  const navigate = (route) => {
    setCurrentRoute(route);
    setIsMenuOpen(false);
  };

  const handleLogin = (adminStatus = false) => {
    setIsLoggedIn(true);
    setIsAdmin(adminStatus);
    navigate(adminStatus ? 'admin' : 'home');
    showToast(`Successfully logged in as ${adminStatus ? 'Admin' : 'User'}`);
  };

  // Calculate cart total
  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0).toFixed(2);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#1c1c1c] font-sans selection:bg-[#8c5625] selection:text-white flex flex-col relative overflow-x-hidden">
      
      {/* GLOBAL TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[150] bg-black text-white px-6 py-3 rounded-sm shadow-xl font-medium text-sm transition-all duration-300 whitespace-nowrap">
          {toastMessage}
        </div>
      )}

      {/* SLIDE-OUT CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Dark Overlay - Clicking it closes the cart */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsCartOpen(false)} 
          />
          
          {/* Cart Panel */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300">
            {/* Cart Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#ebebeb]">
              <h2 className="text-xl font-bold tracking-tighter">Your Bag ({cart.length})</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-500 hover:text-black transition-colors">
                <X />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Your bag is empty.</p>
                  <button onClick={() => { setIsCartOpen(false); navigate('shop'); }} className="mt-4 text-[#8c5625] font-bold border-b border-[#8c5625] pb-1">
                    Continue Shopping
                  </button>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div key={index} className="flex space-x-4">
                    <img src={item.image} alt={item.name} className="w-20 h-24 object-cover bg-gray-100 rounded-sm" />
                    <div className="flex-grow flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-sm">{item.name}</h4>
                        <p className="text-gray-500 text-xs mt-1 font-mono">${item.price.toFixed(2)}</p>
                      </div>
                      <button 
                        onClick={() => removeFromCart(index)}
                        className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center space-x-1 w-fit transition-colors"
                      >
                        <Trash /> <span>REMOVE</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer / Checkout */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-[#ebebeb] bg-gray-50">
                <div className="flex justify-between items-center mb-6">
                  <span className="font-medium text-gray-500">Subtotal</span>
                  <span className="font-bold text-lg font-mono">${cartTotal}</span>
                </div>
                <button 
                  onClick={handleCheckout}
                  className="w-full bg-[#1c1c1c] text-white py-4 font-bold tracking-wide hover:bg-[#8c5625] transition-colors rounded-sm"
                >
                  SECURE CHECKOUT
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NAVIGATION BAR */}
      <nav className="sticky top-0 z-50 bg-[#faf8f5]/90 backdrop-blur-md border-b border-[#ebebeb]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 -ml-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <Menu />
          </button>

          {/* Logo */}
          <div 
            className="text-2xl font-bold tracking-tighter cursor-pointer"
            onClick={() => navigate('home')}
          >
            THE PAPAD CO.
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex space-x-10 text-sm font-medium tracking-wide">
            <button onClick={() => navigate('shop')} className={`transition-colors ${currentRoute === 'shop' ? 'text-[#8c5625]' : 'hover:text-[#8c5625]'}`}>SHOP</button>
            <button onClick={() => navigate('bulk')} className={`transition-colors ${currentRoute === 'bulk' ? 'text-[#8c5625]' : 'hover:text-[#8c5625]'}`}>WHOLESALE</button>
            {isAdmin && (
              <button onClick={() => navigate('admin')} className={`transition-colors ${currentRoute === 'admin' ? 'text-[#8c5625]' : 'text-[#8c5625] hover:text-black'}`}>ADMIN</button>
            )}
          </div>

          {/* Right Icons */}
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => showToast('Search functionality will be connected to Database soon.')}
              className="hidden md:block hover:text-[#8c5625] transition-colors"
            >
              <Search />
            </button>
            <button 
              onClick={() => isLoggedIn ? navigate('admin') : navigate('login')} 
              className={`transition-colors ${currentRoute === 'login' || currentRoute === 'admin' ? 'text-[#8c5625]' : 'hover:text-[#8c5625]'}`}
            >
              <User />
            </button>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative hover:text-[#8c5625] transition-colors"
            >
              <ShoppingBag />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#1c1c1c] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-[#faf8f5] border-b border-[#ebebeb] px-6 py-4 flex flex-col space-y-4 shadow-lg absolute w-full z-40">
            <button onClick={() => navigate('shop')} className="text-left text-lg font-medium py-2 border-b border-gray-100">Shop</button>
            <button onClick={() => navigate('bulk')} className="text-left text-lg font-medium py-2 border-b border-gray-100">Wholesale</button>
            <button onClick={() => isLoggedIn ? navigate('admin') : navigate('login')} className="text-left text-lg font-medium py-2">Account</button>
          </div>
        )}
      </nav>

      {/* PAGE CONTENT ROUTER */}
      <main className="flex-grow">
        {currentRoute === 'home' && <HomeView navigate={navigate} />}
        {currentRoute === 'shop' && <ShopView addToCart={addToCart} />}
        {currentRoute === 'bulk' && <BulkView showToast={showToast} />}
        {currentRoute === 'login' && <LoginView handleLogin={handleLogin} />}
        {currentRoute === 'admin' && <AdminView showToast={showToast} />}
      </main>

      {/* FOOTER */}
      <footer className="bg-[#1c1c1c] text-white py-16 px-6 mt-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="text-xl font-bold tracking-tighter mb-4">THE PAPAD CO.</h3>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              Authentic, handmade Indian snacks crafted with minimal ingredients and maximum flavor. Built for the modern pantry.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Navigation</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><button onClick={() => navigate('shop')} className="hover:text-white transition-colors">Shop All</button></li>
              <li><button onClick={() => navigate('bulk')} className="hover:text-white transition-colors">Wholesale / B2B</button></li>
              <li><button onClick={() => showToast('Our Story page coming soon!')} className="hover:text-white transition-colors">Our Story</button></li>
              <li><button onClick={() => showToast('Contact page coming soon!')} className="hover:text-white transition-colors">Contact</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Newsletter</h4>
            <div className="flex border-b border-gray-600 pb-2">
              <input type="email" placeholder="Email Address" className="bg-transparent border-none outline-none text-sm w-full focus:ring-0" />
              <button 
                onClick={() => showToast('Thanks for subscribing!')}
                className="text-sm font-bold hover:text-gray-300 transition-colors"
              >
                SUBSCRIBE
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- VIEWS / PAGES ---

function HomeView({ navigate }) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[85vh]">
        <div className="flex flex-col justify-center px-8 lg:px-24 py-16 lg:py-0 order-2 lg:order-1 bg-white">
          <p className="text-[#8c5625] font-mono text-sm mb-6 uppercase tracking-widest">Small Batch • Handmade</p>
          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tighter leading-[0.9] mb-8">
            Authentic.<br />
            Handmade.<br />
            Crisp.
          </h1>
          <p className="text-lg text-gray-600 mb-10 max-w-md leading-relaxed">
            We've reimagined the classic Indian papad. Minimal ingredients, perfect texture, delivered fresh to your door.
          </p>
          <div>
            <button 
              onClick={() => navigate('shop')}
              className="bg-[#1c1c1c] text-white px-8 py-4 text-sm font-bold tracking-wide hover:bg-[#8c5625] transition-colors duration-300 w-full sm:w-auto"
            >
              SHOP THE COLLECTION
            </button>
          </div>
        </div>
        <div className="order-1 lg:order-2 bg-gray-200">
          <img 
            src="https://www.jonwrightphoto.com/cdn/shop/files/Palm-Print-Oak-Float-Frame-Canvas.jpg?v=1784264313&width=1500" 
            alt="Minimalist Papad Display" 
            className="w-full h-full object-cover min-h-[50vh] lg:min-h-full"
          />
        </div>
      </div>
    </div>
  );
}

function ShopView({ addToCart }) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 animate-fade-in">
      <div className="mb-12 md:mb-16">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">The Collection</h2>
        <p className="text-gray-500 font-mono text-sm">Showing {PRODUCTS.length} products</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 md:gap-y-16">
        {PRODUCTS.map(product => (
          <div key={product.id} className="group flex flex-col">
            <div className="w-full aspect-[4/5] bg-gray-100 overflow-hidden mb-6 relative rounded-sm cursor-pointer">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <button 
                  onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                  className="bg-white text-black px-6 py-3 font-bold text-sm tracking-wide transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-black hover:text-white"
                >
                  QUICK ADD
                </button>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">{product.name}</h3>
            <p className="text-gray-500 text-sm mb-4 flex-grow">{product.description}</p>
            <div className="flex items-center justify-between">
              <p className="font-mono font-bold text-lg">${product.price.toFixed(2)}</p>
              <button 
                onClick={() => addToCart(product)}
                className="lg:hidden text-sm font-bold border-b-2 border-black pb-1"
              >
                + ADD
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BulkView({ showToast }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    showToast("Inquiry submitted successfully! Our team will contact you shortly.");
    e.target.reset();
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 animate-fade-in">
      <div className="text-center mb-12 md:mb-16">
        <Package className="w-12 h-12 mx-auto mb-6 text-[#8c5625]" />
        <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">Wholesale Inquiry</h2>
        <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          Stock The Papad Co. in your restaurant or retail store. Fill out the form below and our B2B team will contact you to verify your account and provide custom pricing.
        </p>
      </div>

      <div className="bg-white p-6 md:p-12 border border-[#ebebeb] shadow-sm rounded-sm">
        <form className="space-y-8" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="relative">
              <input type="text" id="company" className="peer w-full border-b border-gray-300 bg-transparent py-2 pt-6 focus:outline-none focus:border-black transition-colors" placeholder=" " required />
              <label htmlFor="company" className="absolute left-0 top-2 text-xs text-gray-500 font-mono uppercase tracking-wide peer-focus:text-black transition-colors">Company Name</label>
            </div>
            <div className="relative">
              <input type="email" id="email" className="peer w-full border-b border-gray-300 bg-transparent py-2 pt-6 focus:outline-none focus:border-black transition-colors" placeholder=" " required />
              <label htmlFor="email" className="absolute left-0 top-2 text-xs text-gray-500 font-mono uppercase tracking-wide peer-focus:text-black transition-colors">Contact Email</label>
            </div>
          </div>

          <div className="relative">
            <input type="number" id="volume" className="peer w-full border-b border-gray-300 bg-transparent py-2 pt-6 focus:outline-none focus:border-black transition-colors" placeholder=" " required min="1" />
            <label htmlFor="volume" className="absolute left-0 top-2 text-xs text-gray-500 font-mono uppercase tracking-wide peer-focus:text-black transition-colors">Expected Monthly Volume (in KGs)</label>
          </div>

          <div className="relative">
            <textarea id="details" rows="4" className="peer w-full border border-gray-300 bg-transparent p-4 pt-8 focus:outline-none focus:border-black transition-colors resize-none mt-4 rounded-sm" placeholder=" "></textarea>
            <label htmlFor="details" className="absolute left-4 top-6 text-xs text-gray-500 font-mono uppercase tracking-wide peer-focus:text-black transition-colors">Additional Details / Blend Requests</label>
          </div>

          <button type="submit" className="w-full bg-[#1c1c1c] text-white py-4 font-bold tracking-wide hover:bg-[#8c5625] transition-colors rounded-sm">
            SUBMIT INQUIRY
          </button>
        </form>
      </div>
    </div>
  );
}

function LoginView({ handleLogin }) {
  return (
    <div className="max-w-md mx-auto px-6 py-20 md:py-32 animate-fade-in">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-4">Welcome Back</h2>
        <p className="text-gray-500 text-sm">Sign in to access your orders and wishlists.</p>
      </div>

      <div className="space-y-4 mb-8">
        <button 
          onClick={() => handleLogin(false)}
          className="w-full flex items-center justify-center space-x-3 border border-gray-300 bg-white py-3 hover:bg-gray-50 transition-colors rounded-sm shadow-sm"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
          <span className="font-medium text-sm">Continue with Google</span>
        </button>
        <button 
          onClick={() => handleLogin(false)}
          className="w-full flex items-center justify-center space-x-3 border border-gray-300 bg-white py-3 hover:bg-gray-50 transition-colors rounded-sm shadow-sm"
        >
          <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          <span className="font-medium text-sm">Continue with Facebook</span>
        </button>
      </div>

      <div className="relative flex items-center justify-center mb-8">
        <div className="border-t border-gray-300 w-full absolute"></div>
        <span className="bg-[#faf8f5] px-4 text-xs text-gray-500 font-mono relative z-10 uppercase">Or Admin Login</span>
      </div>

      <button 
        onClick={() => handleLogin(true)}
        className="w-full bg-[#1c1c1c] text-white py-3 font-bold text-sm tracking-wide hover:bg-[#8c5625] transition-colors rounded-sm"
      >
        LOGIN AS ADMIN
      </button>
    </div>
  );
}

function AdminView({ showToast }) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 md:mb-12 border-b border-gray-200 pb-6 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tighter mb-2">Admin Dashboard</h2>
          <p className="text-gray-500 font-mono text-xs uppercase">Supabase Role: Authenticated Admin</p>
        </div>
        <button 
          onClick={() => showToast('Database insert form will open here.')}
          className="bg-[#1c1c1c] text-white px-6 py-3 text-sm font-bold hover:bg-[#8c5625] transition-colors rounded-sm w-full sm:w-auto"
        >
          + ADD NEW PRODUCT
        </button>
      </div>

      <div className="bg-white border border-[#ebebeb] shadow-sm rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 border-b border-[#ebebeb] text-xs font-mono uppercase text-gray-500">
                <th className="p-4 font-medium">Product Name</th>
                <th className="p-4 font-medium">SKU / ID</th>
                <th className="p-4 font-medium">Price</th>
                <th className="p-4 font-medium">Stock (KG)</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {PRODUCTS.map((product, idx) => (
                <tr key={product.id} className="border-b border-[#ebebeb] hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-bold flex items-center space-x-3">
                    <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded-sm border border-gray-200" />
                    <span>{product.name}</span>
                  </td>
                  <td className="p-4 text-gray-500 font-mono">PPD-00{product.id}</td>
                  <td className="p-4">${product.price.toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-sm text-xs font-bold ${idx === 2 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {idx === 2 ? '12 Low' : '450 In Stock'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => showToast(`Opening edit window for ${product.name}`)}
                      className="text-[#8c5625] hover:text-black font-medium text-sm mr-4 transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => showToast(`Executing Database DELETE on PPD-00${product.id}`)}
                      className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}