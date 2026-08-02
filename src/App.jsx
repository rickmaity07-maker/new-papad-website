import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';

// Safe Firebase Initialization to prevent Vercel build crashes
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

// --- ICONS ---
const ShoppingBagIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
);
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);
const LogOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
);

const initialProducts = [
  { id: '1', name: 'Spicy Moong Papad', price: 6.49, description: 'Traditional spicy moong dal papad.', image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=400' },
  { id: '2', name: 'Urad Dal Papad', price: 5.99, description: 'Classic plain urad dal papad.', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&q=80&w=400' },
  { id: '3', name: 'Garlic Green Chilli Papad', price: 7.49, description: 'Extra spicy with a garlic kick.', image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&q=80&w=400' },
];

export default function App() {
  const [currentView, setCurrentView] = useState('shop'); // shop, cart, checkout, account, admin
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Database & Auth State
  const [products, setProducts] = useState(initialProducts);
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock Auth & DB connection for frontend demo
  useEffect(() => {
    // In a real app, this connects to Firebase. Here we simulate for the Vercel demo.
    const storedCart = localStorage.getItem('papad_cart');
    if (storedCart) setCart(JSON.parse(storedCart));
    
    // Auto anonymous login
    setUser({ uid: 'demo-user-123', email: 'guest@user.com' });
  }, []);

  useEffect(() => {
    localStorage.setItem('papad_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
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
      setCurrentView('shop');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setUser(null);
    setCurrentView('shop');
  };

  const handleMockCheckout = () => {
    // Simulate placing an order
    const newOrder = {
      id: 'ORD-' + Math.floor(Math.random() * 10000),
      date: new Date().toISOString().split('T')[0],
      total: cartTotal,
      status: 'Pending',
      items: cart
    };
    setOrders([...orders, newOrder]);
    setCart([]);
    alert("Payment successful via Stripe! Your order has been placed.");
    setCurrentView('account');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            className="text-2xl font-bold tracking-tighter text-amber-600 cursor-pointer"
            onClick={() => setCurrentView('shop')}
          >
            The Papad Co.
          </div>
          
          <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <SearchIcon />
            </div>
            <input 
              type="text" 
              placeholder="Search papads..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm transition-colors"
            />
          </div>

          <div className="flex items-center space-x-6">
            <button onClick={() => setCurrentView('account')} className="text-gray-500 hover:text-amber-600 transition-colors">
              <UserIcon />
            </button>
            <button onClick={() => setCurrentView('cart')} className="text-gray-500 hover:text-amber-600 transition-colors relative">
              <ShoppingBagIcon />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cart.reduce((total, item) => total + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* --- SHOP VIEW --- */}
        {currentView === 'shop' && (
          <div>
            <div className="mb-8">
              <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Fresh & Crispy</h1>
              <p className="text-gray-600 text-lg">Authentic Indian papads delivered directly to your door.</p>
            </div>
            
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No products found matching your search.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProducts.map(product => (
                  <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                    <div className="h-48 bg-gray-200 overflow-hidden relative">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                        <span className="text-lg font-semibold text-amber-600">${product.price.toFixed(2)}</span>
                      </div>
                      <p className="text-gray-500 text-sm mb-6 h-10">{product.description}</p>
                      <button 
                        onClick={() => addToCart(product)}
                        className="w-full bg-gray-900 hover:bg-amber-600 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- CART VIEW --- */}
        {currentView === 'cart' && (
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
            {cart.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
                <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg">Your cart is empty.</p>
                <button 
                  onClick={() => setCurrentView('shop')}
                  className="mt-6 text-amber-600 font-medium hover:text-amber-700"
                >
                  Continue Shopping &rarr;
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <ul className="divide-y divide-gray-100">
                  {cart.map(item => (
                    <li key={item.id} className="p-6 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <img src={item.image} alt={item.name} className="h-16 w-16 object-cover rounded-lg bg-gray-100" />
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{item.name}</h4>
                          <p className="text-gray-500">${item.price.toFixed(2)} x {item.quantity}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <span className="font-bold text-lg">${(item.price * item.quantity).toFixed(2)}</span>
                        <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600">
                          <TrashIcon />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Subtotal</span>
                  <span className="text-2xl font-bold text-gray-900">${cartTotal.toFixed(2)}</span>
                </div>
                <div className="p-6">
                  <button 
                    onClick={() => setCurrentView('checkout')}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 px-4 rounded-xl text-lg transition-colors"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- CHECKOUT (MOCK STRIPE) VIEW --- */}
        {currentView === 'checkout' && (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Secure Checkout</h2>
              <p className="text-gray-500">This is a demonstration of the Stripe payment flow.</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
              {cart.map(item => (
                <div key={item.id} className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">{item.quantity}x {item.name}</span>
                  <span className="text-gray-900 font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between font-bold text-lg">
                <span>Total to pay</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={handleMockCheckout}
              className="w-full bg-[#635BFF] hover:bg-[#4B45D6] text-white font-bold py-4 px-4 rounded-xl text-lg transition-colors flex justify-center items-center gap-2"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Pay ${cartTotal.toFixed(2)} via Mock Stripe
            </button>
            <button 
              onClick={() => setCurrentView('cart')}
              className="w-full mt-4 bg-transparent text-gray-500 hover:text-gray-900 py-3 font-medium transition-colors"
            >
              Back to Cart
            </button>
          </div>
        )}

        {/* --- ACCOUNT / LOGIN VIEW --- */}
        {currentView === 'account' && (
          <div className="max-w-md mx-auto">
            {!user ? (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-center mb-8">Sign In</h2>
                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" name="email" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 outline-none" defaultValue="user@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input type="password" name="password" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 outline-none" defaultValue="password123" />
                  </div>
                  <div className="text-xs text-gray-500 text-center bg-gray-50 p-3 rounded">
                    Tip: Use <b>admin@thepapadco.com</b> / <b>admin</b> to view Admin Portal.
                  </div>
                  <button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-xl transition-colors">
                    Sign In
                  </button>
                </form>
              </div>
            ) : (
              <div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">My Account</h2>
                    <p className="text-gray-500">{user.email}</p>
                  </div>
                  <button onClick={handleLogout} className="text-red-500 hover:text-red-700 flex items-center gap-2 font-medium">
                    <LogOutIcon /> Logout
                  </button>
                </div>

                {isAdmin && (
                  <button 
                    onClick={() => setCurrentView('admin')}
                    className="w-full mb-8 bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-xl transition-colors shadow-sm"
                  >
                    Go to Admin Dashboard
                  </button>
                )}

                <h3 className="text-xl font-bold mb-4">Order History</h3>
                {orders.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center text-gray-500">
                    No orders placed yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map(order => (
                      <div key={order.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                        <div>
                          <p className="font-bold text-gray-900">{order.id}</p>
                          <p className="text-sm text-gray-500">{order.date} • {order.items.length} items</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">${order.total.toFixed(2)}</p>
                          <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full mt-1">
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

        {/* --- ADMIN VIEW --- */}
        {currentView === 'admin' && isAdmin && (
          <div>
            <div className="flex justify-between items-end mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Portal</h1>
                <p className="text-gray-500">Manage products and view orders.</p>
              </div>
              <button onClick={() => setCurrentView('shop')} className="text-amber-600 font-medium hover:underline">
                Back to Shop
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Product Management */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold">Product Catalog</h2>
                    <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium">
                      + Add Product
                    </button>
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {products.map(product => (
                      <li key={product.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <img src={product.image} className="w-12 h-12 rounded object-cover border" alt={product.name} />
                          <div>
                            <p className="font-bold text-gray-900">{product.name}</p>
                            <p className="text-gray-500 text-sm">${product.price.toFixed(2)}</p>
                          </div>
                        </div>
                        <button className="text-red-400 hover:text-red-600 p-2">
                          <TrashIcon />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Order Overview */}
              <div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-xl font-bold">Recent Orders</h2>
                  </div>
                  <div className="p-0">
                    {orders.length === 0 ? (
                      <p className="p-6 text-gray-500 text-center">No orders yet.</p>
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {orders.map(order => (
                          <li key={order.id} className="p-4">
                            <div className="flex justify-between mb-1">
                              <span className="font-bold text-sm">{order.id}</span>
                              <span className="text-sm font-medium text-amber-600">${order.total.toFixed(2)}</span>
                            </div>
                            <div className="text-xs text-gray-500">{order.date}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}