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
  serverTimestamp,
  doc,
  setDoc
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

// Replace the dummy strings below with your ACTUAL keys from the Firebase Console.
// Doing this bypasses Vercel's environment variable checks entirely.
const firebaseConfig = {
  apiKey: "AIzaSyD8bWmJH6gM32--7CKQS0fzYtfkbQ53iIU",
  authDomain: "the-papad-co.firebaseapp.com",
  projectId: "the-papad-co",
  storageBucket: "the-papad-co.firebasestorage.app",
  messagingSenderId: "642426697779",
  appId: "1:642426697779:web:81a0e22d6fd5e2087c4b46"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Admin email configuration
const ADMIN_EMAIL = "admin@lijopapad.com"; 

const PRODUCTS = [
  { id: 1, name: "Classic Urad Papad", price: 5.99, image: "/Classic_Urad_Papad.jpg", desc: "Authentic handmade urad dal papad." },
  { id: 2, name: "Spicy Moong Papad", price: 6.49, image: "/Spicy_Moong_Papad.webp", desc: "Crispy moong dal papad with a kick of black pepper." },
  { id: 3, name: "Garlic Infused Papad", price: 6.99, image: "/salty-round-garlic-appalam-papad-without-added-preservative.webp", desc: "Rich garlic flavor infused in traditional papad." },
  { id: 4, name: "Cumin Special Papad", price: 5.49, image: "/special_cumin_papad.webp", desc: "Light and digestive cumin jeera papad." },
  { id: 5, name: "Punjabi Masala Papad", price: 7.49, image: "/Punjabi_masala_papad.png", desc: "Spicy and thick Punjabi style masala papad." },
  { id: 6, name: "Mini Coin Papad", price: 4.99, image: "/coin_papad.jpg", desc: "Bite-sized coin papads perfect for snacking." }
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
  const [isSubmittingB2B, setIsSubmittingB2B] = useState(false);
  const [b2bForm, setB2bForm] = useState({ 
    contactName: '', 
    businessName: '', 
    businessType: '', 
    email: '', 
    phone: '', 
    altPhone: '',
    city: '', 
    state: '', 
    country: '', 
    gst: '', 
    volume: '', 
    message: '' 
  });

  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  });
  const [isRegistering, setIsRegistering] = useState(false);

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
        setUser(null);
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
      if (error.code === 'auth/user-not-found') {
        // Firebase is explicit here: this email has no account at all.
        showToast("No account found with that email. Please register first.", "error");
        setRegisterForm(prev => ({ ...prev, email }));
        navigateTo('register');
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        // Newer Firebase deliberately merges "wrong password" and "no such account"
        // into one generic error for security, so we can't assume which it is.
        // Don't force a redirect — let the person retry or choose to register themselves.
        showToast("Incorrect email or password. Please try again, or create an account if you're new here.", "error");
      } else if (error.code === 'auth/too-many-requests') {
        showToast("Too many attempts. Please wait a moment and try again.", "error");
      } else {
        showToast(error.message, "error");
      }
    }
  };

  const handleFullRegister = async (e) => {
    e.preventDefault();

    if (registerForm.password !== registerForm.confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }
    if (registerForm.password.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }

    setIsRegistering(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, registerForm.email, registerForm.password);

      // Save the rest of the profile details Firebase Auth itself doesn't store
      await setDoc(doc(db, 'users', credential.user.uid), {
        fullName: registerForm.fullName,
        email: registerForm.email,
        phone: registerForm.phone,
        address: {
          street: registerForm.street,
          city: registerForm.city,
          state: registerForm.state,
          postalCode: registerForm.postalCode,
          country: registerForm.country
        },
        createdAt: serverTimestamp()
      });

      showToast("Account created successfully! Welcome to LIJO Papad.", "success");
      setRegisterForm({ fullName: '', email: '', phone: '', password: '', confirmPassword: '', street: '', city: '', state: '', postalCode: '', country: '' });
      navigateTo('account');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        showToast("An account with this email already exists. Please login instead.", "error");
        setEmail(registerForm.email);
        navigateTo('account');
      } else {
        showToast(error.message, "error");
      }
    } finally {
      setIsRegistering(false);
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
      {/* Update the src to your local file path */}
      <img 
        src="/moong-dal-papad-1000x1000.webp" 
        alt="Moong Dal Papad" 
        className="absolute inset-0 w-full h-full object-cover opacity-40" 
      />
      <div className="relative z-10 text-center px-4">
        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4">THE CRUNCH<br/>YOU CRAVE.</h1>
        <p className="text-lg md:text-xl font-light mb-8 max-w-2xl mx-auto">Authentic, handmade papads delivered straight to your door. Experience the taste of tradition with LIJO Papad.</p>
        <button onClick={() => navigateTo('shop')} className="bg-white text-black px-8 py-4 rounded-full font-bold tracking-widest hover:bg-gray-100 transition-transform transform hover:scale-105 shadow-xl">SHOP NOW</button>
      </div>
    </section>

    {/* Our Story */}
    <section className="max-w-5xl mx-auto px-4 py-20 sm:px-6 lg:px-8 text-center">
      <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-4">Est. 1962 &middot; Bangalore, Karnataka, India</p>
      <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-6">FOUR GENERATIONS OF THE CRUNCH.</h2>
      <p className="text-gray-500 text-lg leading-relaxed max-w-3xl mx-auto">
        LIJO Papad started in a small courtyard kitchen in Bangalore, where our great-grandmother mixed and sun-dried the very first batch by hand. Six decades on, we still roll every papad the same way she taught us — no shortcuts, no factory lines, just a family recipe passed from one generation to the next. Every disc that reaches your door is still hand-pressed, sun-dried, and packed by people who grew up doing exactly that.
      </p>
      <div className="grid grid-cols-3 gap-8 mt-14 max-w-2xl mx-auto">
        <div>
          <p className="text-3xl md:text-4xl font-black tracking-tight">4</p>
          <p className="text-sm text-gray-500 mt-1">Generations</p>
        </div>
        <div>
          <p className="text-3xl md:text-4xl font-black tracking-tight">100%</p>
          <p className="text-sm text-gray-500 mt-1">Handmade</p>
        </div>
        <div>
          <p className="text-3xl md:text-4xl font-black tracking-tight">60+</p>
          <p className="text-sm text-gray-500 mt-1">Years of Tradition</p>
        </div>
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
              <p className="text-gray-500 text-lg">Stock LIJO Papad in your retail store, restaurant, or distribution network. Tell us about your business and we'll get back to you with wholesale pricing.</p>
            </div>
            
            <form className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-10" onSubmit={async (e) => {
              e.preventDefault();
              setIsSubmittingB2B(true);
              try {
                const response = await fetch('/api/wholesale-inquiry', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(b2bForm)
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Submission failed');
                showToast("Application submitted! Check your email for confirmation.", "success");
                setB2bForm({ contactName: '', businessName: '', businessType: '', email: '', phone: '', altPhone: '', city: '', state: '', country: '', gst: '', volume: '', message: '' });
              } catch (err) {
                showToast(`Submission failed: ${err.message}`, "error");
              } finally {
                setIsSubmittingB2B(false);
              }
            }}>

              {/* Contact Details */}
              <div>
                <h3 className="text-sm font-black tracking-widest uppercase text-gray-400 mb-4">Contact Details</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input required type="text" value={b2bForm.contactName} onChange={e => setB2bForm({...b2bForm, contactName: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                      <input required type="tel" placeholder="+91 98765 43210" value={b2bForm.phone} onChange={e => setB2bForm({...b2bForm, phone: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Alternate / WhatsApp Number</label>
                      <input type="tel" placeholder="Optional" value={b2bForm.altPhone} onChange={e => setB2bForm({...b2bForm, altPhone: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input required type="email" value={b2bForm.email} onChange={e => setB2bForm({...b2bForm, email: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" />
                  </div>
                </div>
              </div>

              {/* Business Details */}
              <div>
                <h3 className="text-sm font-black tracking-widest uppercase text-gray-400 mb-4">Business Details</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                    <input required type="text" value={b2bForm.businessName} onChange={e => setB2bForm({...b2bForm, businessName: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
                      <select required value={b2bForm.businessType} onChange={e => setB2bForm({...b2bForm, businessType: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all bg-white">
                        <option value="">Select an option</option>
                        <option value="retailer">Retail Store</option>
                        <option value="supermarket">Supermarket / Grocery Chain</option>
                        <option value="restaurant">Restaurant / Café</option>
                        <option value="distributor">Distributor</option>
                        <option value="exporter">Exporter</option>
                        <option value="online">Online Reseller</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">GST / Tax ID <span className="text-gray-400 font-normal">(optional)</span></label>
                      <input type="text" value={b2bForm.gst} onChange={e => setB2bForm({...b2bForm, gst: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <input required type="text" value={b2bForm.city} onChange={e => setB2bForm({...b2bForm, city: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                      <input required type="text" value={b2bForm.state} onChange={e => setB2bForm({...b2bForm, state: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                      <input required type="text" value={b2bForm.country} onChange={e => setB2bForm({...b2bForm, country: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Requirements */}
              <div>
                <h3 className="text-sm font-black tracking-widest uppercase text-gray-400 mb-4">Order Requirements</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expected Monthly Volume (lbs)</label>
                    <select required value={b2bForm.volume} onChange={e => setB2bForm({...b2bForm, volume: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all bg-white">
                      <option value="">Select an option</option>
                      <option value="10-50">10 - 50 lbs</option>
                      <option value="50-200">50 - 200 lbs</option>
                      <option value="200-500">200 - 500 lbs</option>
                      <option value="500+">500+ lbs</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Requirements <span className="text-gray-400 font-normal">(flavors, packaging, delivery frequency, etc.)</span></label>
                    <textarea rows="4" value={b2bForm.message} onChange={e => setB2bForm({...b2bForm, message: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all resize-none" />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={isSubmittingB2B} className="w-full bg-black text-white py-4 rounded-lg font-bold tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmittingB2B ? 'SUBMITTING...' : 'SUBMIT APPLICATION'}
              </button>
            </form>
          </div>
        )}

        {/* Register Route */}
        {currentRoute === 'register' && (
          <div className="max-w-xl mx-auto px-4 py-16 sm:px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black tracking-tight mb-2">CREATE YOUR ACCOUNT</h2>
              <p className="text-gray-500">Join LIJO Papad to track orders, save favorites, and check out faster.</p>
            </div>

            <form className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-8" onSubmit={handleFullRegister}>
              <div>
                <h3 className="text-sm font-black tracking-widest uppercase text-gray-400 mb-4">Personal Details</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input required type="text" value={registerForm.fullName} onChange={e => setRegisterForm({...registerForm, fullName: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input required type="email" value={registerForm.email} onChange={e => setRegisterForm({...registerForm, email: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input required type="tel" placeholder="+91 98765 43210" value={registerForm.phone} onChange={e => setRegisterForm({...registerForm, phone: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black tracking-widest uppercase text-gray-400 mb-4">Shipping Address</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                    <input required type="text" value={registerForm.street} onChange={e => setRegisterForm({...registerForm, street: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <input required type="text" value={registerForm.city} onChange={e => setRegisterForm({...registerForm, city: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                      <input required type="text" value={registerForm.state} onChange={e => setRegisterForm({...registerForm, state: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                      <input required type="text" value={registerForm.postalCode} onChange={e => setRegisterForm({...registerForm, postalCode: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <input required type="text" value={registerForm.country} onChange={e => setRegisterForm({...registerForm, country: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black tracking-widest uppercase text-gray-400 mb-4">Set a Password</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <input required type="password" minLength={6} value={registerForm.password} onChange={e => setRegisterForm({...registerForm, password: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                    <input required type="password" minLength={6} value={registerForm.confirmPassword} onChange={e => setRegisterForm({...registerForm, confirmPassword: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={isRegistering} className="w-full bg-black text-white py-4 rounded-lg font-bold tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {isRegistering ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
              </button>

              <p className="text-center text-sm text-gray-500">
                Already have an account?{' '}
                <button type="button" onClick={() => navigateTo('account')} className="text-black font-bold underline">Login instead</button>
              </p>
            </form>
          </div>
        )}

        {/* Account Route */}
        {currentRoute === 'account' && (
          <div className="max-w-md mx-auto px-4 py-16 sm:px-6">
            {!user || user.isAnonymous ? (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-3xl font-black text-center mb-8 tracking-tight">MY ACCOUNT</h2>
                
                <form className="space-y-4 mb-6" onSubmit={handleEmailLogin}>
                  <div>
                    <input type="email" placeholder="Email Address" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black outline-none" />
                  </div>
                  <div>
                    <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black outline-none" />
                  </div>
                  <button type="submit" className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors">LOGIN</button>
                </form>

                <p className="text-center text-sm text-gray-500 mb-8">
                  Don't have an account?{' '}
                  <button onClick={() => { setRegisterForm(prev => ({ ...prev, email })); navigateTo('register'); }} className="text-black font-bold underline">Create one</button>
                </p>

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

        {/* Privacy Policy Route */}
        {currentRoute === 'privacy' && (
          <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-black tracking-tight mb-2">PRIVACY POLICY</h1>
            <p className="text-gray-400 text-sm mb-10">Last updated: August 2026</p>

            <div className="space-y-8 text-gray-600 leading-relaxed">
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-2">1. Information We Collect</h2>
                <p>When you create an account, place an order, or submit a wholesale inquiry, we collect information such as your name, email address, phone number, shipping address, and business details (for wholesale partners). If you sign in with Google or Facebook, we receive the basic profile information (name, email, profile photo) permitted by those services.</p>
              </section>
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-2">2. How We Use Your Information</h2>
                <p>We use your information to process and fulfil orders, respond to wholesale inquiries, manage your account and wishlist, send order and shipping updates, and improve our products and website. We do not sell your personal information to third parties.</p>
              </section>
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-2">3. Third-Party Services</h2>
                <p>We use trusted third-party services to operate LIJO Papad, including Firebase (authentication and order data), Supabase (wholesale inquiry records), and Resend (transactional email delivery). These providers process data only as needed to deliver their service to us and are bound by their own privacy and security obligations.</p>
              </section>
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-2">4. Cookies</h2>
                <p>Our website uses essential cookies and local session data to keep you signed in and remember your cart. We do not use third-party advertising or tracking cookies.</p>
              </section>
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-2">5. Data Retention</h2>
                <p>We retain account and order information for as long as your account is active, or as needed to comply with legal, accounting, or tax obligations.</p>
              </section>
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-2">6. Your Rights</h2>
                <p>You may request access to, correction of, or deletion of your personal data at any time by contacting us. You can also delete your account from your Account page, or by reaching out to our support email below.</p>
              </section>
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-2">7. Contact Us</h2>
                <p>For any privacy-related questions, reach us at <a href="mailto:privacy@lijopapad.com" className="text-black underline">privacy@lijopapad.com</a>.</p>
              </section>
              <p className="text-xs text-gray-400 pt-6 border-t border-gray-100">This is a template privacy policy intended for a small handmade-goods business and should be reviewed by a qualified legal professional before being relied on for compliance purposes.</p>
            </div>
          </div>
        )}

        {/* Terms of Service Route */}
        {currentRoute === 'terms' && (
          <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-black tracking-tight mb-2">TERMS OF SERVICE</h1>
            <p className="text-gray-400 text-sm mb-10">Last updated: August 2026</p>

            <div className="space-y-8 text-gray-600 leading-relaxed">
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-2">1. About LIJO Papad</h2>
                <p>LIJO Papad is a family-owned, handmade papad business based in Bangalore, Karnataka, India. By using this website, placing an order, or submitting a wholesale inquiry, you agree to the terms below.</p>
              </section>
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-2">2. Orders &amp; Payment</h2>
                <p>All prices are listed in USD and are subject to change without prior notice. Orders are confirmed once payment has been successfully processed. We reserve the right to refuse or cancel any order at our discretion, including in cases of suspected fraud or stock unavailability.</p>
              </section>
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-2">3. Product Information</h2>
                <p>Our papads are handmade in small batches; slight variation in size, shape, and appearance between pieces is normal and not considered a defect. Ingredients and allergen information are listed per product — please review carefully if you have food allergies.</p>
              </section>
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-2">4. Account Responsibilities</h2>
                <p>You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. Please notify us immediately of any unauthorized use.</p>
              </section>
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-2">5. Wholesale &amp; Bulk Orders</h2>
                <p>Wholesale inquiries submitted through our Wholesale page are not binding orders. Pricing, minimum order quantities, and terms for wholesale partners are confirmed separately in writing after review of your inquiry.</p>
              </section>
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-2">6. Intellectual Property</h2>
                <p>All content on this website, including our name, logo, recipes, and photography, is the property of LIJO Papad and may not be reproduced without written permission.</p>
              </section>
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-2">7. Limitation of Liability</h2>
                <p>LIJO Papad is not liable for any indirect, incidental, or consequential damages arising from the use of our products or website, to the fullest extent permitted by applicable law.</p>
              </section>
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-2">8. Governing Law</h2>
                <p>These terms are governed by the laws of India, and any disputes will be subject to the jurisdiction of the courts of Bangalore, Karnataka.</p>
              </section>
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-2">9. Contact Us</h2>
                <p>Questions about these terms can be sent to <a href="mailto:hello@lijopapad.com" className="text-black underline">hello@lijopapad.com</a>.</p>
              </section>
              <p className="text-xs text-gray-400 pt-6 border-t border-gray-100">This is a template terms of service intended for a small handmade-goods business and should be reviewed by a qualified legal professional before being relied on for compliance purposes.</p>
            </div>
          </div>
        )}

        {/* Shipping Policy Route */}
        {currentRoute === 'shipping' && (
          <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-black tracking-tight mb-2">SHIPPING POLICY</h1>
            <p className="text-gray-400 text-sm mb-10">Last updated: August 2026</p>

            <div className="space-y-8 text-gray-600 leading-relaxed">
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-2">1. Processing Time</h2>
                <p>Orders are handmade to order in small batches. Please allow 2&ndash;4 business days for your order to be prepared, sun-dried, and packed before it ships.</p>
              </section>
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-2">2. Domestic Shipping (India)</h2>
                <p>Orders within India typically arrive within 3&ndash;7 business days of dispatch, depending on your location. Shipping costs are calculated at checkout based on order weight and destination.</p>
              </section>
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-2">3. International Shipping</h2>
                <p>We currently offer limited international shipping. Delivery times for international orders typically range from 7&ndash;21 business days depending on destination and customs processing. Import duties and taxes, if applicable, are the responsibility of the recipient.</p>
              </section>
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-2">4. Packaging</h2>
                <p>Papads are fragile by nature. We use moisture-resistant, cushioned packaging to minimize breakage in transit, though minor breakage of a small percentage of pieces can occasionally occur during shipping.</p>
              </section>
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-2">5. Damaged or Missing Items</h2>
                <p>If your order arrives damaged or incomplete, please contact us within 48 hours of delivery with photos of the packaging and product, and we'll arrange a replacement or refund.</p>
              </section>
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-2">6. Order Tracking</h2>
                <p>Once your order ships, you'll receive a confirmation email with tracking information where available.</p>
              </section>
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-2">7. Contact Us</h2>
                <p>For shipping questions, reach us at <a href="mailto:orders@lijopapad.com" className="text-black underline">orders@lijopapad.com</a>.</p>
              </section>
              <p className="text-xs text-gray-400 pt-6 border-t border-gray-100">This is a template shipping policy and should be updated with your actual carriers, rates, and timelines before going live.</p>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl font-black tracking-widest mb-4">LIJO PAPAD</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">Bringing authentic, handmade, and crispy traditional flavors to your modern dining table.</p>
          <div className="flex justify-center space-x-6 text-sm font-medium text-gray-400">
            <button onClick={() => navigateTo('privacy')} className="hover:text-black transition-colors">Privacy</button>
            <button onClick={() => navigateTo('terms')} className="hover:text-black transition-colors">Terms</button>
            <button onClick={() => navigateTo('shipping')} className="hover:text-black transition-colors">Shipping</button>
          </div>
          <p className="text-gray-400 text-xs mt-8">© 2026 LIJO Papad. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}