import React, { useState } from 'react';
import { LayoutDashboard, Wallet, Store, CheckCircle, FileText, Building, LineChart as ChartIcon, UserPlus, LogOut, Sparkles, X } from 'lucide-react'; // Added 'X' icon for the close button
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { QRCodeSVG } from 'qrcode.react'; // --- NEW IMPORT ---
// --- MOCK DATA ---
const INITIAL_PRODUCTS = {
  Tech: [
    { id: 't1', name: 'Interactive Smartboard', price: 150000, vendor: 'EduTech' },
    { id: 't2', name: 'Student Chromebook', price: 25000, vendor: 'TechNova' },
  ],
  Furniture: [
    { id: 'f1', name: 'Ergonomic Desk', price: 8500, vendor: 'WoodWorks' },
    { id: 'f2', name: 'Lab Stool', price: 2200, vendor: 'ChemCo' },
  ],
  Stationary: [
    { id: 's1', name: 'Whiteboard Markers (Box of 50)', price: 1200, vendor: 'OfficePlus' },
    { id: 's2', name: 'Exam Answer Booklets (1000)', price: 15000, vendor: 'PrintPros' },
  ]
};

const INITIAL_FINANCE_DATA = [
  { name: 'Computer Science', budget: 500000, spent: 420000 },
  { name: 'Chemistry', budget: 300000, spent: 150000 },
  { name: 'Administration', budget: 200000, spent: 190000 },
  { name: 'Sports', budget: 150000, spent: 50000 },
];
const COLORS = ['#2D4A3E', '#D4AF37', '#4A6B5D', '#E5C158'];

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profRequests, setProfRequests] = useState([]);
  const [vendorProducts, setVendorProducts] = useState(INITIAL_PRODUCTS);
  const [financeData, setFinanceData] = useState(INITIAL_FINANCE_DATA);

  // --- LOGIN LOGIC ---
  const handleLogin = (regNumber) => {
    const prefix = regNumber.substring(0, 3).toUpperCase();
    if (prefix === 'PRO') setUser({ role: 'Professor', id: regNumber });
    else if (prefix === 'ADM') setUser({ role: 'Admin', id: regNumber });
    else if (prefix === 'VEN') setUser({ role: 'Vendor', id: regNumber });
    else alert('Invalid Registration Number. Use PRO-..., ADM-..., or VEN-...');
  };

  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

  // --- MENU FILTERING BASED ON ROLE ---
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard />, roles: ['Admin', 'Professor', 'Vendor'] },
    { id: 'requests', label: 'Budget Requests', icon: <FileText />, roles: ['Admin', 'Professor'] },
    { id: 'vendor', label: 'Vendor Portal', icon: <Store />, roles: ['Admin', 'Vendor'] },
    { id: 'finance', label: 'Finance Analyzer', icon: <ChartIcon />, roles: ['Admin'] },
  ];

  return (
    <div className="flex h-screen bg-[#FBF9F5] text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#2D4A3E] text-white flex flex-col shadow-xl z-10">
        <div className="p-6 flex items-center space-x-3 border-b border-[#1E332A]">
          <div className="bg-[#D4AF37] p-2 rounded-lg">
            <Building className="w-6 h-6 text-[#2D4A3E]" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">ScholiFi</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.filter(item => item.roles.includes(user.role)).map(item => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-[#1E332A] text-sm text-gray-300 flex justify-between items-center">
          <div>
            <p className="font-bold text-[#D4AF37]">{user.role}</p>
            <p className="text-xs">{user.id}</p>
          </div>
          <button onClick={() => setUser(null)} className="hover:text-white">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <header className="bg-white shadow-sm px-8 py-6 sticky top-0 z-0">
          <h2 className="text-2xl font-bold text-[#2D4A3E] capitalize">{activeTab.replace('-', ' ')}</h2>
        </header>

        <div className="p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-xl font-bold text-[#2D4A3E]">Welcome to your Dashboard, {user.role}</h3>
              {user.role === 'Admin' && <AdminDashboard requests={profRequests} financeData={financeData} setFinanceData={setFinanceData} />}
              {user.role === 'Professor' && <ProfessorDashboard financeData={financeData} />}
              {user.role === 'Vendor' && <VendorDashboard user={user} requests={profRequests} />}
            </div>
          )}
          {activeTab === 'requests' && (
            <RequestView
              user={user}
              requests={profRequests}
              setRequests={setProfRequests}
              financeData={financeData}
              vendorProducts={vendorProducts}
            />
          )}
          {activeTab === 'vendor' && <VendorPortalView
            user={user}
            vendorProducts={vendorProducts}
            setVendorProducts={setVendorProducts}
            requests={profRequests}
            setRequests={setProfRequests}
          />}
          {activeTab === 'finance' && <FinanceAnalyzerView financeData={financeData} />}
        </div>
      </main>
    </div>
  );
}

