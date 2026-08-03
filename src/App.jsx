import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';

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
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

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
  const [orders, setOrders] = useState(() => getLocal('papad_orders', []));
  const [user, setUser] = useState(() => getLocal('papad_user', null));
  const [isAdmin, setIsAdmin] = useState(() => getLocal('papad_isAdmin', false));
  const [authError, setAuthError] = useState('');

  useEffect(() => { window.localStorage.setItem('papad_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { window.localStorage.setItem('papad_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { 
    window.localStorage.setItem('papad_user', JSON.stringify(user));
    window.localStorage.setItem('papad_isAdmin', JSON.stringify(isAdmin));
  }, [user, isAdmin]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
          photoURL: currentUser.photoURL
        });
        setIsAdmin(currentUser.email === 'admin@thepapadco.com');
      }
    });
    return () => unsubscribe();
  }, []);

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
    setIsAdmin(false);
    setUser(null);
    setCurrentView('home');
  };

  const handleCheckoutSubmit = () => {
    const newOrder = {
      id: 'ORD-' + Math.floor(Math.random() * 1000000),
      items: cart,
      total: cartTotal,
      date: new Date().toLocaleDateString(),
      status: 'Pending',
      userEmail: user ? user.email : 'guest@example.com'
    };
    setOrders([newOrder, ...orders]);
    setCart([]);
    setIsCartOpen(false);
    alert('Order placed successfully!');
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
          <button onClick={() => setCurrentView('account')}><UserIcon /></button>
          <button onClick={() => setIsCartOpen(true)} className="relative"><ShoppingBagIcon /></button>
        </div>
      </header>

      <main className="flex-grow flex flex-col">
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
        
        {currentView === 'shop' && (
          <div className="px-8 py-16 max-w-7xl mx-auto w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              {filteredProducts.map(p => (
                <div key={p.id} className="group">
                  <div className="aspect-[4/5] bg-gray-100 mb-6 overflow-hidden"><img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /></div>
                  <h3 className="font-bold">{p.name}</h3>
                  <p className="text-gray-500 text-sm mb-4">${p.price.toFixed(2)}</p>
                  <button onClick={() => addToCart(p)} className="border border-[#111] w-full py-3 text-xs font-bold uppercase">Add to Cart</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'account' && (
          <div className="max-w-5xl mx-auto w-full px-8 py-16">
            {!user ? (
              <div className="max-w-md mx-auto space-y-6">
                {authError && <div className="p-4 bg-red-50 text-red-600 text-xs text-center">{authError}</div>}
                <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-2 py-4 border border-gray-200 uppercase tracking-widest text-xs font-bold"><GoogleIcon /> Login with Google</button>
                <button onClick={handleFacebookLogin} className="w-full flex items-center justify-center gap-2 py-4 bg-[#1877F2] text-white uppercase tracking-widest text-xs font-bold"><FacebookIcon /> Login with Facebook</button>
              </div>
            ) : (
              <div className="border border-gray-200 p-8">
                <h2 className="text-2xl font-black uppercase mb-8">Welcome, {user.displayName}</h2>
                <button onClick={handleLogout} className="border border-[#111] px-6 py-3 text-xs font-bold uppercase">Sign Out</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}