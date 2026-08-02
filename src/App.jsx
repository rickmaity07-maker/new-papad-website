import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, addDoc, updateDoc, deleteDoc, onSnapshot, collection } from 'firebase/firestore';

// --- FIREBASE INITIALIZATION ---
// This safely connects the app to the backend storage environment.
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

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
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);
const X = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);
const Trash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);
const Edit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
);

// --- MAIN APP COMPONENT ---
export default function App() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  
  // Navigation & UI States
  const [currentRoute, setCurrentRoute] = useState('home');
  const [cart, setCart] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // User Authentication States (Simulated UI layer on top of anonymous backend auth)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Live Database States
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // 1. Initialize Backend Authentication
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, setFirebaseUser);
    return () => unsubscribe();
  }, []);

  // 2. Setup Live Database Listeners
  useEffect(() => {
    if (!firebaseUser) return;

    // References to public data collections
    const productsRef = collection(db, 'artifacts', appId, 'public', 'data', 'products');
    const ordersRef = collection(db, 'artifacts', appId, 'public', 'data', 'orders');

    // Seed function for new environments
    const seedInitialProducts = async () => {
      const mockData = [
        { name: "Classic Urad Papad", description: "The original black gram papad with a hint of black pepper.", price: 5.99, image: "https://images.unsplash.com/photo-1596450514735-3108c4e421a1?q=80&w=600&auto=format&fit=crop", stock: 450 },
        { name: "Spicy Moong Papad", description: "A fiery blend of moong dal and red chilies for the bold.", price: 6.49, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=600&auto=format&fit=crop", stock: 320 },
        { name: "Garlic & Herb", description: "A modern twist with roasted garlic and mixed Indian herbs.", price: 7.99, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=600&auto=format&fit=crop", stock: 12 }
      ];
      try {
        for (const p of mockData) {
          await addDoc(productsRef, p);
        }
      } catch (e) {
        console.error("Error seeding products:", e);
      }
    };

    // Listen for live Product updates
    const unsubProducts = onSnapshot(productsRef, (snapshot) => {
      if (snapshot.empty) {
        // If database is completely empty, inject initial data
        seedInitialProducts();
      } else {
        const fetchedProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort by name in memory
        fetchedProducts.sort((a, b) => a.name.localeCompare(b.name));
        setProducts(fetchedProducts);
      }
      setIsLoadingProducts(false);
    }, (error) => {
      console.error("Firestore products error:", error);
      setIsLoadingProducts(false);
    });

    // Listen for live Order updates
    const unsubOrders = onSnapshot(ordersRef, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort newest first
      fetchedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(fetchedOrders);
    }, (error) => {
      console.error("Firestore orders error:", error);
    });

    return () => {
      unsubProducts();
      unsubOrders();
    };
  }, [firebaseUser]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const addToCart = (product) => {
    if (product.stock <= 0) {
      showToast(`${product.name} is out of stock!`);
      return;
    }
    setCart([...cart, product]);
    showToast(`${product.name} added to cart!`);
    setIsCartOpen(true);
  };

  const removeFromCart = (indexToRemove) => {
    setCart(cart.filter((_, index) => index !== indexToRemove));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setIsCartOpen(false);
    navigate('checkout');
  };

  const navigate = (route) => {
    setCurrentRoute(route);
    setIsMenuOpen(false);
  };

  const handleLogin = (e, email) => {
    e.preventDefault();
    const isAdminUser = email.toLowerCase() === 'admin@thepapadco.com';
    setIsLoggedIn(true);
    setIsAdmin(isAdminUser);
    setCurrentUser({ email, name: email.split('@')[0], uid: firebaseUser?.uid || 'anon' });
    navigate(isAdminUser ? 'admin' : 'account');
    showToast(`Successfully logged in as ${isAdminUser ? 'Admin' : 'User'}`);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setCurrentUser(null);
    navigate('home');
    showToast("Successfully logged out.");
  };

  const cartTotal = cart.reduce((sum, item) => sum + Number(item.price), 0).toFixed(2);

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
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300">
            <div className="flex items-center justify-between p-6 border-b border-[#ebebeb]">
              <h2 className="text-xl font-bold tracking-tighter">Your Bag ({cart.length})</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-500 hover:text-black transition-colors"><X /></button>
            </div>
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Your bag is empty.</p>
                  <button onClick={() => { setIsCartOpen(false); navigate('shop'); }} className="mt-4 text-[#8c5625] font-bold border-b border-[#8c5625] pb-1">Continue Shopping</button>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div key={index} className="flex space-x-4">
                    <img src={item.image} alt={item.name} className="w-20 h-24 object-cover bg-gray-100 rounded-sm" />
                    <div className="flex-grow flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-sm">{item.name}</h4>
                        <p className="text-gray-500 text-xs mt-1 font-mono">${Number(item.price).toFixed(2)}</p>
                      </div>
                      <button onClick={() => removeFromCart(index)} className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center space-x-1 w-fit transition-colors">
                        <Trash /> <span>REMOVE</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-6 border-t border-[#ebebeb] bg-gray-50">
                <div className="flex justify-between items-center mb-6">
                  <span className="font-medium text-gray-500">Subtotal</span>
                  <span className="font-bold text-lg font-mono">${cartTotal}</span>
                </div>
                <button onClick={handleCheckout} className="w-full bg-[#1c1c1c] text-white py-4 font-bold tracking-wide hover:bg-[#8c5625] transition-colors rounded-sm">
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
          <button className="md:hidden p-2 -ml-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <Menu />
          </button>

          <div className="text-2xl font-bold tracking-tighter cursor-pointer" onClick={() => navigate('home')}>
            THE PAPAD CO.
          </div>

          <div className="hidden md:flex space-x-10 text-sm font-medium tracking-wide">
            <button onClick={() => navigate('shop')} className={`transition-colors ${currentRoute === 'shop' ? 'text-[#8c5625]' : 'hover:text-[#8c5625]'}`}>SHOP</button>
            <button onClick={() => navigate('bulk')} className={`transition-colors ${currentRoute === 'bulk' ? 'text-[#8c5625]' : 'hover:text-[#8c5625]'}`}>WHOLESALE</button>
            {isAdmin && (
              <button onClick={() => navigate('admin')} className={`transition-colors ${currentRoute === 'admin' ? 'text-[#8c5625]' : 'text-[#8c5625] hover:text-black'}`}>ADMIN</button>
            )}
          </div>

          <div className="flex items-center space-x-6">
            <div className="relative hidden md:flex items-center">
              {isSearchOpen && (
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Search papads..." 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (currentRoute !== 'shop') navigate('shop');
                  }}
                  className="absolute right-8 w-48 border-b border-black bg-transparent px-2 py-1 text-sm focus:outline-none transition-all"
                />
              )}
              <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="hover:text-[#8c5625] transition-colors"><SearchIcon /></button>
            </div>
            <button 
              onClick={() => isLoggedIn ? (isAdmin ? navigate('admin') : navigate('account')) : navigate('login')} 
              className={`transition-colors ${['login', 'admin', 'account'].includes(currentRoute) ? 'text-[#8c5625]' : 'hover:text-[#8c5625]'}`}
            >
              <User />
            </button>
            <button onClick={() => setIsCartOpen(true)} className="relative hover:text-[#8c5625] transition-colors">
              <ShoppingBag />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#1c1c1c] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{cart.length}</span>
              )}
            </button>
          </div>
        </div>

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
        {currentRoute === 'shop' && <ShopView addToCart={addToCart} products={products} isLoading={isLoadingProducts} searchQuery={searchQuery} />}
        {currentRoute === 'bulk' && <BulkView showToast={showToast} />}
        {currentRoute === 'login' && <LoginView handleLogin={handleLogin} />}
        {currentRoute === 'account' && <AccountView user={currentUser} orders={orders} handleLogout={handleLogout} />}
        {currentRoute === 'admin' && <AdminView showToast={showToast} products={products} orders={orders} isLoading={isLoadingProducts} handleLogout={handleLogout} db={db} appId={appId} />}
        {currentRoute === 'checkout' && <CheckoutView cart={cart} cartTotal={cartTotal} navigate={navigate} setCart={setCart} showToast={showToast} db={db} appId={appId} user={currentUser || {uid: firebaseUser?.uid}} />}
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
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Newsletter</h4>
            <div className="flex border-b border-gray-600 pb-2">
              <input type="email" placeholder="Email Address" className="bg-transparent border-none outline-none text-sm w-full focus:ring-0" />
              <button onClick={() => showToast('Thanks for subscribing!')} className="text-sm font-bold hover:text-gray-300 transition-colors">SUBSCRIBE</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HomeView({ navigate }) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[85vh]">
        <div className="flex flex-col justify-center px-8 lg:px-24 py-16 lg:py-0 order-2 lg:order-1 bg-white">
          <p className="text-[#8c5625] font-mono text-sm mb-6 uppercase tracking-widest">Small Batch • Handmade</p>
          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tighter leading-[0.9] mb-8">Authentic.<br />Handmade.<br />Crisp.</h1>
          <p className="text-lg text-gray-600 mb-10 max-w-md leading-relaxed">
            We've reimagined the classic Indian papad. Minimal ingredients, perfect texture, delivered fresh to your door.
          </p>
          <div>
            <button onClick={() => navigate('shop')} className="bg-[#1c1c1c] text-white px-8 py-4 text-sm font-bold tracking-wide hover:bg-[#8c5625] transition-colors duration-300 w-full sm:w-auto">
              SHOP THE COLLECTION
            </button>
          </div>
        </div>
        <div className="order-1 lg:order-2 bg-gray-200">
          <img src="https://www.jonwrightphoto.com/cdn/shop/files/Palm-Print-Oak-Float-Frame-Canvas.jpg?v=1784264313&width=1500" alt="Minimalist Papad Display" className="w-full h-full object-cover min-h-[50vh] lg:min-h-full" />
        </div>
      </div>
    </div>
  );
}

