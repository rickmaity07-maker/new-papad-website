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
  setDoc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  updateDoc,
  collectionGroup
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
  ShieldCheck,
  Plus,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
  Upload
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

// Admin email — whoever signs in with this email gets full admin access.
// Set VITE_ADMIN_EMAIL in your environment variables to your real email.
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "admin@lijopapad.com";

// Used only if Firestore has no products yet (first run) — the admin panel
// takes over from here once you add/edit products through it.
const DEFAULT_PRODUCTS = [
  { name: "Classic Urad Papad", price: 5.99, image: "/Classic_Urad_Papad.jpg", desc: "Authentic handmade urad dal papad." },
  { name: "Spicy Moong Papad", price: 6.49, image: "/Spicy_Moong_Papad.webp", desc: "Crispy moong dal papad with a kick of black pepper." },
  { name: "Garlic Infused Papad", price: 6.99, image: "/salty-round-garlic-appalam-papad-without-added-preservative.webp", desc: "Rich garlic flavor infused in traditional papad." },
  { name: "Cumin Special Papad", price: 5.49, image: "/special_cumin_papad.webp", desc: "Light and digestive cumin jeera papad." },
  { name: "Punjabi Masala Papad", price: 7.49, image: "/Punjabi_masala_papad.png", desc: "Spicy and thick Punjabi style masala papad." },
  { name: "Mini Coin Papad", price: 4.99, image: "/coin_papad.jpg", desc: "Bite-sized coin papads perfect for snacking." }
];

const DEFAULT_HOME_CONTENT = {
  heroImage: "/moong-dal-papad-1000x1000.webp",
  heroTitleLine1: "THE CRUNCH",
  heroTitleLine2: "YOU CRAVE.",
  heroSubtitle: "Authentic, handmade papads delivered straight to your door. Experience the taste of tradition with LIJO Papad.",
  storyEyebrow: "Est. 1962 · Bangalore, Karnataka, India",
  storyHeading: "FOUR GENERATIONS OF THE CRUNCH.",
  storyText: "LIJO Papad started in a small courtyard kitchen in Bangalore, where our great-grandmother mixed and sun-dried the very first batch by hand. Six decades on, we still roll every papad the same way she taught us — no shortcuts, no factory lines, just a family recipe passed from one generation to the next. Every disc that reaches your door is still hand-pressed, sun-dried, and packed by people who grew up doing exactly that.",
  stat1Value: "4", stat1Label: "Generations",
  stat2Value: "100%", stat2Label: "Handmade",
  stat3Value: "60+", stat3Label: "Years of Tradition"
};

const DEFAULT_WHOLESALE_FIELDS = [
  { id: 'contactName', label: 'Full Name', type: 'text', required: true, section: 'Contact Details', order: 0 },
  { id: 'phone', label: 'Contact Number', type: 'tel', required: true, section: 'Contact Details', order: 1 },
  { id: 'altPhone', label: 'Alternate / WhatsApp Number', type: 'tel', required: false, section: 'Contact Details', order: 2 },
  { id: 'email', label: 'Email Address', type: 'email', required: true, section: 'Contact Details', order: 3 },
  { id: 'businessName', label: 'Business Name', type: 'text', required: true, section: 'Business Details', order: 4 },
  { id: 'businessType', label: 'Business Type', type: 'select', required: true, section: 'Business Details', order: 5, options: ['Retail Store', 'Supermarket / Grocery Chain', 'Restaurant / Café', 'Distributor', 'Exporter', 'Online Reseller', 'Other'] },
  { id: 'gst', label: 'GST / Tax ID', type: 'text', required: false, section: 'Business Details', order: 6 },
  { id: 'city', label: 'City', type: 'text', required: true, section: 'Business Details', order: 7 },
  { id: 'state', label: 'State', type: 'text', required: true, section: 'Business Details', order: 8 },
  { id: 'country', label: 'Country', type: 'text', required: true, section: 'Business Details', order: 9 },
  { id: 'volume', label: 'Expected Monthly Volume (lbs)', type: 'select', required: true, section: 'Order Requirements', order: 10, options: ['10 - 50 lbs', '50 - 200 lbs', '200 - 500 lbs', '500+ lbs'] },
  { id: 'message', label: 'Additional Requirements', type: 'textarea', required: false, section: 'Order Requirements', order: 11 }
];

