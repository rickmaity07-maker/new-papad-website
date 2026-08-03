import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const getFirebaseConfig = () => {
  try {
    if (typeof __firebase_config !== 'undefined') {
      return JSON.parse(__firebase_config);
    }
  } catch (e) {
    console.warn("Could not parse dynamic config, falling back.");
  }
  return {
    apiKey: "demo-vercel-key",
    projectId: "demo-vercel-project",
    appId: "demo-vercel-app"
  };
};

const app = initializeApp(getFirebaseConfig());
const auth = getAuth(app);
const db = getFirestore(app);

const ShoppingBagIcon = ({ size = 22 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
);
const UserIcon = ({ size = 22 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const SearchIcon = ({ size = 22 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);
const TrashIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
);
const LogOutIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
);
const CloseIcon = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

const initialProducts = [
  { id: '1', name: 'Spicy Moong Papad', price: 6.49, description: 'Traditional spicy moong dal papad, roasted to perfection. A staple for every meal.', image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=600' },
  { id: '2', name: 'Urad Dal Papad', price: 5.99, description: 'Classic plain urad dal papad. Mild, crispy, and universally loved.', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&q=80&w=600' },
  { id: '3', name: 'Garlic Green Chilli Papad', price: 7.49, description: 'Extra spicy with a strong garlic kick. For those who prefer bold flavors.', image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&q=80&w=600' },
  { id: '4', name: 'Cumin Seed Papad', price: 6.99, description: 'Infused with roasted cumin seeds for a deeply aromatic crunch.', image: 'https://images.unsplash.com/photo-1589131652438-662580fb3738?auto=format&fit=crop&q=80&w=600' },
];

const getLocal = (key, initialValue) => {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  } catch (error) {
    return initialValue;
  }
};

export default function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home', 'shop', 'cart', 'checkout', 'account', 'admin', 'wholesale'
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [wholesaleStatus, setWholesaleStatus] = useState('idle'); // 'idle' or 'success'
  
  const [cart, setCart] = useState(() => getLocal('papad_cart', []));
  const [products, setProducts] = useState(() => getLocal('papad_products', initialProducts));
  const [orders, setOrders] = useState(() => getLocal('papad_orders', []));
  const [user, setUser] = useState(() => getLocal('papad_user', null));
  const [isAdmin, setIsAdmin] = useState(() => getLocal('papad_isAdmin', false));

  useEffect(() => { window.localStorage.setItem('papad_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { window.localStorage.setItem('papad_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { window.localStorage.setItem('papad_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { 
    window.localStorage.setItem('papad_user', JSON.stringify(user));
    window.localStorage.setItem('papad_isAdmin', JSON.stringify(isAdmin));
  }, [user, isAdmin]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleLogin = (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    if (email === 'admin@thepapadco.com' && password === 'admin') {
      setIsAdmin(true);
      setUser({ uid: 'admin-123', email });
      setCurrentView('admin');
    } else {
      setUser({ uid: 'user-' + Date.now(), email });
      setCurrentView('account');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setUser(null);
    setCurrentView('home');
  };

  const handleMockCheckout = () => {
    const newOrder = {
      id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
      date: new Date().toISOString().split('T')[0],
      total: cartTotal,
      status: 'Pending',
      items: cart,
      userEmail: user ? user.email : 'Guest'
    };
    setOrders([newOrder, ...orders]);
    setCart([]);
    setCurrentView('account');
  };

  const handleWholesaleSubmit = (e) => {
    e.preventDefault();
    setWholesaleStatus('success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#111111] font-sans flex flex-col selection:bg-[#111] selection:text-white">
      
      {/* Exact Match Header */}
      <nav className="w-full bg-[#FDFBF7] z-50 py-6 px-6 md:px-12 flex items-center justify-between">
        {/* Left: Logo */}
        <div 
          className="text-[1.35rem] font-black tracking-tighter cursor-pointer uppercase flex-1"
          onClick={() => setCurrentView('home')}
        >
          THE PAPAD CO.
        </div>
        
        {/* Center: Links */}
        <div className="hidden md:flex flex-1 justify-center gap-10">
          <button onClick={() => setCurrentView('shop')} className="text-xs font-bold tracking-[0.15em] uppercase hover:text-gray-500 transition-colors">Shop</button>
          <button onClick={() => { setCurrentView('wholesale'); setWholesaleStatus('idle'); }} className="text-xs font-bold tracking-[0.15em] uppercase hover:text-gray-500 transition-colors">Wholesale</button>
        </div>

        {/* Right: Icons */}
        <div className="flex items-center justify-end gap-6 flex-1">
          {isSearchOpen ? (
            <div className="flex items-center border-b border-[#111] pb-1 animate-in fade-in slide-in-from-right-4 duration-300">
              <input 
                autoFocus
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (currentView !== 'shop') setCurrentView('shop');
                }}
                className="bg-transparent border-none outline-none text-sm w-32 md:w-48 placeholder-gray-400"
              />
              <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="ml-2 text-gray-500 hover:text-black"><CloseIcon size={18} /></button>
            </div>
          ) : (
            <button onClick={() => setIsSearchOpen(true)} className="hover:text-gray-500 transition-colors"><SearchIcon /></button>
          )}
          
          <button onClick={() => setCurrentView('account')} className="hover:text-gray-500 transition-colors"><UserIcon /></button>
          
          <button onClick={() => setCurrentView('cart')} className="relative hover:text-gray-500 transition-colors">
            <ShoppingBagIcon />
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#111] text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                {cart.reduce((total, item) => total + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </nav>

      {}
      <main className="flex-grow flex flex-col">
        {currentView === 'home' && (
          <div className="flex-1 flex flex-col md:flex-row max-w-[1600px] mx-auto w-full pt-8 md:pt-16 pb-12 animate-in fade-in duration-700">
            {/* Left side text */}
            <div className="w-full md:w-[55%] px-6 md:px-12 lg:px-24 flex flex-col justify-center">
              <p className="text-[#8B5A2B] text-xs font-bold tracking-[0.25em] mb-8 uppercase">
                Small Batch &bull; Handmade
              </p>
              <h1 className="text-6xl sm:text-7xl lg:text-[7rem] font-black leading-[0.95] tracking-tight mb-8">
                Authentic.<br/>
                Handmade.<br/>
                Crisp.
              </h1>
              <p className="text-gray-600 text-lg md:text-xl max-w-md mb-12 leading-relaxed">
                We've reimagined the classic Indian papad. Minimal ingredients, perfect texture, delivered fresh to your door.
              </p>
              <div>
                <button 
                  onClick={() => setCurrentView('shop')}
                  className="bg-[#111111] text-white text-xs font-bold tracking-[0.15em] uppercase px-10 py-5 hover:bg-[#333] transition-colors"
                >
                  Shop the collection
                </button>
              </div>
            </div>

            {/* Right side artwork (Black and white framed palm tree) */}
            <div className="w-full md:w-[45%] flex items-center justify-center p-8 md:p-12 mt-12 md:mt-0">
              {/* Wood Frame */}
              <div className="bg-[#D1BFAe] p-3 shadow-2xl w-full max-w-md aspect-[3/4] relative transform rotate-[-1deg] transition-transform hover:rotate-0 duration-500 ease-out">
                {/* White Matting */}
                <div className="bg-white p-8 md:p-12 h-full w-full shadow-inner relative">
                   {/* Artwork (B&W Palms) */}
                   <img 
                    src="https://images.unsplash.com/photo-1506057213367-028a17ec55e6?auto=format&fit=crop&q=80&w=800" 
                    alt="Tropical Artwork" 
                    className="w-full h-full object-cover grayscale contrast-125 border border-gray-100"
                   />
                </div>
              </div>
            </div>
          </div>
        )}

        {}
        {currentView === 'shop' && (
          <div className="max-w-[1400px] mx-auto w-full px-6 md:px-12 py-12 animate-in fade-in duration-500">
            <h2 className="text-3xl font-black uppercase tracking-tight mb-12">The Collection</h2>
            
            {filteredProducts.length === 0 ? (
              <div className="text-center py-24 text-gray-400">
                <p className="text-xl">No products found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
                {filteredProducts.map(product => (
                  <div key={product.id} className="group flex flex-col">
                    <div className="bg-[#f4f4f4] aspect-[4/5] mb-6 overflow-hidden relative">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                      <button 
                        onClick={() => addToCart(product)}
                        className="absolute bottom-0 left-0 w-full bg-white/90 backdrop-blur-sm py-4 text-center text-xs font-bold uppercase tracking-widest translate-y-full group-hover:translate-y-0 transition-transform duration-300 hover:bg-[#111] hover:text-white"
                      >
                        Add to Bag
                      </button>
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg mb-1">{product.name}</h3>
                        <p className="text-gray-500 text-sm line-clamp-2 pr-4">{product.description}</p>
                      </div>
                      <span className="font-medium">${product.price.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {}
        {currentView === 'cart' && (
          <div className="max-w-4xl mx-auto w-full px-6 md:px-12 py-12 animate-in fade-in duration-300">
            <h1 className="text-4xl font-black uppercase tracking-tight mb-12">Your Bag</h1>
            
            {cart.length === 0 ? (
              <div className="py-24 border-t border-gray-200">
                <p className="text-gray-500 mb-8">Your bag is currently empty.</p>
                <button 
                  onClick={() => setCurrentView('shop')}
                  className="bg-[#111] text-white px-8 py-4 text-xs font-bold tracking-widest uppercase hover:bg-gray-800 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-12">
                <div className="flex-1 w-full">
                  <ul className="border-t border-gray-200">
                    {cart.map(item => (
                      <li key={item.id} className="py-8 flex gap-6 border-b border-gray-200">
                        <img src={item.image} alt={item.name} className="h-32 w-24 object-cover bg-gray-100" />
                        <div className="flex-1 flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-lg">{item.name}</h4>
                              <p className="text-gray-500 text-sm mt-1">Qty: {item.quantity}</p>
                            </div>
                            <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-red-500 text-left w-fit transition-colors flex items-center gap-2 mt-4">
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="w-full lg:w-[350px] bg-[#f9f9f9] p-8 h-fit">
                  <h3 className="font-bold uppercase tracking-wider mb-6 pb-4 border-b border-gray-200">Order Summary</h3>
                  <div className="flex justify-between mb-4 text-gray-600">
                    <span>Subtotal</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-8 text-gray-600">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between mb-8 font-black text-xl border-t border-gray-200 pt-4">
                    <span>Total</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={() => setCurrentView('checkout')}
                    className="w-full bg-[#111] text-white py-4 text-xs font-bold tracking-widest uppercase hover:bg-gray-800 transition-colors"
                  >
                    Checkout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {}
        {currentView === 'checkout' && (
          <div className="max-w-xl mx-auto w-full px-6 py-12 animate-in fade-in duration-300">
            <h1 className="text-3xl font-black uppercase tracking-tight mb-8">Secure Checkout</h1>
            
            <div className="bg-white p-8 border border-gray-200 mb-8 shadow-sm">
              <h3 className="font-bold uppercase tracking-wider mb-6 border-b border-gray-100 pb-2">Order Review</h3>
              {cart.map(item => (
                <div key={item.id} className="flex justify-between text-sm mb-3">
                  <span className="text-gray-600">{item.quantity}x {item.name}</span>
                  <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between font-black text-lg mt-6 pt-4 border-t border-gray-200">
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={handleMockCheckout}
              className="w-full bg-[#111] text-white py-4 text-xs font-bold tracking-widest uppercase hover:bg-black transition-colors"
            >
              Confirm Order
            </button>
            <button 
              onClick={() => setCurrentView('cart')}
              className="w-full mt-4 py-4 text-xs font-bold tracking-widest uppercase text-gray-500 hover:text-[#111] transition-colors rounded-none"
            >
              Return to Bag
            </button>
          </div>
        )}

        {currentView === 'wholesale' && (
          <div className="max-w-4xl mx-auto w-full px-6 md:px-12 py-16 animate-in fade-in duration-500">
            <div className="text-center mb-16">
              <p className="text-[#8B5A2B] text-xs font-bold tracking-[0.25em] mb-4 uppercase">Partner With Us</p>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-6">Wholesale Inquiries</h1>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
                Bring the authentic taste of The Papad Co. to your restaurant, grocery store, or distribution network. Fill out the application below and our B2B team will get back to you within 1-2 business days.
              </p>
            </div>

            {wholesaleStatus === 'success' ? (
              <div className="bg-white border border-gray-200 p-12 text-center shadow-sm">
                <h2 className="text-2xl font-black uppercase tracking-tight mb-4">Application Received</h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Thank you for your interest in partnering with us. We have successfully received your details and will be in touch shortly.
                </p>
                <button 
                  onClick={() => setCurrentView('home')}
                  className="bg-[#111] text-white px-10 py-4 text-xs font-bold tracking-widest uppercase hover:bg-[#333] transition-colors rounded-none"
                >
                  Return to Home
                </button>
              </div>
            ) : (
              <form onSubmit={handleWholesaleSubmit} className="space-y-8 bg-white p-8 md:p-12 border border-gray-200 shadow-sm">
                <h3 className="font-bold uppercase tracking-wider mb-6 pb-4 border-b border-gray-200">Business Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-gray-700">Company Name *</label>
                    <input type="text" required className="w-full px-4 py-3 border border-gray-300 bg-transparent focus:border-[#111] focus:ring-0 outline-none transition-colors rounded-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-gray-700">Contact Name *</label>
                    <input type="text" required className="w-full px-4 py-3 border border-gray-300 bg-transparent focus:border-[#111] focus:ring-0 outline-none transition-colors rounded-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-gray-700">Email Address *</label>
                    <input type="email" required className="w-full px-4 py-3 border border-gray-300 bg-transparent focus:border-[#111] focus:ring-0 outline-none transition-colors rounded-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-gray-700">Phone Number *</label>
                    <input type="tel" required className="w-full px-4 py-3 border border-gray-300 bg-transparent focus:border-[#111] focus:ring-0 outline-none transition-colors rounded-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                   <div>
                    <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-gray-700">Business Type *</label>
                    <select required className="w-full px-4 py-3 border border-gray-300 bg-transparent focus:border-[#111] focus:ring-0 outline-none transition-colors rounded-none">
                      <option value="">Select a type...</option>
                      <option value="restaurant">Restaurant / Cafe</option>
                      <option value="grocery">Grocery / Retail</option>
                      <option value="distributor">Distributor</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-gray-700">Tax ID / EIN / Resale # *</label>
                    <input type="text" required className="w-full px-4 py-3 border border-gray-300 bg-transparent focus:border-[#111] focus:ring-0 outline-none transition-colors rounded-none" />
                  </div>
                </div>

                <div className="pt-4">
                  <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-gray-700">Estimated Monthly Volume</label>
                  <select className="w-full px-4 py-3 border border-gray-300 bg-transparent focus:border-[#111] focus:ring-0 outline-none transition-colors rounded-none">
                    <option value="">Select volume...</option>
                    <option value="under_500">$0 - $500</option>
                    <option value="500_2000">$500 - $2,000</option>
                    <option value="2000_plus">$2,000+</option>
                  </select>
                </div>

                <div className="pt-4">
                  <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-gray-700">Additional Information / Questions</label>
                  <textarea rows="4" className="w-full px-4 py-3 border border-gray-300 bg-transparent focus:border-[#111] focus:ring-0 outline-none transition-colors resize-none rounded-none" placeholder="Tell us about your specific needs..."></textarea>
                </div>

                <div className="pt-6">
                  <button type="submit" className="w-full bg-[#111] text-white py-5 text-xs font-bold tracking-widest uppercase hover:bg-[#333] transition-colors rounded-none">
                    Submit Application
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {}
        {currentView === 'account' && (
          <div className="max-w-2xl mx-auto w-full px-6 py-12 animate-in fade-in duration-300">
            {!user ? (
              <div className="max-w-md mx-auto">
                <h1 className="text-3xl font-black uppercase tracking-tight mb-8 text-center">Login</h1>
                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <input type="email" name="email" required placeholder="Email Address" className="w-full px-4 py-3 border border-gray-300 bg-transparent focus:border-[#111] focus:ring-0 outline-none transition-colors" defaultValue="user@example.com" />
                  </div>
                  <div>
                    <input type="password" name="password" required placeholder="Password" className="w-full px-4 py-3 border border-gray-300 bg-transparent focus:border-[#111] focus:ring-0 outline-none transition-colors" defaultValue="password123" />
                  </div>
                  <button type="submit" className="w-full bg-[#111] text-white py-4 text-xs font-bold tracking-widest uppercase hover:bg-gray-800 transition-colors">
                    Sign In
                  </button>
                  <p className="text-center text-xs text-gray-500 mt-6 uppercase tracking-wider">
                    Admin Access: admin@thepapadco.com / admin
                  </p>
                </form>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-end border-b border-gray-200 pb-6 mb-10">
                  <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight">My Account</h1>
                    <p className="text-gray-500 mt-2">{user.email}</p>
                  </div>
                  <button onClick={handleLogout} className="text-xs font-bold uppercase tracking-widest hover:text-red-600 transition-colors">
                    Logout
                  </button>
                </div>

                {isAdmin && (
                  <button 
                    onClick={() => setCurrentView('admin')}
                    className="w-full mb-12 border border-[#111] text-[#111] py-4 text-xs font-bold tracking-widest uppercase hover:bg-[#111] hover:text-white transition-colors"
                  >
                    Go to Admin Dashboard
                  </button>
                )}

                <h3 className="text-lg font-bold uppercase tracking-wider mb-6">Order History</h3>
                {orders.filter(o => isAdmin || o.userEmail === user.email).length === 0 ? (
                  <p className="text-gray-500 py-8 border-t border-gray-200">You haven't placed any orders yet.</p>
                ) : (
                  <div className="space-y-6">
                    {orders.filter(o => isAdmin || o.userEmail === user.email).map(order => (
                      <div key={order.id} className="bg-white border border-gray-200 p-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                          <p className="font-bold">{order.id}</p>
                          <p className="text-sm text-gray-500 mt-1">{order.date} • {order.items.length} items</p>
                        </div>
                        <div className="text-left md:text-right">
                          <p className="font-bold">${order.total.toFixed(2)}</p>
                          <span className="inline-block px-2 py-1 bg-gray-100 text-xs font-bold uppercase tracking-wider mt-2">
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {}
        {currentView === 'admin' && isAdmin && (
          <div className="max-w-[1400px] mx-auto w-full px-6 md:px-12 py-12 animate-in fade-in duration-300">
            <div className="flex justify-between items-end mb-12 border-b border-gray-200 pb-6">
              <h1 className="text-3xl font-black uppercase tracking-tight">Admin Portal</h1>
              <button onClick={() => setCurrentView('shop')} className="text-xs font-bold uppercase tracking-widest hover:text-gray-500 transition-colors">
                Back to Shop
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold uppercase tracking-wider">Catalog</h2>
                  <button className="text-xs font-bold uppercase tracking-widest text-[#8B5A2B] hover:text-black">
                    + Add Product
                  </button>
                </div>
                <div className="border border-gray-200 bg-white divide-y divide-gray-200">
                  {products.map(product => (
                    <div key={product.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img src={product.image} className="w-12 h-16 object-cover bg-gray-100" alt={product.name} />
                        <div>
                          <p className="font-bold">{product.name}</p>
                          <p className="text-gray-500 text-sm">${product.price.toFixed(2)}</p>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-red-500 p-2"><TrashIcon /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold uppercase tracking-wider mb-6">Recent Orders</h2>
                <div className="border border-gray-200 bg-white">
                  {orders.length === 0 ? (
                    <p className="p-8 text-gray-500 text-center">No orders yet.</p>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {orders.map(order => (
                        <div key={order.id} className="p-6">
                          <div className="flex justify-between mb-2">
                            <span className="font-bold">{order.id}</span>
                            <span className="font-bold">${order.total.toFixed(2)}</span>
                          </div>
                          <div className="text-sm text-gray-500 mb-3">{order.userEmail}</div>
                          <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-400">{order.date}</span>
                              <span className="bg-gray-100 px-2 py-1 text-xs font-bold uppercase tracking-wider">{order.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

    </div>
  );
}