function ShopView({ addToCart, products, isLoading, searchQuery }) {
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes((searchQuery || '').toLowerCase()) ||
    product.description.toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 animate-fade-in">
      <div className="mb-12 md:mb-16">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">The Collection</h2>
        <p className="text-gray-500 font-mono text-sm">
          {isLoading ? 'Loading catalog...' : `Showing ${filteredProducts.length} products`}
          {searchQuery && ` for "${searchQuery}"`}
        </p>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div></div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-300"><p className="text-gray-500">No products found matching your search.</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 md:gap-y-16">
          {filteredProducts.map(product => (
            <div key={product.id} className="group flex flex-col">
              <div className="w-full aspect-[4/5] bg-gray-100 overflow-hidden mb-6 relative rounded-sm cursor-pointer">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                {product.stock <= 0 && (
                  <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-sm uppercase tracking-wide">Out of Stock</div>
                )}
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
                <p className="font-mono font-bold text-lg">${Number(product.price).toFixed(2)}</p>
                <button onClick={() => addToCart(product)} className="lg:hidden text-sm font-bold border-b-2 border-black pb-1">
                  + ADD
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
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
          <button type="submit" className="w-full bg-[#1c1c1c] text-white py-4 font-bold tracking-wide hover:bg-[#8c5625] transition-colors rounded-sm">
            SUBMIT INQUIRY
          </button>
        </form>
      </div>
    </div>
  );
}

function LoginView({ handleLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="max-w-md mx-auto px-6 py-20 md:py-32 animate-fade-in">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-4">Welcome Back</h2>
        <p className="text-gray-500 text-sm">Sign in to access your orders and wishlists.</p>
      </div>

      <form onSubmit={(e) => handleLogin(e, email)} className="space-y-6 mb-8">
        <div className="relative">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} id="login-email" className="peer w-full border-b border-gray-300 bg-transparent py-2 pt-6 focus:outline-none focus:border-black transition-colors" placeholder=" " required />
          <label htmlFor="login-email" className="absolute left-0 top-2 text-xs text-gray-500 font-mono uppercase tracking-wide peer-focus:text-black transition-colors">Email Address</label>
        </div>
        <div className="relative">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} id="login-password" className="peer w-full border-b border-gray-300 bg-transparent py-2 pt-6 focus:outline-none focus:border-black transition-colors" placeholder=" " required />
          <label htmlFor="login-password" className="absolute left-0 top-2 text-xs text-gray-500 font-mono uppercase tracking-wide peer-focus:text-black transition-colors">Password</label>
        </div>
        <button type="submit" className="w-full bg-[#1c1c1c] text-white py-4 font-bold text-sm tracking-wide hover:bg-[#8c5625] transition-colors rounded-sm">
          SIGN IN
        </button>
      </form>
      <div className="text-center text-sm text-gray-500 bg-gray-100 p-4 rounded-sm border border-gray-200">
        <strong>Demo Tip:</strong> Use <span className="font-bold text-black">admin@thepapadco.com</span> to access the live Admin dashboard, or any other email for a standard account. Any password works.
      </div>
    </div>
  );
}

