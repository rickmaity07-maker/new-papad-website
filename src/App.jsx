import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

// --- FIREBASE SETUP ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
const appId = 'the-papad-co'; // Unique identifier for our database collections

// --- ICONS ---
const ShoppingBagIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
);
const UserIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);
const SearchIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);
const CloseIcon = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
const HeartIcon = ({ size = 20, filled = false }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
);
const GoogleIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
);
const FacebookIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
);

// --- INITIAL DATA ---
const initialProducts = [
  { id: 1, name: 'Spicy Moong Papad', price: 6.49, description: 'Traditional spicy moong dal papad.', image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=600&q=80' },
  { id: 2, name: 'Urad Dal Papad', price: 5.99, description: 'Classic plain urad dal papad.', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80' },
  { id: 3, name: 'Garlic Green Chilli', price: 7.49, description: 'Extra spicy with a garlic kick.', image: 'https://images.unsplash.com/photo-1604152135912-04a022e23696?auto=format&fit=crop&w=600&q=80' }
];

export default function App() {
  const getLocal = (key, fallback) => {
    if (typeof window === 'undefined') return fallback;
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  };

  const [currentView, setCurrentView] = useState('home');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [cart, setCart] = useState(() => getLocal('papad_cart', []));
  const [products] = useState(() => getLocal('papad_products', initialProducts));
  
  // Cloud Managed State
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]); 
  
  const [user, setUser] = useState(() => getLocal('papad_user', null));
  const [isAdmin, setIsAdmin] = useState(() => getLocal('papad_isAdmin', false));
  const [authError, setAuthError] = useState('');

  // Persist local cart state
  useEffect(() => { window.localStorage.setItem('papad_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { 
    window.localStorage.setItem('papad_user', JSON.stringify(user));
    window.localStorage.setItem('papad_isAdmin', JSON.stringify(isAdmin));
  }, [user, isAdmin]);

  // Firebase Auth & Firestore Sync Listener
  useEffect(() => {
    let unsubOrders = () => {};
    let unsubWishlist = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
          photoURL: currentUser.photoURL
        });
        setIsAdmin(currentUser.email === 'admin@thepapadco.com');

        // Connect to Firestore Orders
        const ordersRef = collection(db, 'apps', appId, 'users', currentUser.uid, 'orders');
        unsubOrders = onSnapshot(ordersRef, (snap) => {
          const fetchedOrders = [];
          snap.forEach(doc => fetchedOrders.push({ ...doc.data(), id: doc.id }));
          setOrders(fetchedOrders.sort((a, b) => b.createdAt - a.createdAt));
        }, (err) => console.error("Order sync error:", err));

        // Connect to Firestore Wishlist
        const wishlistRef = collection(db, 'apps', appId, 'users', currentUser.uid, 'wishlist');
        unsubWishlist = onSnapshot(wishlistRef, (snap) => {
          const fetchedWish = [];
          snap.forEach(doc => fetchedWish.push(doc.data()));
          setWishlist(fetchedWish);
        }, (err) => console.error("Wishlist sync error:", err));

      } else {
        // Clear sensitive data when logged out
        setUser(null);
        setIsAdmin(false);
        setOrders([]);
        setWishlist([]);
        unsubOrders();
        unsubWishlist();
      }
    });
    
    return () => {
      unsubscribeAuth();
      unsubOrders();
      unsubWishlist();
    };
  }, []);

  // --- ACTIONS ---
  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId) => setCart(prev => prev.filter(item => item.id !== productId));
  const updateQuantity = (productId, delta) => {
    setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // --- CLOUD ACTIONS ---
  const toggleWishlist = async (product) => {
    if (!user) {
      alert("Please sign in to save items to your wishlist.");
      setCurrentView('account');
      return;
    }
    const isWished = wishlist.some(item => item.id === product.id);
    
    // Optimistic UI: Update screen instantly before cloud finishes
    if (isWished) {
      setWishlist(prev => prev.filter(item => item.id !== product.id));
    } else {
      setWishlist(prev => [...prev, product]);
    }

    const wishRef = doc(db, 'apps', appId, 'users', user.uid, 'wishlist', String(product.id));
    
    try {
      if (isWished) {
        await deleteDoc(wishRef);
      } else {
        await setDoc(wishRef, product);
      }
    } catch (error) {
      console.error("Error updating wishlist:", error);
      // Revert optimistic UI if internet fails
      if (isWished) {
        setWishlist(prev => [...prev, product]);
      } else {
        setWishlist(prev => prev.filter(item => item.id !== product.id));
      }
      alert("Failed to update wishlist. Check Firestore settings.");
    }
  };

  const handleCheckoutSubmit = async () => {
    if (cart.length === 0) return;
    if (!user) {
      alert("Please sign in to complete your purchase securely.");
      setCurrentView('account');
      return;
    }

    const newOrder = {
      items: cart,
      total: cartTotal,
      date: new Date().toLocaleDateString(),
      createdAt: Date.now(),
      status: 'Processing',
      userEmail: user.email
    };

    try {
      const ordersRef = collection(db, 'apps', appId, 'users', user.uid, 'orders');
      await addDoc(ordersRef, newOrder);
      setCart([]);
      setIsCartOpen(false);
      alert('Order placed securely in the cloud! Check your Account tab.');
      setCurrentView('account');
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Failed to place order. Make sure you enabled Firestore Database in test mode.");
    }
  };

  // --- AUTH ACTIONS ---
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, e.target.email.value, e.target.password.value);
      setCurrentView('account');
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setCurrentView('account');
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      await signInWithPopup(auth, facebookProvider);
      setCurrentView('account');
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentView('home');
  };

  return (
    <div className="min-h-screen bg-white text-[#111] font-sans flex flex-col">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 py-6 px-8 flex items-center justify-between">
        <div className="text-xl font-black tracking-tighter uppercase cursor-pointer" onClick={() => setCurrentView('home')}>The Papad Co.</div>
        <nav className="hidden md:flex gap-12 text-xs font-bold tracking-[0.2em] uppercase">
          <button onClick={() => setCurrentView('shop')}>Shop</button>
          <button onClick={() => setCurrentView('wholesale')}>Wholesale</button>
        </nav>
        <div className="flex items-center gap-6">
          <button onClick={() => setCurrentView('shop')}><SearchIcon /></button>
          
          {user && (
            <button onClick={() => setCurrentView('account')} className="relative hidden sm:block">
              <HeartIcon filled={wishlist.length > 0} />
              {wishlist.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full pointer-events-none">
                  {wishlist.length}
                </span>
              )}
            </button>
          )}

          <button onClick={() => setCurrentView('account')}><UserIcon /></button>
          <button onClick={() => setIsCartOpen(true)} className="relative">
            <ShoppingBagIcon />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#111] text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full pointer-events-none">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="flex-grow flex flex-col">
        {}
        {currentView === 'home' && (
          <div className="flex-grow flex flex-col md:flex-row h-full">
            <div className="w-full md:w-1/2 p-8 md:p-24 flex flex-col justify-center">
              <p className="text-[#A67C52] text-[10px] font-bold tracking-[0.3em] uppercase mb-8">Small Batch • Handmade</p>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8">Authentic.<br/>Handmade.<br/>Crisp.</h1>
              <button onClick={() => setCurrentView('shop')} className="bg-[#111] text-white px-10 py-5 text-xs font-bold uppercase tracking-[0.2em] w-fit rounded-none">Shop The Collection</button>
            </div>
            <div className="w-full md:w-1/2 bg-[#F9F9F9] p-24 flex items-center justify-center">
              <div className="w-full max-w-md aspect-[3/4] bg-white shadow-2xl p-4 border-[16px] border-[#DEB887]">
                <img src="https://images.unsplash.com/photo-1505245208761-ba872912fac0?auto=format&fit=crop&w=800&q=80" className="w-full h-full object-cover grayscale" />
              </div>
            </div>
          </div>
        )}
        
        {}
        {currentView === 'shop' && (
          <div className="px-8 py-16 max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div>
                <h2 className="text-4xl font-black tracking-tighter mb-4">Collection</h2>
                <p className="text-gray-500 text-sm">Our signature, hand-rolled papads.</p>
              </div>
              <div className="relative w-full md:w-72">
                <SearchIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 text-sm outline-none focus:border-[#111] rounded-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              {filteredProducts.map(p => (
                <div key={p.id} className="group cursor-pointer">
                  <div className="aspect-[4/5] bg-gray-100 mb-6 overflow-hidden relative">
                    <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    
                    {/* Fixed Wishlist Button: High z-index, stops event bubbling */}
                    <button 
                      onClick={(e) => { 
                        e.preventDefault(); 
                        e.stopPropagation(); 
                        toggleWishlist(p); 
                      }}
                      className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:scale-110 transition-transform text-[#111] z-20 cursor-pointer"
                    >
                      <HeartIcon filled={wishlist.some(w => w.id === p.id)} size={18} />
                    </button>
                    
                  </div>
                  <h3 className="font-bold">{p.name}</h3>
                  <p className="text-gray-500 text-sm mb-4">${p.price.toFixed(2)}</p>
                  <button onClick={() => addToCart(p)} className="border border-[#111] w-full py-3 text-xs font-bold uppercase hover:bg-[#111] hover:text-white transition-colors">Add to Cart</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {}
        {currentView === 'wholesale' && (
          <div className="max-w-3xl mx-auto w-full px-8 py-24">
            <div className="text-center mb-16">
              <p className="text-[#A67C52] text-[10px] font-bold tracking-[0.3em] uppercase mb-4">Partner With Us</p>
              <h2 className="text-4xl font-black tracking-tighter mb-4">Wholesale Application</h2>
              <p className="text-gray-500 text-sm">Stock The Papad Co. in your retail store or restaurant.</p>
            </div>
            
            <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); alert("Application submitted! We will contact you soon."); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] mb-2 text-gray-500">First Name</label>
                  <input type="text" required className="w-full border border-gray-200 py-3 px-4 outline-none focus:border-[#111] rounded-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] mb-2 text-gray-500">Last Name</label>
                  <input type="text" required className="w-full border border-gray-200 py-3 px-4 outline-none focus:border-[#111] rounded-none" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] mb-2 text-gray-500">Company Name</label>
                <input type="text" required className="w-full border border-gray-200 py-3 px-4 outline-none focus:border-[#111] rounded-none" />
              </div>
              <button type="submit" className="w-full bg-[#111] text-white py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors rounded-none">
                Submit Application
              </button>
            </form>
          </div>
        )}

        {}
        {currentView === 'account' && (
          <div className="max-w-6xl mx-auto w-full px-8 py-16">
            {!user ? (
              <div className="max-w-md mx-auto space-y-6">
                <h1 className="text-3xl font-black uppercase tracking-tighter mb-8 text-center">Sign In</h1>
                {authError && <div className="p-4 bg-red-50 text-red-600 text-xs text-center">{authError}</div>}
                
                <form onSubmit={handleEmailAuth} className="space-y-4 mb-8">
                  <input type="email" name="email" required placeholder="Email Address" className="w-full px-4 py-3 border border-gray-200 outline-none focus:border-[#111] rounded-none" />
                  <input type="password" name="password" required placeholder="Password" className="w-full px-4 py-3 border border-gray-200 outline-none focus:border-[#111] rounded-none" />
                  <button type="submit" className="w-full bg-[#111] text-white py-4 text-xs font-bold uppercase tracking-[0.2em]">Sign In</button>
                </form>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                  <div className="relative flex justify-center"><span className="px-4 bg-white text-gray-400 uppercase tracking-[0.2em] text-[9px] font-bold">Or</span></div>
                </div>

                <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-2 py-4 border border-gray-200 uppercase tracking-widest text-xs font-bold hover:border-[#111] transition-colors"><GoogleIcon /> Login with Google</button>
                <button onClick={handleFacebookLogin} className="w-full flex items-center justify-center gap-2 py-4 bg-[#1877F2] text-white uppercase tracking-widest text-xs font-bold hover:bg-[#166FE5] transition-colors"><FacebookIcon /> Login with Facebook</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                {/* Profile Sidebar */}
                <div className="lg:col-span-1">
                  <div className="border border-gray-200 p-8 text-center sticky top-32">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName} className="w-24 h-24 rounded-full mx-auto mb-6 object-cover border border-gray-200" />
                    ) : (
                      <div className="w-24 h-24 rounded-full mx-auto mb-6 bg-gray-100 flex items-center justify-center text-2xl font-black text-gray-400">
                        {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <h2 className="text-xl font-bold tracking-tight mb-2">{user.displayName}</h2>
                    <p className="text-sm text-gray-500 mb-8 break-all">{user.email}</p>
                    
                    <button onClick={handleLogout} className="w-full border border-gray-200 text-gray-600 py-3 text-xs font-bold uppercase tracking-[0.2em] hover:border-[#111] hover:text-[#111] transition-colors rounded-none">
                      Sign Out
                    </button>
                  </div>
                </div>

                {/* Dashboard: Wishlist & Orders */}
                <div className="lg:col-span-2 space-y-16">
                  
                  {/* Cloud Wishlist */}
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 pb-4 border-b border-gray-200">Your Wishlist</h3>
                    {wishlist.length === 0 ? (
                      <div className="py-8 text-center text-gray-500 text-sm border border-dashed border-gray-200">
                        Nothing saved yet. <button onClick={() => setCurrentView('shop')} className="underline font-bold text-[#111]">Explore our collection.</button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {wishlist.map(item => (
                          <div key={item.id} className="flex gap-4 border border-gray-100 p-4 relative group">
                            <img src={item.image} alt={item.name} className="w-20 h-20 object-cover bg-gray-50" />
                            <div className="flex-1 flex flex-col justify-center">
                              <h4 className="font-bold text-sm line-clamp-1">{item.name}</h4>
                              <p className="text-gray-500 text-sm mb-3">${Number(item.price).toFixed(2)}</p>
                              <div className="flex gap-4 items-center">
                                <button onClick={() => addToCart(item)} className="text-[10px] font-bold uppercase tracking-widest underline hover:opacity-50">Add to Cart</button>
                                <button onClick={() => toggleWishlist(item)} className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:opacity-50">Remove</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cloud Orders */}
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 pb-4 border-b border-gray-200">Order History</h3>
                    {orders.length === 0 ? (
                      <div className="py-16 text-center border border-gray-200 bg-gray-50">
                        <p className="text-gray-500 text-sm mb-6">No orders found.</p>
                        <button onClick={() => setCurrentView('shop')} className="border border-[#111] px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#111] hover:text-white transition-colors rounded-none">
                          Start Shopping
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {orders.map(order => (
                          <div key={order.id} className="border border-gray-200 p-6 flex flex-col md:flex-row justify-between gap-6 hover:border-[#111] transition-colors">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-3">
                                <p className="font-bold text-sm tracking-widest">ORDER #{order.id.slice(0,6).toUpperCase()}</p>
                                <span className="px-2 py-1 bg-gray-100 text-[9px] font-bold uppercase tracking-[0.2em]">
                                  {order.status}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mb-4">{order.date}</p>
                              <div className="pt-4 border-t border-gray-100">
                                <p className="text-sm text-gray-600 leading-relaxed">
                                  {order.items.map(i => `${i.quantity}x ${i.name}`).join(' • ')}
                                </p>
                              </div>
                            </div>
                            <div className="text-left md:text-right md:pl-6 md:border-l md:border-gray-100 flex flex-col justify-between">
                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">Total</p>
                                <p className="font-black text-xl">${order.total.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-gray-100 py-12 px-8 mt-auto text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
          © {new Date().getFullYear()} The Papad Co. All Rights Reserved.
        </p>
      </footer>

      {}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl border-l border-gray-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-black uppercase tracking-tight">Your Bag ({cart.length})</h2>
              <button onClick={() => setIsCartOpen(false)} className="hover:opacity-50"><CloseIcon /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="text-center text-gray-500 mt-12 text-sm">Your bag is empty.</div>
              ) : (
                <div className="space-y-6">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-4 border-b border-gray-100 pb-6">
                      <img src={item.image} alt={item.name} className="w-20 h-24 object-cover bg-gray-100" />
                      <div className="flex-1 flex flex-col">
                        <div className="flex justify-between mb-1">
                          <h3 className="text-sm font-bold">{item.name}</h3>
                          <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500"><CloseIcon size={16} /></button>
                        </div>
                        <p className="text-sm text-gray-500 mb-auto">${item.price.toFixed(2)}</p>
                        <div className="flex items-center gap-3 border border-gray-200 w-fit">
                          <button onClick={() => updateQuantity(item.id, -1)} className="px-3 py-1 hover:bg-gray-50">-</button>
                          <span className="text-sm text-center min-w-[20px]">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="px-3 py-1 hover:bg-gray-50">+</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm font-bold uppercase tracking-widest text-gray-500">Subtotal</span>
                  <span className="text-2xl font-black">${cartTotal.toFixed(2)}</span>
                </div>
                <button 
                  onClick={handleCheckoutSubmit}
                  className="w-full bg-[#111] text-white py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors rounded-none"
                >
                  Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}