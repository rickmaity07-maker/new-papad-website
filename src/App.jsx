import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, doc, setDoc, deleteDoc, collectionGroup, getDocs, query } from 'firebase/firestore';

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

const appId = 'the-papad-co'; 

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
const MenuIcon = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
);
const TrashIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
);
const GoogleIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
);
const FacebookIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
);

const products = [
  { id: 1, name: 'Spicy Moong Papad', price: 6.49, description: 'Traditional spicy moong dal papad.', image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=600&q=80' },
  { id: 2, name: 'Urad Dal Papad', price: 5.99, description: 'Classic plain urad dal papad.', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80' },
  { id: 3, name: 'Garlic Green Chilli', price: 7.49, description: 'Extra spicy with a garlic kick.', image: 'https://images.unsplash.com/photo-1604152135912-04a022e23696?auto=format&fit=crop&w=600&q=80' }
];

export default function App() {
  // ROUTING STATE: Added 'b2b' back to the list of allowed routes
  const [currentView, setCurrentView] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return ['home', 'shop', 'account', 'admin', 'b2b'].includes(hash) ? hash : 'home';
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]); 
  const [allAdminOrders, setAllAdminOrders] = useState([]); 
  
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // 1. Listen for URL changes to support browser Back/Forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      setCurrentView(['home', 'shop', 'account', 'admin', 'b2b'].includes(hash) ? hash : 'home');
      setIsMobileMenuOpen(false); 
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Central Navigation Function updates the URL hash
  const navigate = (view) => {
    window.location.hash = view;
  };

  // 2. Listen for User Authentication
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser({ uid: currentUser.uid, email: currentUser.email, displayName: currentUser.displayName || 'User' });
        
        // Admin configuration
        const adminStatus = currentUser.email === 'admin@thepapadco.com' || currentUser.email === 'admin@lijopapad.com';
        setIsAdmin(adminStatus);

        // Sync User's Orders
        const ordersRef = collection(db, 'apps', appId, 'users', currentUser.uid, 'orders');
        onSnapshot(ordersRef, (snap) => setOrders(snap.docs.map(d => ({...d.data(), id: d.id}))));

        // Sync User's Wishlist
        const wishlistRef = collection(db, 'apps', appId, 'users', currentUser.uid, 'wishlist');
        onSnapshot(wishlistRef, (snap) => setWishlist(snap.docs.map(d => d.data())));

        // Fetch ALL orders if Admin
        if (adminStatus) {
          try {
            const adminQuery = query(collectionGroup(db, 'orders'));
            const querySnapshot = await getDocs(adminQuery);
            const allOrd = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setAllAdminOrders(allOrd.sort((a, b) => new Date(b.date) - new Date(a.date)));
          } catch (e) {
            console.error("Admin Fetch Error: ", e);
          }
        }
      } else {
        setUser(null); setIsAdmin(false); setOrders([]); setWishlist([]); setAllAdminOrders([]);
      }
    });
    return unsubscribeAuth;
  }, []);

  // Restored robust login handlers to catch popup errors explicitly
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google Login Error:", error);
      alert(`Google Login Failed: ${error.message}`);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      await signInWithPopup(auth, facebookProvider);
    } catch (error) {
      console.error("Facebook Login Error:", error);
      alert(`Facebook Login Failed: ${error.message}`);
    }
  };

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, change) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQ = item.quantity + change;
        return { ...item, quantity: newQ > 0 ? newQ : 1 };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const toggleWishlist = async (product) => {
    if (!user) {
      alert("Please sign in to save items to your wishlist.");
      navigate('account');
      return;
    }
    const isWished = wishlist.some(item => item.id === product.id);
    
    // Optimistic UI update
    if (isWished) setWishlist(prev => prev.filter(item => item.id !== product.id));
    else setWishlist(prev => [...prev, product]);

    const wishRef = doc(db, 'apps', appId, 'users', user.uid, 'wishlist', String(product.id));
    try {
      if (isWished) await deleteDoc(wishRef);
      else await setDoc(wishRef, product);
    } catch (error) {
      console.error("Error updating wishlist:", error);
    }
  };

  const handleCheckoutSubmit = async () => {
    if (!user) { 
      setIsCartOpen(false); 
      navigate('account'); 
      return; 
    }
    if (cart.length === 0) return;

    try {
      await addDoc(collection(db, 'apps', appId, 'users', user.uid, 'orders'), {
        items: cart, 
        total: cartTotal, 
        date: new Date().toISOString(), 
        status: 'Processing',
        customerEmail: user.email 
      });
      setCart([]); 
      setIsCartOpen(false); 
      navigate('account');
    } catch (e) {
      alert("Failed to checkout. Ensure database is enabled.");
    }
  };

  const handleSearchClick = () => {
    navigate('shop');
    // Slight delay to allow view to change before focusing the input
    setTimeout(() => {
      const searchInput = document.getElementById('shop-search-input');
      if (searchInput) searchInput.focus();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-white text-[#111] font-sans flex flex-col overflow-x-hidden">
      
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 py-4 px-6 md:py-6 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
            <MenuIcon />
          </button>
          <div className="text-xl md:text-2xl font-black tracking-tighter uppercase cursor-pointer" onClick={() => navigate('home')}>
            LIJO Papad
          </div>
        </div>
        
        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-12 text-xs font-bold tracking-[0.2em] uppercase">
          <button onClick={() => navigate('shop')} className={currentView === 'shop' ? 'border-b-2 border-[#111]' : 'hover:opacity-60 transition-opacity'}>Shop</button>
          <button onClick={() => navigate('b2b')} className={currentView === 'b2b' ? 'border-b-2 border-[#111]' : 'hover:opacity-60 transition-opacity'}>B2B Wholesale</button>
          {isAdmin && <button onClick={() => navigate('admin')} className="text-red-500">Admin</button>}
        </nav>
        
        <div className="flex items-center gap-4 md:gap-6">
          <button onClick={handleSearchClick} className="hover:scale-110 transition-transform"><SearchIcon /></button>
          <button onClick={() => navigate('account')} className="hover:scale-110 transition-transform"><UserIcon /></button>
          <button onClick={() => setIsCartOpen(true)} className="relative hover:scale-110 transition-transform">
            <ShoppingBagIcon />
            {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-[#111] text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold">{cart.length}</span>}
          </button>
        </div>
      </header>

      {/* MOBILE MENU */}
      <div className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobileMenuOpen(false)}>
        <div className={`fixed top-0 left-0 w-[80%] max-w-sm h-full bg-white p-8 transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`} onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-12">
            <div className="text-2xl font-black tracking-tighter uppercase">LIJO Papad</div>
            <button onClick={() => setIsMobileMenuOpen(false)}><CloseIcon /></button>
          </div>
          <nav className="flex flex-col gap-8 text-sm font-bold tracking-[0.2em] uppercase">
            <button className="text-left" onClick={() => navigate('home')}>Home</button>
            <button className="text-left" onClick={() => navigate('shop')}>Shop Collection</button>
            <button className="text-left" onClick={() => navigate('b2b')}>B2B Wholesale</button>
            <button className="text-left" onClick={() => navigate('account')}>My Account</button>
            {isAdmin && <button className="text-left text-red-500" onClick={() => navigate('admin')}>Admin Dashboard</button>}
          </nav>
        </div>
      </div>

      <main className="flex-grow flex flex-col relative">
        
        {}
        {currentView === 'home' && (
          <div className="flex-grow flex flex-col md:flex-row h-full min-h-[80vh]">
            <div className="w-full md:w-1/2 p-8 md:p-24 flex flex-col justify-center bg-gray-50/50">
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 uppercase">Authentic.<br/>Handmade.<br/>Crisp.</h1>
              <p className="text-gray-500 mb-8 max-w-md">Experience the traditional crunch of LIJO Papad, crafted with premium spices and time-honored recipes.</p>
              <button onClick={() => navigate('shop')} className="bg-[#111] text-white px-10 py-5 text-xs font-bold uppercase tracking-[0.2em] w-fit hover:bg-gray-800 transition-colors">Shop Collection</button>
            </div>
            <div className="w-full md:w-1/2 min-h-[300px] bg-[url('https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center"></div>
          </div>
        )}

        {}
        {currentView === 'shop' && (
          <div className="px-6 py-12 md:px-8 md:py-16 max-w-7xl mx-auto w-full">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-black uppercase tracking-widest mb-4">The Collection</h2>
              <input 
                id="shop-search-input"
                type="text" 
                placeholder="Search products..." 
                className="border-b border-gray-300 pb-2 px-4 focus:outline-none focus:border-[#111] w-full max-w-md text-sm text-center"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-16">
              {filteredProducts.map(p => (
                <div key={p.id} className="group cursor-pointer">
                  <div className="aspect-[4/5] bg-gray-100 mb-6 overflow-hidden relative">
                    <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(p); }}
                      className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:scale-110 transition-transform text-[#111] z-20 cursor-pointer"
                    >
                      <HeartIcon filled={wishlist.some(w => w.id === p.id)} size={18} />
                    </button>
                  </div>
                  <h3 className="font-bold text-lg">{p.name}</h3>
                  <p className="text-gray-500 text-sm mb-4">${p.price.toFixed(2)}</p>
                  <button onClick={(e) => { e.stopPropagation(); addToCart(p); }} className="border border-[#111] w-full py-4 text-xs font-bold uppercase tracking-wider hover:bg-[#111] hover:text-white transition-colors">Add to Cart</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {}
        {currentView === 'b2b' && (
          <div className="max-w-3xl mx-auto py-12 px-6 md:py-24 md:px-8 w-full">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black uppercase tracking-widest mb-4">Wholesale & B2B</h2>
              <p className="text-gray-500">Partner with LIJO Papad for your restaurant, grocery store, or catering business. We offer competitive bulk pricing on all our traditional recipes.</p>
            </div>
            
            <form className="space-y-8 bg-gray-50 p-8 md:p-12" onSubmit={(e) => { e.preventDefault(); alert('Inquiry sent! Our wholesale team will contact you within 24 hours.'); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2">Business Name</label>
                  <input type="text" className="w-full bg-transparent border-b border-gray-300 pb-2 focus:outline-none focus:border-[#111]" required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2">Contact Name</label>
                  <input type="text" className="w-full bg-transparent border-b border-gray-300 pb-2 focus:outline-none focus:border-[#111]" required />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2">Email Address</label>
                  <input type="email" className="w-full bg-transparent border-b border-gray-300 pb-2 focus:outline-none focus:border-[#111]" required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2">Expected Monthly Volume</label>
                  <select className="w-full bg-transparent border-b border-gray-300 pb-2 focus:outline-none focus:border-[#111] cursor-pointer">
                    <option>Less than 50kg</option>
                    <option>50kg - 200kg</option>
                    <option>200kg - 500kg</option>
                    <option>500kg+</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2">Additional Details</label>
                <textarea rows="3" className="w-full bg-transparent border-b border-gray-300 pb-2 focus:outline-none focus:border-[#111] resize-none" placeholder="Tell us about your business..."></textarea>
              </div>

              <button type="submit" className="w-full bg-[#111] text-white py-5 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">
                Submit Inquiry
              </button>
            </form>
          </div>
        )}

        {}
        {currentView === 'account' && (
          <div className="max-w-4xl mx-auto py-12 px-6 md:py-24 md:px-8 w-full">
            {!user ? (
              <div className="max-w-md mx-auto space-y-6 text-center">
                <h2 className="text-3xl font-black uppercase tracking-widest mb-8">Welcome Back</h2>
                
                {/* Updated Login Buttons with explicitly handled functions */}
                <button onClick={handleGoogleLogin} className="w-full py-4 border border-gray-200 flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors uppercase text-xs font-bold tracking-wider">
                  <GoogleIcon /> Continue with Google
                </button>
                <button onClick={handleFacebookLogin} className="w-full py-4 bg-[#1877F2] text-white flex items-center justify-center gap-3 hover:bg-[#166fe5] transition-colors uppercase text-xs font-bold tracking-wider">
                  <FacebookIcon /> Continue with Facebook
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="md:col-span-1">
                  <h2 className="text-2xl font-black mb-2">{user.displayName}</h2>
                  <p className="text-gray-500 text-sm mb-6">{user.email}</p>
                  <button onClick={() => signOut(auth)} className="text-xs font-bold uppercase tracking-widest underline decoration-2 underline-offset-4 hover:opacity-60 transition-opacity">Sign Out</button>
                </div>
                <div className="md:col-span-2 space-y-12">
                  
                  {/* Order History */}
                  <div>
                    <h3 className="font-bold uppercase tracking-widest mb-6 border-b pb-2">Order History</h3>
                    {orders.length === 0 ? <p className="text-gray-500 text-sm">No orders placed yet.</p> : (
                      <div className="space-y-4">
                        {orders.map(order => (
                          <div key={order.id} className="border border-gray-100 p-6 flex flex-col md:flex-row justify-between gap-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">{new Date(order.date).toLocaleDateString()}</p>
                              <p className="font-bold text-sm">Order #{order.id.slice(-6).toUpperCase()}</p>
                              <p className="text-sm mt-2">{order.items.length} items</p>
                            </div>
                            <div className="text-left md:text-right">
                              <p className="font-bold">${order.total.toFixed(2)}</p>
                              <span className="inline-block mt-2 bg-gray-100 px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-sm">{order.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Wishlist */}
                  <div>
                    <h3 className="font-bold uppercase tracking-widest mb-6 border-b pb-2">Wishlist</h3>
                    {wishlist.length === 0 ? <p className="text-gray-500 text-sm">Your wishlist is empty.</p> : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {wishlist.map(item => (
                          <div key={item.id} className="group relative">
                            <img src={item.image} className="w-full aspect-square object-cover bg-gray-50 mb-3" />
                            <h4 className="font-bold text-sm">{item.name}</h4>
                            <button onClick={() => toggleWishlist(item)} className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-sm">
                              <TrashIcon size={14} />
                            </button>
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

        {}
        {currentView === 'admin' && isAdmin && (
          <div className="px-6 py-12 md:px-8 md:py-16 max-w-6xl mx-auto w-full">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-widest mb-2">Admin Dashboard</h2>
            <p className="text-gray-500 mb-8 text-sm">Managing store: LIJO Papad ({user.email})</p>
            
            <div className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
              <div className="p-6 bg-gray-50 border-b border-gray-200">
                <h3 className="font-bold uppercase tracking-widest text-sm">Global Store Orders</h3>
              </div>
              <div className="p-6 overflow-x-auto">
                {allAdminOrders.length === 0 ? (
                   <p className="text-sm text-gray-500">No orders found across the platform, or Firestore Index is missing for cross-user queries.</p>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-xs uppercase text-gray-500 border-b border-gray-100">
                        <th className="pb-3 pr-4 font-bold tracking-wider">Date</th>
                        <th className="pb-3 pr-4 font-bold tracking-wider">Order ID</th>
                        <th className="pb-3 pr-4 font-bold tracking-wider">Customer</th>
                        <th className="pb-3 pr-4 font-bold tracking-wider">Total</th>
                        <th className="pb-3 font-bold tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {allAdminOrders.map(order => (
                        <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-4 pr-4 whitespace-nowrap">{new Date(order.date).toLocaleDateString()}</td>
                          <td className="py-4 pr-4 font-mono text-xs">{order.id.slice(-6).toUpperCase()}</td>
                          <td className="py-4 pr-4">{order.customerEmail || 'Guest'}</td>
                          <td className="py-4 pr-4 font-bold">${order.total.toFixed(2)}</td>
                          <td className="py-4">
                            <span className="bg-[#111] text-white px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded-sm">{order.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {}
      {/* CART DRAWER */}
      <div className={`fixed inset-0 bg-black/40 z-50 transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsCartOpen(false)}>
        <div className={`fixed top-0 right-0 h-full w-full md:w-[450px] bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`} onClick={e => e.stopPropagation()}>
          
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="font-black uppercase tracking-widest text-lg">Your Cart ({cart.length})</h2>
            <button onClick={() => setIsCartOpen(false)} className="hover:rotate-90 transition-transform"><CloseIcon /></button>
          </div>

          <div className="flex-grow overflow-y-auto p-6 space-y-6">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <ShoppingBagIcon size={48} />
                <p className="mt-4 font-bold uppercase tracking-widest text-sm">Your cart is empty</p>
                <button onClick={() => { setIsCartOpen(false); navigate('shop'); }} className="mt-6 border-b-2 border-[#111] text-[#111] text-xs font-bold uppercase pb-1">Continue Shopping</button>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex gap-4">
                  <img src={item.image} alt={item.name} className="w-24 h-32 object-cover bg-gray-50" />
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-sm leading-tight">{item.name}</h3>
                        <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500"><TrashIcon /></button>
                      </div>
                      <p className="text-gray-500 text-sm">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center border border-gray-200 w-fit">
                      <button onClick={() => updateQuantity(item.id, -1)} className="px-3 py-1 hover:bg-gray-100">-</button>
                      <span className="px-3 text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="px-3 py-1 hover:bg-gray-100">+</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <div className="flex justify-between items-center mb-6 text-lg">
                <span className="font-bold uppercase tracking-widest text-sm">Subtotal</span>
                <span className="font-black">${cartTotal.toFixed(2)}</span>
              </div>
              <button 
                onClick={handleCheckoutSubmit}
                className="w-full bg-[#111] text-white py-5 font-bold uppercase tracking-[0.2em] text-xs hover:bg-gray-800 transition-colors"
              >
                {user ? 'Secure Checkout' : 'Login to Checkout'}
              </button>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}