function AccountView({ user, orders, handleLogout }) {
  // Filter all global orders to just those belonging to this user
  const userOrders = orders.filter(o => o.userId === user?.uid);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 animate-fade-in min-h-[60vh]">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 border-b border-gray-200 pb-4 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tighter mb-1">My Account</h2>
          <p className="text-gray-500">Welcome back, <span className="font-medium text-black">{user?.name || 'User'}</span>!</p>
        </div>
        <button onClick={handleLogout} className="text-sm font-bold border-b-2 border-black pb-1 hover:text-red-600 hover:border-red-600 transition-colors">
          LOGOUT
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h3 className="font-bold text-xl mb-4">Order History</h3>
          {userOrders.length === 0 ? (
            <div className="bg-white border border-gray-200 p-12 text-center rounded-sm">
              <Package className="w-8 h-8 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 text-sm">You haven't placed any orders yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userOrders.map(order => (
                <div key={order.id} className="bg-white border border-gray-200 p-6 rounded-sm">
                  <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
                    <div>
                      <p className="text-xs text-gray-500 font-mono">ORDER #{order.id.substring(0,8).toUpperCase()}</p>
                      <p className="text-sm font-bold">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-gray-100 text-xs font-bold uppercase rounded-sm">{order.status}</span>
                      <p className="font-mono font-bold mt-1">${order.total}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between py-1">
                        <span>1x {item.name}</span>
                        <span className="font-mono">${item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <h3 className="font-bold text-xl mb-4">Account Details</h3>
          <div className="bg-white border border-gray-200 p-6 rounded-sm space-y-4">
            <div>
              <p className="text-xs text-gray-500 font-mono uppercase">Name</p>
              <p className="font-medium capitalize">{user?.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-mono uppercase">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminView({ showToast, products, orders, isLoading, handleLogout, db, appId }) {
  const [activeTab, setActiveTab] = useState('products');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', stock: '', image: '' });

  const openModal = (product = null) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        name: product.name, description: product.description, price: product.price, stock: product.stock, image: product.image
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', description: '', price: '', stock: '', image: '' });
    }
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const productsRef = collection(db, 'artifacts', appId, 'public', 'data', 'products');
    const dataToSave = {
      ...formData,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock, 10)
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', editingId), dataToSave);
        showToast("Product updated successfully in Database");
      } else {
        await addDoc(productsRef, dataToSave);
        showToast("New Product created in Database");
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      showToast("Error saving to Database");
    }
  };

  const handleDeleteProduct = async (id) => {
    if(confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', id));
        showToast("Product deleted from Database");
      } catch(error) {
        console.error(error);
        showToast("Error deleting from Database");
      }
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', orderId), { status: newStatus });
      showToast(`Order status updated to ${newStatus}`);
    } catch(err) {
      console.error(err);
      showToast("Error updating order status");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-6 gap-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tighter mb-2">Admin Dashboard</h2>
          <div className="flex items-center space-x-4">
            <p className="text-gray-500 font-mono text-xs uppercase">Role: Admin</p>
            <button onClick={handleLogout} className="text-red-500 text-xs font-bold hover:underline">LOGOUT</button>
          </div>
        </div>
        <div className="flex space-x-4">
          <button onClick={() => setActiveTab('products')} className={`text-sm font-bold pb-1 border-b-2 transition-colors ${activeTab === 'products' ? 'border-black' : 'border-transparent text-gray-500 hover:text-black'}`}>PRODUCTS</button>
          <button onClick={() => setActiveTab('orders')} className={`text-sm font-bold pb-1 border-b-2 transition-colors ${activeTab === 'orders' ? 'border-black' : 'border-transparent text-gray-500 hover:text-black'}`}>ORDERS ({orders.length})</button>
        </div>
      </div>

      {activeTab === 'products' && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={() => openModal()} className="bg-[#1c1c1c] text-white px-6 py-3 text-sm font-bold hover:bg-[#8c5625] transition-colors rounded-sm shadow-sm">
              + ADD NEW PRODUCT
            </button>
          </div>
          <div className="bg-white border border-[#ebebeb] shadow-sm rounded-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-[#ebebeb] text-xs font-mono uppercase text-gray-500">
                    <th className="p-4 font-medium">Product</th>
                    <th className="p-4 font-medium">Price</th>
                    <th className="p-4 font-medium">Stock (Units)</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {isLoading ? (
                    <tr><td colSpan="4" className="p-8 text-center text-gray-500">Loading database records...</td></tr>
                  ) : products.length === 0 ? (
                    <tr><td colSpan="4" className="p-8 text-center text-gray-500">Database is empty. Add a product.</td></tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id} className="border-b border-[#ebebeb] hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-bold flex items-center space-x-3">
                          <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded-sm border border-gray-200" />
                          <div className="flex flex-col">
                            <span>{product.name}</span>
                            <span className="text-xs text-gray-400 font-normal truncate max-w-[200px]">{product.description}</span>
                          </div>
                        </td>
                        <td className="p-4 font-mono">${Number(product.price).toFixed(2)}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-sm text-xs font-bold ${product.stock <= 15 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {product.stock} {product.stock <= 15 && '(Low)'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button onClick={() => openModal(product)} className="text-[#8c5625] hover:text-black font-medium text-sm mr-4 transition-colors"><Edit /></button>
                          <button onClick={() => handleDeleteProduct(product.id)} className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors"><Trash /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white border border-[#ebebeb] shadow-sm rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b border-[#ebebeb] text-xs font-mono uppercase text-gray-500">
                  <th className="p-4 font-medium">Order ID / Date</th>
                  <th className="p-4 font-medium">Customer</th>
                  <th className="p-4 font-medium">Items</th>
                  <th className="p-4 font-medium">Total</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {orders.length === 0 ? (
                  <tr><td colSpan="5" className="p-8 text-center text-gray-500">No orders placed yet.</td></tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="border-b border-[#ebebeb] hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="font-mono text-xs text-gray-500">{order.id}</div>
                        <div className="font-bold">{new Date(order.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="p-4">{order.customerEmail}</td>
                      <td className="p-4 text-xs text-gray-600">
                        {order.items.map(i => i.name).join(', ')}
                      </td>
                      <td className="p-4 font-mono font-bold">${order.total}</td>
                      <td className="p-4">
                        <select 
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                          className={`text-xs font-bold uppercase rounded-sm px-2 py-1 border-none cursor-pointer outline-none ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Database Product Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white rounded-sm shadow-2xl relative max-w-lg w-full p-6 md:p-8 z-10 animate-fade-in">
            <h3 className="text-2xl font-bold mb-6">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-gray-500 uppercase mb-1">Product Name</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 p-2 focus:border-black outline-none rounded-sm" />
              </div>
              <div>
                <label className="block text-xs font-mono text-gray-500 uppercase mb-1">Description</label>
                <textarea required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full border border-gray-300 p-2 focus:border-black outline-none rounded-sm resize-none" rows="3" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-gray-500 uppercase mb-1">Price ($)</label>
                  <input type="number" step="0.01" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full border border-gray-300 p-2 focus:border-black outline-none rounded-sm font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-mono text-gray-500 uppercase mb-1">Stock (Units)</label>
                  <input type="number" required value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} className="w-full border border-gray-300 p-2 focus:border-black outline-none rounded-sm font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-gray-500 uppercase mb-1">Image URL</label>
                <input type="url" required value={formData.image} onChange={(e) => setFormData({...formData, image: e.target.value})} className="w-full border border-gray-300 p-2 focus:border-black outline-none rounded-sm" placeholder="https://..." />
              </div>
              <div className="flex space-x-4 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 border border-gray-300 py-3 font-bold hover:bg-gray-50 transition-colors">CANCEL</button>
                <button type="submit" className="flex-1 bg-black text-white py-3 font-bold hover:bg-gray-800 transition-colors">SAVE TO DB</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckoutView({ cart, cartTotal, navigate, setCart, showToast, db, appId, user }) {
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Your bag is empty</h2>
        <button onClick={() => navigate('shop')} className="bg-black text-white px-6 py-3 font-bold text-sm">RETURN TO SHOP</button>
      </div>
    );
  }

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // In demo mode, we simulate the Stripe processing, then push the order to the database.
    setTimeout(() => {
      setIsProcessing(false);
      setShowIntegrationModal(true);
    }, 1500);
  };

  const handleFinishTestOrder = async () => {
    try {
      const ordersRef = collection(db, 'artifacts', appId, 'public', 'data', 'orders');
      await addDoc(ordersRef, {
        userId: user?.uid || 'anonymous',
        customerEmail: document.getElementById('c-email')?.value || 'guest@example.com',
        items: cart,
        total: (Number(cartTotal) + 4.99).toFixed(2),
        status: 'Pending',
        createdAt: new Date().toISOString()
      });
      
      setShowIntegrationModal(false);
      setCart([]);
      showToast("Order placed and saved to database!");
      navigate('home');
    } catch (error) {
      console.error("Error saving order:", error);
      showToast("Error processing order in database.");
    }
  };
  
  return (
    <div className="max-w-6xl mx-auto px-6 py-12 animate-fade-in relative">
      
      {showIntegrationModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowIntegrationModal(false)} />
          <div className="bg-white p-8 rounded-sm shadow-2xl relative max-w-lg w-full text-center animate-fade-in">
            <div className="w-16 h-16 bg-blue-50 text-[#635BFF] flex items-center justify-center rounded-full mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            </div>
            <h3 className="text-2xl font-bold mb-4">Integration Ready</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              In production, this redirects to the real Stripe checkout portal. For this demo, clicking the button below will bypass Stripe and write the new order directly into the <strong>live Firestore Database</strong> so you can view it in your Admin Portal.
            </p>
            <button onClick={handleFinishTestOrder} className="w-full bg-black text-white py-3 font-bold hover:bg-gray-800 transition-colors">
              FINISH TEST ORDER & SAVE TO DB
            </button>
          </div>
        </div>
      )}

      <h2 className="text-3xl font-bold tracking-tighter mb-8">Checkout</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7">
          <div className="bg-white p-6 md:p-10 border border-[#ebebeb] rounded-sm shadow-sm">
            <div className="flex items-center space-x-4 mb-10 text-sm font-bold tracking-wide">
              <button onClick={() => setCheckoutStep(1)} className={`pb-2 border-b-2 transition-colors ${checkoutStep === 1 ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'}`}>1. SHIPPING</button>
              <span className="text-gray-300 pb-2">/</span>
              <button onClick={() => checkoutStep > 1 && setCheckoutStep(2)} disabled={checkoutStep < 2} className={`pb-2 border-b-2 transition-colors ${checkoutStep === 2 ? 'border-black text-black' : 'border-transparent text-gray-400'}`}>2. PAYMENT</button>
            </div>

            {checkoutStep === 1 && (
              <form onSubmit={(e) => { e.preventDefault(); setCheckoutStep(2); }} className="space-y-6 animate-fade-in">
                <h3 className="font-bold text-lg mb-6">Contact & Delivery</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <input type="text" id="fname" className="peer w-full border-b border-gray-300 bg-transparent py-2 pt-6 focus:outline-none focus:border-black transition-colors" placeholder=" " required />
                    <label htmlFor="fname" className="absolute left-0 top-2 text-xs text-gray-500 font-mono uppercase tracking-wide peer-focus:text-black transition-colors">First Name</label>
                  </div>
                  <div className="relative">
                    <input type="text" id="lname" className="peer w-full border-b border-gray-300 bg-transparent py-2 pt-6 focus:outline-none focus:border-black transition-colors" placeholder=" " required />
                    <label htmlFor="lname" className="absolute left-0 top-2 text-xs text-gray-500 font-mono uppercase tracking-wide peer-focus:text-black transition-colors">Last Name</label>
                  </div>
                </div>
                <div className="relative">
                  <input type="email" id="c-email" defaultValue={user?.email || ''} className="peer w-full border-b border-gray-300 bg-transparent py-2 pt-6 focus:outline-none focus:border-black transition-colors" placeholder=" " required />
                  <label htmlFor="c-email" className="absolute left-0 top-2 text-xs text-gray-500 font-mono uppercase tracking-wide peer-focus:text-black transition-colors">Email Address</label>
                </div>
                <div className="relative">
                  <input type="text" id="address" className="peer w-full border-b border-gray-300 bg-transparent py-2 pt-6 focus:outline-none focus:border-black transition-colors" placeholder=" " required />
                  <label htmlFor="address" className="absolute left-0 top-2 text-xs text-gray-500 font-mono uppercase tracking-wide peer-focus:text-black transition-colors">Street Address</label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="relative md:col-span-1">
                    <input type="text" id="zip" className="peer w-full border-b border-gray-300 bg-transparent py-2 pt-6 focus:outline-none focus:border-black transition-colors" placeholder=" " required />
                    <label htmlFor="zip" className="absolute left-0 top-2 text-xs text-gray-500 font-mono uppercase tracking-wide peer-focus:text-black transition-colors">ZIP Code</label>
                  </div>
                  <div className="relative md:col-span-2">
                    <input type="text" id="city" className="peer w-full border-b border-gray-300 bg-transparent py-2 pt-6 focus:outline-none focus:border-black transition-colors" placeholder=" " required />
                    <label htmlFor="city" className="absolute left-0 top-2 text-xs text-gray-500 font-mono uppercase tracking-wide peer-focus:text-black transition-colors">City</label>
                  </div>
                </div>
                <button type="submit" className="w-full bg-[#1c1c1c] text-white py-4 mt-8 font-bold tracking-wide hover:bg-[#8c5625] transition-colors rounded-sm">CONTINUE TO PAYMENT</button>
              </form>
            )}

            {checkoutStep === 2 && (
              <form onSubmit={handleProcessPayment} className="space-y-6 animate-fade-in">
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto bg-[#635BFF]/10 text-[#635BFF] rounded-full flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                  </div>
                  <h3 className="font-bold text-xl mb-2">Secure Payment with Stripe</h3>
                  <p className="text-gray-500 text-sm max-w-md mx-auto mb-8">
                    You will be redirected to Stripe's encrypted checkout portal to securely enter your payment details and complete your purchase.
                  </p>
                  
                  <button type="submit" disabled={isProcessing} className="w-full max-w-md mx-auto bg-[#635BFF] text-white py-4 font-bold tracking-wide hover:bg-[#5851df] transition-colors rounded-sm flex items-center justify-center space-x-3 disabled:bg-gray-400 shadow-md shadow-[#635BFF]/20">
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>CREATING SECURE SESSION...</span>
                      </>
                    ) : (
                      <>
                        <span>PROCEED TO STRIPE CHECKOUT</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-gray-50 p-6 border border-gray-200 rounded-sm sticky top-28">
            <h3 className="font-bold text-lg mb-6">Order Summary</h3>
            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <img src={item.image} alt={item.name} className="w-12 h-12 object-cover border border-gray-200 rounded-sm" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm font-mono">${Number(item.price).toFixed(2)}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="font-mono">${cartTotal}</span></div>
              <div className="flex justify-between text-gray-600"><span>Shipping</span><span className="font-mono">{checkoutStep === 1 ? 'Calculated next step' : '$4.99'}</span></div>
              <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t border-gray-200">
                <span>Total</span>
                <span className="font-mono">${checkoutStep === 1 ? cartTotal : (Number(cartTotal) + 4.99).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}