// --- LOGIN COMPONENT ---
function LoginView({ onLogin }) {
  const [regNum, setRegNum] = useState('');

  return (
    <div className="flex h-screen bg-[#FBF9F5] items-center justify-center">
      <div className="bg-white p-10 rounded-2xl shadow-lg border border-slate-200 w-96">
        <div className="flex justify-center mb-6">
          <div className="bg-[#D4AF37] p-3 rounded-xl">
            <Building className="w-8 h-8 text-[#2D4A3E]" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-[#2D4A3E] mb-2">Login to ScholiFi</h2>
        <p className="text-center text-slate-500 mb-8 text-sm">Use PRO-123, ADM-123, or VEN-123</p>

        <input
          type="text"
          placeholder="Registration Number"
          className="w-full border border-slate-300 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[#2D4A3E]"
          value={regNum}
          onChange={(e) => setRegNum(e.target.value)}
        />
        <button
          onClick={() => onLogin(regNum)}
          className="w-full bg-[#2D4A3E] text-white rounded-xl py-3 font-semibold hover:bg-[#1E332A] transition-colors"
        >
          Sign In
        </button>
      </div>
    </div>
  );
}

// --- NAV ITEM COMPONENT ---
function NavItem({ icon, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-[#D4AF37]/20 text-[#D4AF37] font-medium' : 'text-gray-300 hover:bg-white/5 hover:text-white'
        }`}
    >
      {React.cloneElement(icon, { className: 'w-5 h-5' })}
      <span>{label}</span>
    </button>
  );
}

// --- PROFESSOR REQUEST & ADMIN APPROVAL VIEW ---
function RequestView({ user, requests, setRequests, financeData, vendorProducts }) {
  const allProducts = Object.values(vendorProducts).flat();

  const [department, setDepartment] = useState('Computer Science');
  const [selectedProductId, setSelectedProductId] = useState(allProducts[0]?.id || '');
  const [quantity, setQuantity] = useState('');
  const [desc, setDesc] = useState('');
  const [rfpText, setRfpText] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [checkingId, setCheckingId] = useState(null);

  // --- NEW: State for the Payment Modal ---
  const [checkoutReq, setCheckoutReq] = useState(null);

  const currentProduct = allProducts.find(p => p.id === selectedProductId);

  const handleGenerateRFP = async () => {
    if (!currentProduct || !quantity) return alert("Please select a product and quantity.");

    setLoadingAI(true);
    try {
      const res = await fetch('http://localhost:8000/api/generate-rfp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department,
          quantity: parseInt(quantity),
          description: `${currentProduct.name}. Additional requirements: ${desc}`
        })
      });
      const data = await res.json();
      setRfpText(data.rfp_text);
    } catch (err) {
      setRfpText("Error generating RFP. Ensure main.py backend is running.");
    }
    setLoadingAI(false);
  };

  const handleSubmit = () => {
    if (!currentProduct || !quantity) return;

    setRequests([...requests, {
      id: `REQ-${Math.floor(Math.random() * 1000)}`,
      profId: user.id,
      department,
      quantity: parseInt(quantity),
      productId: currentProduct.id,
      productName: currentProduct.name,
      vendor: currentProduct.vendor,
      customNotes: desc,
      rfp: rfpText,
      status: 'Pending',
      budgetStatus: null
    }]);
    setQuantity('');
    setDesc('');
    setRfpText('');
  };

  const handleCheckBudget = (req) => {
    setCheckingId(req.id);

    setTimeout(() => {
      const product = allProducts.find(p => p.id === req.productId);

      if (!product) {
        alert("Product no longer exists in vendor catalog.");
        setCheckingId(null);
        return;
      }

      const verifiedCost = product.price * req.quantity;
      const deptInfo = financeData.find(d => d.name === req.department);
      const remainingBudget = deptInfo ? (deptInfo.budget - deptInfo.spent) : 0;
      const isSufficient = verifiedCost <= remainingBudget;

      setRequests(requests.map(r => r.id === req.id ? {
        ...r,
        budgetStatus: { verifiedCost, remainingBudget, isSufficient }
      } : r));

      setCheckingId(null);
    }, 600);
  };

  const handleApprove = (id) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: 'Approved (Sent to Vendor)' } : r));
  };

  // --- NEW: Open Modal instead of Alert ---
  const handleBuy = (req) => {
    setCheckoutReq(req);
  };

  // --- NEW: Confirm Payment Success ---
  const confirmPayment = () => {
    setRequests(requests.map(r => r.id === checkoutReq.id ? { ...r, status: 'Paid & Ordered' } : r));
    setCheckoutReq(null);
  };

  return (
    <div className="space-y-6 relative">
      {(user.role === 'Professor') && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-[#2D4A3E] mb-4">Create Budget Request</h3>
          <div className="space-y-4">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select value={department} onChange={e => setDepartment(e.target.value)} className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D4A3E]">
                {financeData.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
              </select>

              <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D4A3E]">
                {allProducts.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.brand ? `, ${p.brand}` : ''} — By {p.vendor} (₹{p.price.toLocaleString()}/ea)
                  </option>
                ))}
              </select>
            </div>

            <input type="number" placeholder="Quantity Needed" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D4A3E]" min="1" />

            <textarea
              placeholder="Request For Proposal (RFP) custom notes..."
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D4A3E]"
              rows={2}
            />

            <div className="flex space-x-3">
              <button onClick={handleGenerateRFP} className="flex items-center bg-[#D4AF37] text-white px-4 py-2 rounded-xl font-medium hover:bg-yellow-600 transition-colors">
                {loadingAI ? 'Generating...' : <><Sparkles className="w-4 h-4 mr-2" /> AI Auto-Draft RFP</>}
              </button>
            </div>

            {(rfpText || !loadingAI) && (
              <textarea
                placeholder="Your Request for Proposal (RFP) text will appear here. You can edit it or type it manually..."
                value={rfpText}
                onChange={e => setRfpText(e.target.value)}
                className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2D4A3E] min-h-[150px]"
              />
            )}

            <button onClick={handleSubmit} className="w-full bg-[#2D4A3E] text-white py-3 rounded-xl font-medium hover:bg-[#1E332A] transition-colors">Submit Request to Admin</button>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-[#2D4A3E] mb-4">Request History</h3>
        {requests.length === 0 ? <p className="text-slate-500 text-sm">No requests found.</p> : (
          <div className="space-y-4">
            {requests.map(req => (
              <div key={req.id} className="border p-4 rounded-xl flex flex-col hover:shadow-sm transition-shadow">

                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-1 rounded font-bold">{req.status}</span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded ml-2">{req.department}</span>
                    <p className="font-bold text-[#2D4A3E] mt-2">{req.quantity}x {req.productName}</p>
                    <p className="text-sm text-slate-600 mt-1">Requested by: {req.profId} | Vendor: {req.vendor}</p>
                    {req.customNotes && (
                      <p className="text-xs text-slate-500 mt-1 italic">Notes: {req.customNotes}</p>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 text-right">

                    {user.role === 'Admin' && req.status === 'Pending' && (
                      <button onClick={() => handleApprove(req.id)} className="bg-[#2D4A3E] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#1E332A] transition-colors">
                        Approve & Forward
                      </button>
                    )}

                    {/* Trigger the Modal */}
                    {user.role === 'Admin' && req.status === 'Approved (Sent to Vendor)' && (
                      <button onClick={() => handleBuy(req)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm">
                        Complete Purchase
                      </button>
                    )}

                    <button
                      onClick={() => handleCheckBudget(req)}
                      disabled={checkingId === req.id}
                      className="border border-[#2D4A3E] text-[#2D4A3E] px-4 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                      {checkingId === req.id ? 'Verifying...' : 'Check Vendor Pricing'}
                    </button>
                  </div>
                </div>

                {req.budgetStatus && (
                  <div className={`mt-4 p-3 rounded-lg text-sm flex items-center justify-between ${req.budgetStatus.isSufficient ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                    <div>
                      <span className="font-bold">Vendor Verified Cost:</span> ₹{req.budgetStatus.verifiedCost.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-bold">Available Dept Funds:</span> ₹{req.budgetStatus.remainingBudget.toLocaleString()}
                    </div>
                    <div className="font-bold flex items-center">
                      {req.budgetStatus.isSufficient ? '✅ Sufficient Funds' : '❌ Budget Exceeded'}
                    </div>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- NEW: THE QR PAYMENT MODAL --- */}
      {checkoutReq && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-[400px] relative animate-in zoom-in-95 duration-200">

            <button onClick={() => setCheckoutReq(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800">
              <X className="w-6 h-6" />
            </button>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#2D4A3E] mb-1">Checkout</h2>
              <p className="text-slate-500 mb-6">Scan to pay with any UPI App</p>

              <div className="bg-slate-50 p-6 rounded-2xl inline-block border border-slate-200 shadow-inner mb-6">
                {/* 
                  This creates a standard Indian UPI string. 
                  Replace 'your_actual_vpa@upi' with your real UPI ID if you want real money to transfer! 
                */}
                <QRCodeSVG
                  value={`upi://pay?pa=7770011695@ybl&pn=ScholiFi%20Vendor&am=${checkoutReq.budgetStatus?.verifiedCost}&cu=INR`}
                  size={200}
                  level={"H"}
                  fgColor="#2D4A3E"
                />
              </div>

              <div className="space-y-2 text-left bg-[#FBF9F5] p-4 rounded-xl border border-[#D4AF37]/30 mb-6">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Item:</span>
                  <span className="font-medium text-slate-800">{checkoutReq.quantity}x {checkoutReq.productName}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Vendor ID:</span>
                  <span className="font-medium text-slate-800">{checkoutReq.vendor}</span>
                </div>
                <div className="w-full h-px bg-slate-200 my-2" />
                <div className="flex justify-between text-lg font-bold text-[#2D4A3E]">
                  <span>Total Cost:</span>
                  <span>₹{checkoutReq.budgetStatus?.verifiedCost.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={confirmPayment}
                className="w-full bg-[#D4AF37] text-white py-3 rounded-xl font-medium hover:bg-yellow-600 transition-colors shadow-md"
              >
                I have completed the payment
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
// --- VENDOR PORTAL VIEW ---
function VendorPortalView({ user, vendorProducts, setVendorProducts, requests, setRequests }) {
  const [activeCategory, setActiveCategory] = useState('Tech');

  // State for the new item form
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Tech');
  const [newItemBrand, setNewItemBrand] = useState('');

  // --- NEW: State for the Direct Purchase Modal ---
  const [checkoutData, setCheckoutData] = useState(null);

  const handleAddProduct = () => {
    if (!newItemName || !newItemPrice || !newItemBrand) {
      return alert("Please enter a name, brand, and price.");
    }

    const newProduct = {
      id: `prod-${Math.floor(Math.random() * 10000)}`,
      name: newItemName,
      brand: newItemBrand,
      price: parseFloat(newItemPrice),
      vendor: user.id
    };

    setVendorProducts({
      ...vendorProducts,
      [newItemCategory]: [...vendorProducts[newItemCategory], newProduct]
    });

    setNewItemName('');
    setNewItemPrice('');
    setNewItemBrand('');
  };

  const handleRemoveProduct = (category, productId) => {
    setVendorProducts({
      ...vendorProducts,
      [category]: vendorProducts[category].filter(p => p.id !== productId)
    });
  };

  // --- UPDATED: Open Modal Instead of Instant Buy ---
  const handleDirectPurchase = (prod) => {
    const qtyStr = window.prompt(`Direct Purchase: How many units of ${prod.name} would you like to buy?`);
    if (!qtyStr) return; // User cancelled

    const qty = parseInt(qtyStr);
    if (isNaN(qty) || qty <= 0) return alert("Please enter a valid number.");

    const totalCost = qty * prod.price;

    // Set the state to open the QR modal
    setCheckoutData({
      prod,
      qty,
      totalCost
    });
  };

  // --- NEW: Confirm Direct Payment ---
  const confirmDirectPayment = () => {
    setRequests([...(requests || []), {
      id: `DIR-${Math.floor(Math.random() * 1000)}`,
      profId: user.id,
      department: 'Administration',
      quantity: checkoutData.qty,
      productId: checkoutData.prod.id,
      productName: checkoutData.prod.name,
      vendor: checkoutData.prod.vendor,
      customNotes: 'Purchased directly from Vendor Portal by Admin',
      rfp: 'N/A - Direct Admin Purchase',
      status: 'Paid & Ordered',
      budgetStatus: {
        verifiedCost: checkoutData.totalCost,
        remainingBudget: 200000,
        isSufficient: true
      }
    }]);

    alert(`Success! Purchased ${checkoutData.qty}x ${checkoutData.prod.name}. The record has been added to the Budget Requests tab.`);
    setCheckoutData(null); // Close the modal
  };

  return (
    <div className="space-y-6 relative">

      {/* ADD NEW PRODUCT SECTION (Only visible to Vendors) */}
      {user.role === 'Vendor' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-[#2D4A3E] mb-4">Add New Catalog Item</h3>
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">

            <select
              value={newItemCategory}
              onChange={e => setNewItemCategory(e.target.value)}
              className="border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D4A3E] md:w-1/4 bg-white"
            >
              {Object.keys(vendorProducts).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Item Name"
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              className="border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D4A3E] flex-1"
            />
            <input
              type="text"
              placeholder="Brand Name"
              value={newItemBrand}
              onChange={e => setNewItemBrand(e.target.value)}
              className="border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D4A3E] flex-1"
            />
            <input
              type="number"
              placeholder="Price (₹)"
              value={newItemPrice}
              onChange={e => setNewItemPrice(e.target.value)}
              className="border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D4A3E] md:w-1/4"
              min="0"
            />

            <button
              onClick={handleAddProduct}
              className="bg-[#D4AF37] text-white px-6 py-3 rounded-xl font-medium hover:bg-yellow-600 transition-colors"
            >
              Add Item
            </button>
          </div>
        </div>
      )}

      {/* PRODUCT LISTING SECTION */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex space-x-4 mb-6 border-b pb-4">
          {Object.keys(vendorProducts).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeCategory === cat ? 'bg-[#2D4A3E] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {vendorProducts[activeCategory].length === 0 ? (
          <p className="text-slate-500 text-sm">No items in this category.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vendorProducts[activeCategory].map(prod => (
              <div key={prod.id} className="border border-slate-100 p-4 rounded-xl flex justify-between items-center hover:shadow-md transition-shadow">
                <div>
                  <h4 className="font-bold text-[#2D4A3E]">
                    {prod.name}{prod.brand ? `, ${prod.brand}` : ''}
                  </h4>
                  <p className="text-sm text-slate-500">By {prod.vendor}</p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <p className="font-bold text-[#D4AF37] text-lg">₹{prod.price.toLocaleString()}</p>

                  {/* Remove button only shows if the logged-in user is the vendor who created the item */}
                  {user.role === 'Vendor' && prod.vendor === user.id && (
                    <button
                      onClick={() => handleRemoveProduct(activeCategory, prod.id)}
                      className="text-xs mt-1 text-red-500 border border-red-500 px-3 py-1 rounded hover:bg-red-50 transition-colors font-medium"
                    >
                      Remove Item
                    </button>
                  )}

                  {/* Direct Buy button for Admins */}
                  {user.role === 'Admin' && (
                    <button
                      onClick={() => handleDirectPurchase(prod)}
                      className="text-xs mt-2 bg-[#2D4A3E] text-white px-4 py-1.5 rounded hover:bg-[#1E332A] transition-colors font-medium"
                    >
                      Buy Directly
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- NEW: THE QR PAYMENT MODAL FOR DIRECT BUY --- */}
      {checkoutData && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-[400px] relative animate-in zoom-in-95 duration-200">

            <button onClick={() => setCheckoutData(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800">
              <X className="w-6 h-6" />
            </button>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#2D4A3E] mb-1">Direct Checkout</h2>
              <p className="text-slate-500 mb-6">Scan to pay with any UPI App</p>

              <div className="bg-slate-50 p-6 rounded-2xl inline-block border border-slate-200 shadow-inner mb-6">
                <QRCodeSVG
                  value={`upi://pay?pa=7770011695@ybl&pn=ScholiFi%20Vendor&am=${checkoutData.totalCost}&cu=INR`}
                  size={200}
                  level={"H"}
                  fgColor="#2D4A3E"
                />
              </div>

              <div className="space-y-2 text-left bg-[#FBF9F5] p-4 rounded-xl border border-[#D4AF37]/30 mb-6">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Item:</span>
                  <span className="font-medium text-slate-800">{checkoutData.qty}x {checkoutData.prod.name}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Vendor ID:</span>
                  <span className="font-medium text-slate-800">{checkoutData.prod.vendor}</span>
                </div>
                <div className="w-full h-px bg-slate-200 my-2" />
                <div className="flex justify-between text-lg font-bold text-[#2D4A3E]">
                  <span>Total Cost:</span>
                  <span>₹{checkoutData.totalCost.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={confirmDirectPayment}
                className="w-full bg-[#D4AF37] text-white py-3 rounded-xl font-medium hover:bg-yellow-600 transition-colors shadow-md"
              >
                I have completed the payment
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// --- FINANCE ANALYZER VIEW ---
function FinanceAnalyzerView({ financeData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-96">
        <h3 className="font-bold text-[#2D4A3E] mb-4">Budget vs Spent Status (Demo Graph)</h3>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={financeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value / 1000}k`} />
            <Tooltip cursor={{ fill: '#FBF9F5' }} />
            <Legend />
            <Bar dataKey="budget" name="Total Budget" fill="#2D4A3E" radius={[4, 4, 0, 0]} />
            <Bar dataKey="spent" name="Spent" fill="#D4AF37" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-96">
        <h3 className="font-bold text-[#2D4A3E] mb-4">Total Spending Distribution (Demo Graph)</h3>
        <ResponsiveContainer width="100%" height="85%">
          <PieChart>
            <Pie data={financeData} dataKey="spent" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
              {financeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ================= DASHBOARD COMPONENTS =================

function AdminDashboard({ requests, financeData, setFinanceData }) {
  const recentRequests = [...requests].reverse().slice(0, 5);
  const [editingDept, setEditingDept] = useState(null);
  const [newBudget, setNewBudget] = useState('');

  const handleEdit = (dept) => {
    setEditingDept(dept.name);
    setNewBudget(dept.budget);
  };

  const handleSave = (deptName) => {
    const updated = financeData.map(d => {
      if (d.name === deptName) {
        return { ...d, budget: parseInt(newBudget) || d.budget };
      }
      return d;
    });
    setFinanceData(updated);
    setEditingDept(null);
  };

  return (
    <div className="space-y-8">

      {/* --- NEW: Department Budget Manager --- */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-[#D4AF37]/20 p-2 rounded-lg">
            <Wallet className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <h3 className="text-lg font-bold text-[#2D4A3E]">Department Budget Allocations</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {financeData.map(dept => {
            const percent = (dept.spent / dept.budget) * 100;
            const isEditing = editingDept === dept.name;

            return (
              <div key={dept.name} className="border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-slate-50 relative overflow-hidden group">
                {/* Decorative side bar */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#2D4A3E] group-hover:bg-[#D4AF37] transition-colors"></div>

                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="font-bold text-[#2D4A3E] text-lg">{dept.name}</h4>
                    <p className="text-sm text-slate-500 mt-0.5">Spent: ₹{dept.spent.toLocaleString()}</p>
                  </div>

                  {isEditing ? (
                    <div className="flex flex-col space-y-2 items-end">
                      <input
                        type="number"
                        value={newBudget}
                        onChange={(e) => setNewBudget(e.target.value)}
                        className="border-2 border-[#D4AF37] px-3 py-1.5 rounded-xl w-32 text-sm focus:outline-none bg-white font-bold text-[#2D4A3E]"
                      />
                      <div className="flex space-x-2">
                        <button onClick={() => setEditingDept(null)} className="text-slate-400 hover:text-slate-600 text-xs font-medium px-2 py-1">Cancel</button>
                        <button onClick={() => handleSave(dept.name)} className="bg-[#2D4A3E] text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-[#1E332A] shadow-sm">Save</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => handleEdit(dept)} className="text-xs font-bold text-[#2D4A3E] border border-[#2D4A3E]/30 px-4 py-2 rounded-xl hover:bg-[#2D4A3E] hover:text-white transition-all shadow-sm bg-white">
                      Edit Budget
                    </button>
                  )}
                </div>

                {/* Visual Progress Bar (Hidden during edit for clean UI) */}
                {!isEditing && (
                  <div>
                    <div className="flex justify-between text-sm mb-1.5 font-bold">
                      <span className="text-slate-400 uppercase tracking-wider text-[10px]">Total Allocation</span>
                      <span className="text-[#D4AF37] text-base">₹{dept.budget.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-1000 ${percent > 90 ? 'bg-red-500' : 'bg-[#2D4A3E]'}`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* --- ORIGINAL: Recent Activity Feed --- */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-[#2D4A3E] mb-4">Recent Activity Feed</h3>

        {recentRequests.length === 0 ? (
          <p className="text-slate-500 text-sm">No recent activity found. Waiting for new requests...</p>
        ) : (
          <div className="space-y-4">
            {recentRequests.map(req => (
              <div key={req.id} className="flex justify-between items-center border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                <div className="flex items-start space-x-3">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                    <FileText className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="font-bold text-[#2D4A3E]">
                      {req.profId} requested {req.quantity}x {req.productName}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Dept: {req.department} • Vendor: {req.vendor}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-bold ${req.status.includes('Approved') || req.status.includes('Paid')
                  ? 'bg-green-100 text-green-700'
                  : 'bg-[#D4AF37]/20 text-[#D4AF37]'
                  }`}>
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

function ProfessorDashboard({ financeData }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h3 className="text-lg font-bold text-[#2D4A3E] mb-6">Department Budget Tracker</h3>
      <div className="space-y-6">
        {financeData.map(dept => {
          const percent = (dept.spent / dept.budget) * 100;
          const isDanger = percent > 90;

          return (
            <div key={dept.name}>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-slate-700">{dept.name}</span>
                <span className="text-slate-500">
                  ₹{dept.spent.toLocaleString()} / ₹{dept.budget.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-1000 ${isDanger ? 'bg-red-500' : 'bg-[#2D4A3E]'}`}
                  style={{ width: `${Math.min(percent, 100)}%` }}
                />
              </div>
              {isDanger && (
                <p className="text-xs text-red-500 mt-2 font-medium">
                  Approaching budget limit!
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VendorDashboard({ user, requests }) {
  // 1. Find all paid/approved requests that belong to this specific logged-in vendor
  const mySales = requests.filter(r => r.vendor === user.id && r.status.includes('Paid'));

  let salesData = [];

  // 2. Aggregate the revenue dynamically if they have actual sales
  if (mySales.length > 0) {
    const productSales = {};
    mySales.forEach(req => {
      if (!productSales[req.productName]) {
        productSales[req.productName] = 0;
      }
      productSales[req.productName] += (req.budgetStatus?.verifiedCost || 0);
    });

    salesData = Object.keys(productSales).map(name => ({
      name: name,
      revenue: productSales[name]
    }));
  } else {
    // 3. Fallback to mock data so the charts look visually appealing on first load
    salesData = [
      { name: 'Interactive Smartboard', revenue: 450000 },
      { name: 'Student Chromebook', revenue: 125000 },
      { name: 'Ergonomic Desk', revenue: 85000 }
    ];
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 p-4 rounded-xl text-[#2D4A3E] text-sm">
        <span className="font-bold">Total Sales Completed:</span> {mySales.length} orders processed.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-96">
          <h3 className="font-bold text-[#2D4A3E] mb-4">Revenue by Product (Demo Graph)</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={salesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value / 1000}k`} />
              <Tooltip cursor={{ fill: '#FBF9F5' }} formatter={(value) => `₹${value.toLocaleString()}`} />
              <Bar dataKey="revenue" name="Total Revenue" fill="#D4AF37" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-96">
          <h3 className="font-bold text-[#2D4A3E] mb-4">Sales Distribution (Demo Graph)</h3>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie data={salesData} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {salesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}