const COUNTRIES = [
  "India", "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "United Arab Emirates",
  "Singapore", "Nepal", "Bangladesh", "Sri Lanka", "Pakistan", "Malaysia", "New Zealand", "Netherlands", "Other"
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
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [checkoutAddress, setCheckoutAddress] = useState({ street: '', city: '', state: '', postalCode: '', country: '' });
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Dynamic content — all live-synced from Firestore so admin edits show up instantly
  const [products, setProducts] = useState(DEFAULT_PRODUCTS.map((p, i) => ({ ...p, id: `default-${i}` })));
  const [homeContent, setHomeContent] = useState(DEFAULT_HOME_CONTENT);
  const [wholesaleFields, setWholesaleFields] = useState(DEFAULT_WHOLESALE_FIELDS);
  const [adminOrders, setAdminOrders] = useState([]);
  const [adminTab, setAdminTab] = useState('products');

  // Product editor state
  const [editingProduct, setEditingProduct] = useState(null); // null = not editing, {} = new, {...} = existing
  const [productImageFile, setProductImageFile] = useState(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Home content editor state
  const [homeDraft, setHomeDraft] = useState(DEFAULT_HOME_CONTENT);
  const [heroImageFile, setHeroImageFile] = useState(null);
  const [isSavingHome, setIsSavingHome] = useState(false);

  // Wholesale field editor state
  const [newFieldDraft, setNewFieldDraft] = useState({ label: '', type: 'text', required: false, section: 'Additional Details', options: '' });
  const [wholesaleFormData, setWholesaleFormData] = useState({});

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

  // Prefill checkout address from the user's saved profile, if they have one
  useEffect(() => {
    const loadProfileAddress = async () => {
      if (!user || user.isAnonymous) return;
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists() && snap.data().address) {
          setCheckoutAddress(snap.data().address);
        }
      } catch (err) {
        console.log('Could not load saved address', err);
      }
    };
    loadProfileAddress();
  }, [user]);

  // Live-sync products from Firestore — falls back to defaults if the collection is empty
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snap) => {
      if (!snap.empty) {
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    }, (err) => console.log('Products sync error (using defaults):', err.message));
    return () => unsub();
  }, []);

  // Live-sync home page content from Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'siteContent', 'home'), (snap) => {
      if (snap.exists()) {
        const data = { ...DEFAULT_HOME_CONTENT, ...snap.data() };
        setHomeContent(data);
        setHomeDraft(data);
      }
    }, (err) => console.log('Home content sync error (using defaults):', err.message));
    return () => unsub();
  }, []);

  // Live-sync wholesale form field definitions from Firestore
  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'wholesaleFields'), orderBy('order')), (snap) => {
      if (!snap.empty) {
        setWholesaleFields(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    }, (err) => console.log('Wholesale fields sync error (using defaults):', err.message));
    return () => unsub();
  }, []);

  // Admin-only: live-sync every customer order across all accounts
  useEffect(() => {
    if (!user || user.isAnonymous || user.email !== ADMIN_EMAIL) return;
    const unsub = onSnapshot(query(collectionGroup(db, 'orders'), orderBy('createdAt', 'desc')), (snap) => {
      setAdminOrders(snap.docs.map(d => ({ id: d.id, path: d.ref.path, ...d.data() })));
    }, (err) => console.log('Admin orders sync error:', err.message));
    return () => unsub();
  }, [user]);

  // Auto-detect country for the registration form via IP geolocation (best-effort, non-blocking)
  useEffect(() => {
    if (currentRoute !== 'register' || registerForm.country) return;
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data?.country_name) {
          setRegisterForm(prev => prev.country ? prev : { ...prev, country: data.country_name });
        }
      })
      .catch(() => {}); // silent — country dropdown still works manually if this fails
  }, [currentRoute]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getPasswordStrength = (pw) => {
    if (!pw) return { score: 0, label: '', color: 'bg-gray-200' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { score: 2, label: 'Medium', color: 'bg-yellow-500' };
    return { score: 3, label: 'Strong', color: 'bg-green-500' };
  };

  const uploadImage = async (file, folder) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error("Image upload isn't configured yet — add your Cloudinary settings to environment variables.");
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Image upload failed');

    return data.secure_url;
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

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if (user?.isAnonymous) {
      showToast("Please login or register to complete your order.", "error");
      setIsCartOpen(false);
      navigateTo('account');
      return;
    }

    const { street, city, state, postalCode, country } = checkoutAddress;
    if (!street || !city || !state || !postalCode || !country) {
      showToast("Please fill in your full shipping address.", "error");
      return;
    }

    const amount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    setIsPlacingOrder(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error("Couldn't load payment gateway. Check your connection and try again.");

      // 1. Create a Razorpay order server-side
      const orderRes = await fetch('/api/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Could not start payment');

      // 2. Open the Razorpay checkout modal
      const razorpay = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'LIJO Papad',
        description: `Order for ${cart.reduce((n, i) => n + i.qty, 0)} item(s)`,
        order_id: orderData.id,
        prefill: {
          name: user.displayName || '',
          email: user.email || '',
        },
        theme: { color: '#000000' },
        handler: async (response) => {
          // 3. Verify the payment server-side and save the order
          try {
            const verifyRes = await fetch('/api/verify-razorpay-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                uid: user.uid,
                email: user.email,
                items: cart,
                total: amount,
                shippingAddress: checkoutAddress
              })
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || 'Payment verification failed');

            setCart([]);
            setIsCartOpen(false);
            showToast("Order placed successfully! Check your email for confirmation.", "success");
            navigateTo('account');
          } catch (err) {
            showToast(`Payment received, but order saving failed: ${err.message}. Please contact us.`, "error");
          } finally {
            setIsPlacingOrder(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsPlacingOrder(false);
          }
        }
      });

      razorpay.on('payment.failed', (response) => {
        showToast(`Payment failed: ${response.error.description}`, "error");
        setIsPlacingOrder(false);
      });

      razorpay.open();
    } catch (error) {
      showToast(error.message, "error");
      setIsPlacingOrder(false);
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
    if (registerForm.password.length < 8) {
      showToast("Password must be at least 8 characters.", "error");
      return;
    }

    setIsRegistering(true);

    // Step 1: create the actual account. This is the source of truth for login.
    let credential;
    try {
      credential = await createUserWithEmailAndPassword(auth, registerForm.email, registerForm.password);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        showToast("An account with this email already exists. Please login instead.", "error");
        setEmail(registerForm.email);
        navigateTo('account');
      } else {
        showToast(error.message, "error");
      }
      setIsRegistering(false);
      return;
    }

    // Step 2: save the extra profile details. If this fails, the account still
    // exists and can still log in — we don't want to leave the person confused
    // about whether registration "worked."
    try {
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
    } catch (profileError) {
      console.error('Profile save failed:', profileError);
      showToast("Your account was created, but we couldn't save your profile details. You're still logged in — you can try updating your details later.", "info");
    }

    setRegisterForm({ fullName: '', email: '', phone: '', password: '', confirmPassword: '', street: '', city: '', state: '', postalCode: '', country: '' });
    navigateTo('account');
    setIsRegistering(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCart([]);
    setWishlist([]);
    showToast("Logged out.", "info");
    navigateTo('home');
  };

  // ---- Admin: Product management ----
  const saveProduct = async (e) => {
    e.preventDefault();
    setIsSavingProduct(true);
    try {
      let imageUrl = editingProduct.image || '';
      if (productImageFile) {
        imageUrl = await uploadImage(productImageFile, 'products');
      }
      const payload = {
        name: editingProduct.name,
        price: parseFloat(editingProduct.price),
        desc: editingProduct.desc || '',
        image: imageUrl
      };
      if (editingProduct.id) {
        await updateDoc(doc(db, 'products', editingProduct.id), payload);
        showToast("Product updated.", "success");
      } else {
        await addDoc(collection(db, 'products'), payload);
        showToast("Product added.", "success");
      }
      setEditingProduct(null);
      setProductImageFile(null);
    } catch (err) {
      showToast(`Could not save product: ${err.message}`, "error");
    } finally {
      setIsSavingProduct(false);
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'products', productId));
      showToast("Product deleted.", "success");
    } catch (err) {
      showToast(`Could not delete product: ${err.message}`, "error");
    }
  };

  // ---- Admin: Home page content management ----
  const saveHomeContent = async (e) => {
    e.preventDefault();
    setIsSavingHome(true);
    try {
      let payload = { ...homeDraft };
      if (heroImageFile) {
        payload.heroImage = await uploadImage(heroImageFile, 'site-content');
      }
      await setDoc(doc(db, 'siteContent', 'home'), payload);
      showToast("Home page updated.", "success");
      setHeroImageFile(null);
    } catch (err) {
      showToast(`Could not save home content: ${err.message}`, "error");
    } finally {
      setIsSavingHome(false);
    }
  };

  // ---- Admin: Wholesale form field management ----
  const addWholesaleField = async () => {
    if (!newFieldDraft.label.trim()) {
      showToast("Field label is required.", "error");
      return;
    }
    try {
      const fieldId = newFieldDraft.label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      await setDoc(doc(db, 'wholesaleFields', fieldId), {
        label: newFieldDraft.label.trim(),
        type: newFieldDraft.type,
        required: newFieldDraft.required,
        section: newFieldDraft.section || 'Additional Details',
        order: wholesaleFields.length,
        options: newFieldDraft.type === 'select' ? newFieldDraft.options.split(',').map(o => o.trim()).filter(Boolean) : []
      });
      showToast("Field added to wholesale form.", "success");
      setNewFieldDraft({ label: '', type: 'text', required: false, section: 'Additional Details', options: '' });
    } catch (err) {
      showToast(`Could not add field: ${err.message}`, "error");
    }
  };

  const removeWholesaleField = async (fieldId) => {
    if (!window.confirm('Remove this field from the wholesale form?')) return;
    try {
      await deleteDoc(doc(db, 'wholesaleFields', fieldId));
      showToast("Field removed.", "success");
    } catch (err) {
      showToast(`Could not remove field: ${err.message}`, "error");
    }
  };

  const updateOrderStatus = async (orderPath, newStatus) => {
    try {
      await updateDoc(doc(db, orderPath), { status: newStatus });
      showToast("Order status updated.", "success");
    } catch (err) {
      showToast(`Could not update order: ${err.message}`, "error");
    }
  };

  const handleWholesaleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingB2B(true);
    try {
      const response = await fetch('/api/wholesale-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: wholesaleFields, formData: wholesaleFormData })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Submission failed');
      showToast("Application submitted! Check your email for confirmation.", "success");
      setWholesaleFormData({});
    } catch (err) {
      showToast(`Submission failed: ${err.message}`, "error");
    } finally {
      setIsSubmittingB2B(false);
    }
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
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] transition-opacity" onClick={() => setIsCartOpen(false)}></div>
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
              <div className="border-t border-gray-100 p-6 bg-gray-50 space-y-4">
                {!user?.isAnonymous && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-black tracking-widest uppercase text-gray-400">Shipping Address</h3>
                    <input type="text" placeholder="Street Address" value={checkoutAddress.street} onChange={e => setCheckoutAddress({...checkoutAddress, street: e.target.value})} className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-black outline-none" />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="City" value={checkoutAddress.city} onChange={e => setCheckoutAddress({...checkoutAddress, city: e.target.value})} className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-black outline-none" />
                      <input type="text" placeholder="State" value={checkoutAddress.state} onChange={e => setCheckoutAddress({...checkoutAddress, state: e.target.value})} className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-black outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="Postal Code" value={checkoutAddress.postalCode} onChange={e => setCheckoutAddress({...checkoutAddress, postalCode: e.target.value})} className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-black outline-none" />
                      <input type="text" placeholder="Country" value={checkoutAddress.country} onChange={e => setCheckoutAddress({...checkoutAddress, country: e.target.value})} className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-black outline-none" />
                    </div>
                  </div>
                )}
                <div className="flex justify-between font-bold pt-2">
                  <span>Total</span>
                  <span>${cart.reduce((sum, item) => sum + (item.price * item.qty), 0).toFixed(2)}</span>
                </div>
                {user?.isAnonymous && (
                  <p className="text-xs text-red-500 text-center font-medium">You are shopping as a guest. Please login to place an order.</p>
                )}
                <button 
                  onClick={handleCheckout}
                  disabled={isPlacingOrder}
                  className="w-full bg-black text-white py-4 rounded-md font-bold tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {user?.isAnonymous ? 'LOGIN TO CHECKOUT' : isPlacingOrder ? 'PROCESSING...' : 'PAY & PLACE ORDER'}
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
      <img 
        src={homeContent.heroImage} 
        alt="Hero" 
        className="absolute inset-0 w-full h-full object-cover opacity-40" 
      />
      <div className="relative z-10 text-center px-4">
        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4">{homeContent.heroTitleLine1}<br/>{homeContent.heroTitleLine2}</h1>
        <p className="text-lg md:text-xl font-light mb-8 max-w-2xl mx-auto">{homeContent.heroSubtitle}</p>
        <button onClick={() => navigateTo('shop')} className="bg-white text-black px-8 py-4 rounded-full font-bold tracking-widest hover:bg-gray-100 transition-transform transform hover:scale-105 shadow-xl">SHOP NOW</button>
      </div>
    </section>

    {/* Our Story */}
    <section className="max-w-5xl mx-auto px-4 py-20 sm:px-6 lg:px-8 text-center">
      <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-4">{homeContent.storyEyebrow}</p>
      <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-6">{homeContent.storyHeading}</h2>
      <p className="text-gray-500 text-lg leading-relaxed max-w-3xl mx-auto">
        {homeContent.storyText}
      </p>
      <div className="grid grid-cols-3 gap-8 mt-14 max-w-2xl mx-auto">
        <div>
          <p className="text-3xl md:text-4xl font-black tracking-tight">{homeContent.stat1Value}</p>
          <p className="text-sm text-gray-500 mt-1">{homeContent.stat1Label}</p>
        </div>
        <div>
          <p className="text-3xl md:text-4xl font-black tracking-tight">{homeContent.stat2Value}</p>
          <p className="text-sm text-gray-500 mt-1">{homeContent.stat2Label}</p>
        </div>
        <div>
          <p className="text-3xl md:text-4xl font-black tracking-tight">{homeContent.stat3Value}</p>
          <p className="text-sm text-gray-500 mt-1">{homeContent.stat3Label}</p>
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
              {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(product => (
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
              {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
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
            
            <form className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-10" onSubmit={handleWholesaleSubmit}>
              {Object.entries(
                wholesaleFields.reduce((sections, field) => {
                  const section = field.section || 'Additional Details';
                  if (!sections[section]) sections[section] = [];
                  sections[section].push(field);
                  return sections;
                }, {})
              ).map(([sectionName, fields]) => (
                <div key={sectionName}>
                  <h3 className="text-sm font-black tracking-widest uppercase text-gray-400 mb-4">{sectionName}</h3>
                  <div className="space-y-6">
                    {fields.map(field => (
                      <div key={field.id}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {field.label} {!field.required && <span className="text-gray-400 font-normal">(optional)</span>}
                        </label>
                        {field.type === 'select' ? (
                          <select
                            required={field.required}
                            value={wholesaleFormData[field.id] || ''}
                            onChange={e => setWholesaleFormData({ ...wholesaleFormData, [field.id]: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all bg-white"
                          >
                            <option value="">Select an option</option>
                            {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : field.type === 'textarea' ? (
                          <textarea
                            rows="4"
                            required={field.required}
                            value={wholesaleFormData[field.id] || ''}
                            onChange={e => setWholesaleFormData({ ...wholesaleFormData, [field.id]: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all resize-none"
                          />
                        ) : (
                          <input
                            type={field.type}
                            required={field.required}
                            placeholder={field.type === 'tel' ? '+91 98765 43210' : ''}
                            value={wholesaleFormData[field.id] || ''}
                            onChange={e => setWholesaleFormData({ ...wholesaleFormData, [field.id]: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

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
                    <select required value={registerForm.country} onChange={e => setRegisterForm({...registerForm, country: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all bg-white">
                      <option value="">Select your country</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <p className="text-xs text-gray-400 mt-1.5">Auto-detected based on your location — change it if it's wrong.</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black tracking-widest uppercase text-gray-400 mb-4">Set a Password</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <div className="relative">
                      <input required type={showRegPassword ? 'text' : 'password'} minLength={8} value={registerForm.password} onChange={e => setRegisterForm({...registerForm, password: e.target.value})} className="w-full px-4 py-3 pr-11 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" />
                      <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {registerForm.password && (() => {
                      const strength = getPasswordStrength(registerForm.password);
                      return (
                        <div className="mt-2">
                          <div className="flex gap-1">
                            {[1, 2, 3].map(i => (
                              <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= strength.score ? strength.color : 'bg-gray-200'}`}></div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{strength.label} — at least 8 characters, mix in a number, capital letter, or symbol for a stronger password.</p>
                        </div>
                      );
                    })()}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                    <div className="relative">
                      <input required type={showRegConfirmPassword ? 'text' : 'password'} minLength={8} value={registerForm.confirmPassword} onChange={e => setRegisterForm({...registerForm, confirmPassword: e.target.value})} className="w-full px-4 py-3 pr-11 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" />
                      <button type="button" onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                        {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
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

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200">
              {[
                { id: 'products', label: 'Products' },
                { id: 'orders', label: 'Orders' },
                { id: 'home', label: 'Home Page' },
                { id: 'wholesale', label: 'Wholesale Form' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setAdminTab(tab.id)}
                  className={`px-4 py-3 text-sm font-bold tracking-wide border-b-2 transition-colors ${adminTab === tab.id ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ---- PRODUCTS TAB ---- */}
            {adminTab === 'products' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">Manage Products</h3>
                  <button onClick={() => { setEditingProduct({ name: '', price: '', desc: '', image: '' }); setProductImageFile(null); }} className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-800 transition-colors">
                    <Plus className="w-4 h-4" /> Add Product
                  </button>
                </div>

                {editingProduct && (
                  <form onSubmit={saveProduct} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 space-y-4">
                    <h4 className="font-bold text-lg">{editingProduct.id ? 'Edit Product' : 'New Product'}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                        <input required type="text" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                        <input required type="number" step="0.01" min="0" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea rows="2" value={editingProduct.desc} onChange={e => setEditingProduct({...editingProduct, desc: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black outline-none resize-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                      <div className="flex items-center gap-4">
                        {(productImageFile ? URL.createObjectURL(productImageFile) : editingProduct.image) && (
                          <img src={productImageFile ? URL.createObjectURL(productImageFile) : editingProduct.image} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                        )}
                        <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-sm font-medium">
                          <Upload className="w-4 h-4" /> {productImageFile ? productImageFile.name : 'Upload Image'}
                          <input type="file" accept="image/*" className="hidden" onChange={e => setProductImageFile(e.target.files[0])} />
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="submit" disabled={isSavingProduct} className="bg-black text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50">
                        {isSavingProduct ? 'Saving...' : 'Save Product'}
                      </button>
                      <button type="button" onClick={() => { setEditingProduct(null); setProductImageFile(null); }} className="px-6 py-2.5 rounded-lg font-bold text-sm border border-gray-300 hover:bg-gray-50 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map(product => (
                    <div key={product.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                      <img src={product.image} alt={product.name} className="w-full h-40 object-cover" />
                      <div className="p-4 flex-1 flex flex-col">
                        <h4 className="font-bold">{product.name}</h4>
                        <p className="text-sm text-gray-500 mt-1 flex-1">${product.price}</p>
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => { setEditingProduct(product); setProductImageFile(null); }} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors">
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button onClick={() => deleteProduct(product.id)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ---- ORDERS TAB ---- */}
            {adminTab === 'orders' && (
              <div>
                <h3 className="text-xl font-bold mb-6">Customer Orders</h3>
                {adminOrders.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No orders yet. New orders will appear here as they're placed.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {adminOrders.map(order => (
                      <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                          <div>
                            <p className="font-bold">{order.email}</p>
                            <p className="text-xs text-gray-400 mt-1">Order ID: {order.id}</p>
                            {order.paymentId && <p className="text-xs text-gray-400">Payment ID: {order.paymentId}</p>}
                            <p className="text-xs text-gray-400">Mode of Payment: {order.paymentId ? 'Razorpay (Online)' : 'N/A'}</p>
                          </div>
                          <select value={order.status || 'pending'} onChange={e => updateOrderStatus(order.path, e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium bg-white">
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                        <div className="border-t border-gray-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Items</p>
                            {(order.items || []).map((item, i) => (
                              <p key={i} className="text-sm text-gray-600">{item.name} &times; {item.qty} — ${(item.price * item.qty).toFixed(2)}</p>
                            ))}
                            <p className="text-sm font-bold mt-2">Total: ${order.total?.toFixed ? order.total.toFixed(2) : order.total}</p>
                          </div>
                          {order.shippingAddress && (
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Shipping Address</p>
                              <p className="text-sm text-gray-600">{order.shippingAddress.street}<br/>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br/>{order.shippingAddress.country}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ---- HOME PAGE TAB ---- */}
            {adminTab === 'home' && (
              <form onSubmit={saveHomeContent} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6 max-w-2xl">
                <h3 className="text-xl font-bold">Edit Home Page</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hero Background Image</label>
                  <div className="flex items-center gap-4">
                    <img src={heroImageFile ? URL.createObjectURL(heroImageFile) : homeDraft.heroImage} alt="Hero preview" className="w-24 h-16 object-cover rounded-lg border border-gray-200" />
                    <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-sm font-medium">
                      <Upload className="w-4 h-4" /> {heroImageFile ? heroImageFile.name : 'Upload New Image'}
                      <input type="file" accept="image/*" className="hidden" onChange={e => setHeroImageFile(e.target.files[0])} />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hero Title — Line 1</label>
                    <input type="text" value={homeDraft.heroTitleLine1} onChange={e => setHomeDraft({...homeDraft, heroTitleLine1: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hero Title — Line 2</label>
                    <input type="text" value={homeDraft.heroTitleLine2} onChange={e => setHomeDraft({...homeDraft, heroTitleLine2: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hero Subtitle</label>
                  <textarea rows="2" value={homeDraft.heroSubtitle} onChange={e => setHomeDraft({...homeDraft, heroSubtitle: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black outline-none resize-none" />
                </div>

                <hr className="border-gray-100" />
                <h4 className="font-bold text-sm uppercase tracking-wide text-gray-400">Our Story Section</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Eyebrow Text</label>
                  <input type="text" value={homeDraft.storyEyebrow} onChange={e => setHomeDraft({...homeDraft, storyEyebrow: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Heading</label>
                  <input type="text" value={homeDraft.storyHeading} onChange={e => setHomeDraft({...homeDraft, storyHeading: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Story Text</label>
                  <textarea rows="4" value={homeDraft.storyText} onChange={e => setHomeDraft({...homeDraft, storyText: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black outline-none resize-none" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map(n => (
                    <div key={n}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Stat {n}</label>
                      <input type="text" placeholder="Value" value={homeDraft[`stat${n}Value`]} onChange={e => setHomeDraft({...homeDraft, [`stat${n}Value`]: e.target.value})} className="w-full px-3 py-2 mb-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black outline-none text-sm" />
                      <input type="text" placeholder="Label" value={homeDraft[`stat${n}Label`]} onChange={e => setHomeDraft({...homeDraft, [`stat${n}Label`]: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black outline-none text-sm" />
                    </div>
                  ))}
                </div>

                <button type="submit" disabled={isSavingHome} className="bg-black text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50">
                  {isSavingHome ? 'Saving...' : 'Save Home Page'}
                </button>
              </form>
            )}

            {/* ---- WHOLESALE FORM TAB ---- */}
            {adminTab === 'wholesale' && (
              <div>
                <h3 className="text-xl font-bold mb-6">Wholesale Form Fields</h3>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100 mb-6">
                  {wholesaleFields.map(field => (
                    <div key={field.id} className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-sm">{field.label} {field.required && <span className="text-red-500">*</span>}</p>
                        <p className="text-xs text-gray-400">{field.section} &middot; {field.type}</p>
                      </div>
                      <button onClick={() => removeWholesaleField(field.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h4 className="font-bold mb-4">Add New Field</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Field Label</label>
                      <input type="text" value={newFieldDraft.label} onChange={e => setNewFieldDraft({...newFieldDraft, label: e.target.value})} placeholder="e.g. Preferred Delivery Day" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Field Type</label>
                      <select value={newFieldDraft.type} onChange={e => setNewFieldDraft({...newFieldDraft, type: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black outline-none bg-white">
                        <option value="text">Text</option>
                        <option value="email">Email</option>
                        <option value="tel">Phone</option>
                        <option value="textarea">Long Text</option>
                        <option value="select">Dropdown</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
                      <input type="text" value={newFieldDraft.section} onChange={e => setNewFieldDraft({...newFieldDraft, section: e.target.value})} placeholder="e.g. Order Requirements" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black outline-none" />
                    </div>
                    <div className="flex items-end pb-2.5">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <input type="checkbox" checked={newFieldDraft.required} onChange={e => setNewFieldDraft({...newFieldDraft, required: e.target.checked})} className="w-4 h-4" />
                        Required field
                      </label>
                    </div>
                  </div>
                  {newFieldDraft.type === 'select' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Dropdown Options (comma-separated)</label>
                      <input type="text" value={newFieldDraft.options} onChange={e => setNewFieldDraft({...newFieldDraft, options: e.target.value})} placeholder="e.g. Weekly, Bi-weekly, Monthly" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black outline-none" />
                    </div>
                  )}
                  <button onClick={addWholesaleField} className="bg-black text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-800 transition-colors">
                    Add Field
                  </button>
                </div>
              </div>
            )}
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