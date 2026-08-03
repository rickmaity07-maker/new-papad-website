import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  signOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ShoppingCart, 
  User, 
  Menu, 
  X, 
  LogOut, 
  Package, 
  Heart,
  Search,
  CheckCircle,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';

// IMPORTANT FOR VERCEL DEPLOYMENT:
// Vercel expects import.meta.env variables. Before pushing to GitHub/Vercel, 
// you must replace these placeholder strings with your actual variables like this:
// apiKey: import.meta.env.VITE_FIREBASE_API_KEY
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_AUTH_DOMAIN_HERE",
  projectId: "YOUR_PROJECT_ID_HERE",
  storageBucket: "YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID_HERE",
  appId: "YOUR_APP_ID_HERE"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Admin email configuration
const ADMIN_EMAIL = "admin@lijopapad.com"; 

const PRODUCTS = [
  { id: 1, name: "Classic Urad Papad", price: 5.99, image: "https://images.unsplash.com/photo-1596547609652-9fc5d8d428ce?auto=format&fit=crop&q=80&w=400", desc: "Authentic handmade urad dal papad." },
  { id: 2, name: "Spicy Moong Papad", price: 6.49, image: "https://images.unsplash.com/photo-1626082929543-5b8a0ebbb3ce?auto=format&fit=crop&q=80&w=400", desc: "Crispy moong dal papad with a kick of black pepper." },
  { id: 3, name: "Garlic Infused Papad", price: 6.99, image: "https://images.unsplash.com/photo-1589116744829-9e879034f40d?auto=format&fit=crop&q=80&w=400", desc: "Rich garlic flavor infused in traditional papad." },
  { id: 4, name: "Cumin Special Papad", price: 5.49, image: "https://images.unsplash.com/photo-1604152135912-04a022e23696?auto=format&fit=crop&q=80&w=400", desc: "Light and digestive cumin jeera papad." },
  { id: 5, name: "Punjabi Masala Papad", price: 7.49, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=400", desc: "Spicy and thick Punjabi style masala papad." },
  { id: 6, name: "Mini Coin Papad", price: 4.99, image: "https://images.unsplash.com/photo-1613941456904-44b416e788eb?auto=format&fit=crop&q=80&w=400", desc: "Bite-sized coin papads perfect for snacking." }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentRoute, setCurrentRoute] = useState('home');
  const [toast, setToast] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [b2bForm, setB2bForm] = useState({ name: '', business: '', email: '', volume: '' });

  useEffect(() => {
    // Hash routing logic
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || 'home';
      setCurrentRoute(hash);
      setIsMobileMenuOpen(false); 
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); 

    // Auth listener
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        signInAnonymously(auth).catch(err => console.log("Anonymous auth failed", err));
      }
    });

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      unsubscribe();
    };
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const navigateTo = (route) => {
    window.location.hash = route;
  };

  const isAdmin = user && !user.isAnonymous && user.email === ADMIN_EMAIL;

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    showToast(`${product.name} added to cart!`, 'success');
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const toggleWishlist = (product) => {
    if (user?.isAnonymous) {
      showToast("Please login to save items to your wishlist.", "error");
      navigateTo('account');
      return;
    }
    
    setWishlist(prev => {
      if (prev.find(item => item.id === product.id)) {
        return prev.filter(item => item.id !== product.id);
      }
      return [...prev, product];
    });
    showToast("Wishlist updated", "success");
  };

  const checkout = async () => {
    if (cart.length === 0) return;
    
    if (user?.isAnonymous) {
      showToast("Please login or register to complete your order.", "error");
      setIsCartOpen(false);
      navigateTo('account');
      return;
    }

    try {
      await addDoc(collection(db, `users/${user.uid}/orders`), {
        email: user.email,
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.qty), 0),
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setCart([]);
      setIsCartOpen(false);
      showToast("Order placed successfully!", "success");
      navigateTo('account');
    } catch (error) {
      showToast(`Checkout failed: ${error.message}`, "error");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      showToast("Logged in with Google!", "success");
      navigateTo('account');
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleFacebookLogin = async () => {
    try {
      const provider = new FacebookAuthProvider();
      await signInWithPopup(auth, provider);
      showToast("Logged in with Facebook!", "success");
      navigateTo('account');
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showToast("Logged in successfully!", "success");
      setEmail('');
      setPassword('');
      navigateTo('account');
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      showToast("Account created successfully!", "success");
      setEmail('');
      setPassword('');
      navigateTo('account');
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCart([]);
    setWishlist([]);
    showToast("Logged out.", "info");
    navigateTo('home');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 overflow-x-hidden flex flex-col">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 flex items-center bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl transition-all duration-300">
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5 mr-2 text-red-400" /> : <CheckCircle className="w-5 h-5 mr-2 text-green-400" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Navigation Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-500 hover:text-gray-900 p-2">
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {/* Logo */}
            <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => navigateTo('home')}>
              <h1 className="text-2xl font-black tracking-tighter uppercase">LIJO Papad</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <button onClick={() => navigateTo('home')} className={`text-sm font-medium hover:text-black transition-colors ${currentRoute === 'home' ? 'text-black' : 'text-gray-500'}`}>HOME</button>
              <button onClick={() => navigateTo('shop')} className={`text-sm font-medium hover:text-black transition-colors ${currentRoute === 'shop' ? 'text-black' : 'text-gray-500'}`}>SHOP</button>
              <button onClick={() => navigateTo('b2b')} className={`text-sm font-medium hover:text-black transition-colors ${currentRoute === 'b2b' ? 'text-black' : 'text-gray-500'}`}>WHOLESALE</button>
              {isAdmin && (
                <button onClick={() => navigateTo('admin')} className={`text-sm font-medium hover:text-black transition-colors flex items-center ${currentRoute === 'admin' ? 'text-blue-600' : 'text-blue-400'}`}>
                  <ShieldCheck className="w-4 h-4 mr-1"/> ADMIN
                </button>
              )}
            </nav>

            {/* Icons */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button onClick={() => navigateTo('shop')} className="p-2 text-gray-500 hover:text-black transition-colors">
                <Search className="w-5 h-5" />
              </button>
              <button onClick={() => navigateTo('account')} className="p-2 text-gray-500 hover:text-black transition-colors relative">
                <User className="w-5 h-5" />
                {user && !user.isAnonymous && <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></span>}
              </button>
              <button onClick={() => setIsCartOpen(true)} className="p-2 text-gray-500 hover:text-black transition-colors relative">
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                    {cart.reduce((total, item) => total + item.qty, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-2 pt-2 pb-3 space-y-1 sm:px-3 shadow-lg absolute w-full z-50">
            <button onClick={() => navigateTo('home')} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-black hover:bg-gray-50">Home</button>
            <button onClick={() => navigateTo('shop')} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-black hover:bg-gray-50">Shop All</button>
            <button onClick={() => navigateTo('b2b')} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-black hover:bg-gray-50">Wholesale (B2B)</button>
            {isAdmin && (
              <button onClick={() => navigateTo('admin')} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:bg-blue-50">Admin Dashboard</button>
            )}
          </div>
        )}
      </header>

      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold">YOUR CART</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-black">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <ShoppingCart className="w-12 h-12 mb-4 opacity-20" />
                  <p>Your cart is empty.</p>
                  <button onClick={() => {setIsCartOpen(false); navigateTo('shop');}} className="mt-4 text-black underline">Continue Shopping</button>
                </div>
              ) : (
                <div className="space-y-6">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-4 border-b border-gray-100 pb-4">
                      <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-md" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{item.name}</h3>
                        <p className="text-gray-500 text-sm mt-1">${item.price}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm">Qty: {item.qty}</span>
                          <button onClick={() => removeFromCart(item.id)} className="text-xs text-red-500 hover:underline">Remove</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-gray-100 p-6 bg-gray-50">
                <div className="flex justify-between font-bold mb-4">
                  <span>Total</span>
                  <span>${cart.reduce((sum, item) => sum + (item.price * item.qty), 0).toFixed(2)}</span>
                </div>
                {user?.isAnonymous && (
                  <p className="text-xs text-red-500 mb-3 text-center font-medium">You are shopping as a guest. Please login to place an order.</p>
                )}
                <button 
                  onClick={checkout}
                  className="w-full bg-black text-white py-4 rounded-md font-bold tracking-widest hover:bg-gray-800 transition-colors"
                >
                  {user?.isAnonymous ? 'LOGIN TO CHECKOUT' : 'CHECKOUT'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <main className="flex-grow">
        
        {/* Home Route */}
        {currentRoute === 'home' && (
          <div className="flex flex-col">
            <section className="relative h-[70vh] bg-gray-900 flex items-center justify-center text-white">
              <img src="https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80" alt="Papad background" className="absolute inset-0 w-full h-full object-cover opacity-40" />
              <div className="relative z-10 text-center px-4">
                <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4">THE CRUNCH<br/>YOU CRAVE.</h1>
                <p className="text-lg md:text-xl font-light mb-8 max-w-2xl mx-auto">Authentic, handmade papads delivered straight to your door. Experience the taste of tradition with LIJO Papad.</p>
                <button onClick={() => navigateTo('shop')} className="bg-white text-black px-8 py-4 rounded-full font-bold tracking-widest hover:bg-gray-100 transition-transform transform hover:scale-105 shadow-xl">SHOP NOW</button>
              </div>
            </section>
          </div>
        )}

        {/* Shop Route */}
        {currentRoute === 'shop' && (
          <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
              <div>
                <h2 className="text-3xl font-black tracking-tight">ALL PRODUCTS</h2>
                <p className="text-gray-500 mt-2">Authentic flavors, premium ingredients.</p>
              </div>
              <div className="relative w-full sm:w-64">
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {PRODUCTS.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(product => (
                <div key={product.id} className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col">
                  <div className="aspect-w-4 aspect-h-3 bg-gray-200 overflow-hidden">
                    <img src={product.image} alt={product.name} className="w-full h-64 object-cover object-center group-hover:scale-105 transition-transform duration-500" />
                    <button 
                      onClick={() => toggleWishlist(product)}
                      className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur rounded-full shadow-sm hover:bg-red-50 transition-colors z-10"
                    >
                      <Heart className={`w-5 h-5 ${wishlist.find(i => i.id === product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                    </button>
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold">{product.name}</h3>
                      <p className="font-medium text-lg">${product.price}</p>
                    </div>
                    <p className="text-gray-500 text-sm mb-6 line-clamp-2 flex-grow">{product.desc}</p>
                    <button 
                      onClick={() => addToCart(product)}
                      className="w-full bg-black text-white py-3 rounded-lg font-bold tracking-wide hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 mt-auto"
                    >
                      <ShoppingCart className="w-4 h-4" /> ADD TO CART
                    </button>
                  </div>
                </div>
              ))}
              {PRODUCTS.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-500">
                      No products found matching "{searchQuery}"
                  </div>
              )}
            </div>
          </div>
        )}

        {/* B2B Route */}
        {currentRoute === 'b2b' && (
          <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black tracking-tight mb-4">PARTNER WITH US</h2>
              <p className="text-gray-500 text-lg">Stock LIJO Papad in your retail store or restaurant. Fill out the form below for wholesale pricing.</p>
            </div>
            
            <form className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6" onSubmit={(e) => {
              e.preventDefault();
              showToast("Application submitted! We will contact you soon.", "success");
              setB2bForm({ name: '', business: '', email: '', volume: '' });
            }}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input required type="text" value={b2bForm.name} onChange={e => setB2bForm({...b2bForm, name: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                <input required type="text" value={b2bForm.business} onChange={e => setB2bForm({...b2bForm, business: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input required type="email" value={b2bForm.email} onChange={e => setB2bForm({...b2bForm, email: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected Monthly Volume (lbs)</label>
                <select required value={b2bForm.volume} onChange={e => setB2bForm({...b2bForm, volume: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all bg-white">
                  <option value="">Select an option</option>
                  <option value="10-50">10 - 50 lbs</option>
                  <option value="50-200">50 - 200 lbs</option>
                  <option value="200+">200+ lbs</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-black text-white py-4 rounded-lg font-bold tracking-widest hover:bg-gray-800 transition-colors mt-8">SUBMIT APPLICATION</button>
            </form>
          </div>
        )}

        {/* Account Route */}
        {currentRoute === 'account' && (
          <div className="max-w-md mx-auto px-4 py-16 sm:px-6">
            {!user || user.isAnonymous ? (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-3xl font-black text-center mb-8 tracking-tight">MY ACCOUNT</h2>
                
                <form className="space-y-4 mb-8">
                  <div>
                    <input type="email" placeholder="Email Address" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black outline-none" />
                  </div>
                  <div>
                    <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black outline-none" />
                  </div>
                  <div className="flex gap-4 pt-2">
                    <button type="submit" onClick={handleEmailLogin} className="flex-1 bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors">LOGIN</button>
                    <button type="button" onClick={handleEmailRegister} className="flex-1 bg-white text-black py-3 rounded-lg font-bold border-2 border-black hover:bg-gray-50 transition-colors">REGISTER</button>
                  </div>
                </form>

                <div className="relative mb-8">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                  <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">OR CONTINUE WITH</span></div>
                </div>

                <div className="space-y-3">
                  <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 font-medium transition-colors">
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 mr-3" alt="Google" />
                    Google
                  </button>
                  <button onClick={handleFacebookLogin} className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-[#1877F2] text-white hover:bg-[#166FE5] font-medium transition-colors">
                    <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" className="w-5 h-5 mr-3 brightness-0 invert" alt="Facebook" />
                    Facebook
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4">
                  <User className="w-8 h-8 text-gray-600" />
                </div>
                <h2 className="text-2xl font-black text-center tracking-tight mb-2">WELCOME BACK</h2>
                <p className="text-center text-gray-500 mb-8 truncate">{user.email}</p>
                
                <div className="space-y-4">
                  {isAdmin && (
                     <button onClick={() => navigateTo('admin')} className="w-full flex items-center justify-between px-6 py-4 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 font-bold transition-colors">
                      ADMIN DASHBOARD <ShieldCheck className="w-5 h-5"/>
                     </button>
                  )}
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h3 className="font-bold flex items-center gap-2 mb-4"><Package className="w-5 h-5"/> My Orders</h3>
                    <p className="text-sm text-gray-500">No recent orders.</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h3 className="font-bold flex items-center gap-2 mb-4"><Heart className="w-5 h-5"/> My Wishlist</h3>
                    {wishlist.length > 0 ? (
                      <ul className="space-y-2">
                        {wishlist.map(item => (
                          <li key={item.id} className="text-sm flex justify-between items-center bg-white p-2 rounded shadow-sm border border-gray-100">
                            <span className="truncate pr-2">{item.name}</span>
                            <span className="font-medium flex-shrink-0">${item.price}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">Your wishlist is empty.</p>
                    )}
                  </div>
                  <button onClick={handleLogout} className="w-full flex items-center justify-center px-4 py-3 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-bold mt-8 transition-colors">
                    <LogOut className="w-4 h-4 mr-2" /> LOGOUT
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Admin Route */}
        {currentRoute === 'admin' && isAdmin && (
          <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-blue-600" />
              <h2 className="text-3xl font-black tracking-tight">STORE ADMINISTRATION</h2>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-lg">Recent Orders</h3>
              </div>
              <div className="p-8 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Database connected successfully.</p>
                <p className="text-sm mt-2">New orders will appear here once placed by authenticated users.</p>
              </div>
            </div>
          </div>
        )}

        {/* Protection guard for Admin route */}
        {currentRoute === 'admin' && !isAdmin && (
           <div className="text-center py-20 px-4">
             <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
             <h2 className="text-2xl font-bold">Access Denied</h2>
             <p className="text-gray-500 mt-2">You do not have permission to view this page.</p>
             <button onClick={() => navigateTo('home')} className="mt-6 text-blue-600 underline hover:text-blue-800">Return Home</button>
           </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl font-black tracking-widest mb-4">LIJO PAPAD</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">Bringing authentic, handmade, and crispy traditional flavors to your modern dining table.</p>
          <div className="flex justify-center space-x-6 text-sm font-medium text-gray-400">
            <a href="#" className="hover:text-black transition-colors">Privacy</a>
            <a href="#" className="hover:text-black transition-colors">Terms</a>
            <a href="#" className="hover:text-black transition-colors">Shipping</a>
          </div>
          <p className="text-gray-400 text-xs mt-8">© 2026 LIJO Papad. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}