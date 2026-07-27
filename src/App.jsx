import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Wallet, Store, CheckCircle, FileText, Building, LineChart as ChartIcon, UserPlus, LogOut, Sparkles, X, Gavel, ScanLine, Upload, Loader2, AlertTriangle, TrendingUp, Percent, Users, Award, CreditCard, Plus, Search, Bell, Send, ChevronDown, Menu, Shield, Check } from 'lucide-react'; // Added icons
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { QRCodeSVG } from 'qrcode.react'; // --- NEW IMPORT ---
import { supabase } from './supabaseClient';
import StudentParentPortal from './student_parent_portal';

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
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profRequests, setProfRequests] = useState([]);
  const [vendorProducts, setVendorProducts] = useState(INITIAL_PRODUCTS);
  const [financeData, setFinanceData] = useState(INITIAL_FINANCE_DATA);

  const [teachersSalaries, setTeachersSalaries] = useState(() => {
    const saved = localStorage.getItem('scholifi_teacher_salaries');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved salaries, using default", e);
      }
    }
    return [
      {
        id: 'PRO-101',
        name: 'Prof. Rajesh Kumar',
        department: 'Computer Science',
        currentSalary: 120000,
        hikeHistory: [
          { date: '2026-01-15', percentage: 10, prevSalary: 109090, newSalary: 120000 }
        ]
      },
      {
        id: 'PRO-102',
        name: 'Prof. Anjali Sharma',
        department: 'Chemistry',
        currentSalary: 95000,
        hikeHistory: [
          { date: '2026-02-10', percentage: 5, prevSalary: 90476, newSalary: 95000 }
        ]
      },
      {
        id: 'PRO-103',
        name: 'Prof. Amit Patel',
        department: 'Administration',
        currentSalary: 110000,
        hikeHistory: [
          { date: '2026-03-01', percentage: 8, prevSalary: 101851, newSalary: 110000 }
        ]
      },
      {
        id: 'PRO-104',
        name: 'Prof. Sneha Reddy',
        department: 'Sports',
        currentSalary: 80000,
        hikeHistory: [
          { date: '2026-04-12', percentage: 6, prevSalary: 75471, newSalary: 80000 }
        ]
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('scholifi_teacher_salaries', JSON.stringify(teachersSalaries));
  }, [teachersSalaries]);

  // --- NEW: Fetch Initial Data from Supabase ---
  useEffect(() => {
    async function loadData() {
      try {
        // 1. Fetch departments
        const { data: depts, error: deptErr } = await supabase.from('departments').select('*');
        if (depts && depts.length > 0) {
          setFinanceData(depts);
        } else if (deptErr) {
          console.error("Error fetching departments:", deptErr);
        }

        // 2. Fetch products
        const { data: prods, error: prodErr } = await supabase.from('products').select('*');
        let currentProducts = INITIAL_PRODUCTS;
        if (prods) {
          const merged = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
          prods.forEach(prod => {
            const cat = prod.category || 'Tech';
            if (!merged[cat]) {
              merged[cat] = [];
            }
            if (!merged[cat].some(p => p.id === prod.id)) {
              merged[cat].push({
                id: prod.id,
                name: prod.name,
                brand: prod.brand,
                price: prod.price,
                vendor: prod.vendor_id || prod.vendor || 'Unknown Vendor'
              });
            }
          });
          setVendorProducts(merged);
          currentProducts = merged;
        } else if (prodErr) {
          console.error("Error fetching products:", prodErr);
        }

        // 3. Fetch budget requests
        const { data: reqs, error: reqErr } = await supabase.from('budget_requests').select('*');
        if (reqs) {
          const allProds = Object.values(currentProducts).flat();
          const mapped = reqs.map(req => {
            const product = allProds.find(p => p.id === req.product_id);
            return {
              id: req.id,
              profId: req.prof_id,
              department: req.department_name,
              quantity: req.quantity,
              productId: req.product_id,
              productName: product ? product.name : 'Unknown Product',
              vendor: req.vendor_id,
              customNotes: req.custom_notes,
              rfp: req.rfp_text,
              status: req.status,
              budgetStatus: req.verified_cost ? {
                verifiedCost: req.verified_cost,
                remainingBudget: 200000,
                isSufficient: true
              } : null
            };
          });
          setProfRequests(mapped);
        } else if (reqErr) {
          console.error("Error fetching requests:", reqErr);
        }
      } catch (err) {
        console.error("Failed to load initial data from Supabase:", err);
      }
    }

    loadData();
  }, []);


  // --- LOGIN LOGIC ---
  const handleLogin = (regNumber) => {
    const prefix = regNumber.substring(0, 3).toUpperCase();
    if (prefix === 'PRO') setUser({ role: 'Professor', id: regNumber });
    else if (prefix === 'ADM') setUser({ role: 'Admin', id: regNumber });
    else if (prefix === 'VEN') setUser({ role: 'Vendor', id: regNumber });
    else if (prefix === 'STD' || prefix === 'PAR') setUser({ role: 'Student/Parent', id: regNumber });
    else alert('Invalid Registration Number. Use PRO-..., ADM-..., VEN-..., STD-..., or PAR-...');
  };

  if (!user) {
    return (
      <LandingPageView
        onLogin={handleLogin}
        showLoginModal={showLoginModal}
        setShowLoginModal={setShowLoginModal}
      />
    );
  }

  if (user.role === 'Student/Parent') {
    return <StudentParentPortal user={user} onLogout={() => { setUser(null); setActiveTab('dashboard'); }} />;
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard />, roles: ['Admin', 'Professor', 'Vendor'] },
    { id: 'requests', label: 'Budget Requests', icon: <FileText />, roles: ['Admin', 'Professor'] },
    { id: 'scanner', label: 'Invoice Scanner', icon: <ScanLine />, roles: ['Admin'] },
    { id: 'salaries', label: 'Salary Portal', icon: <Wallet />, roles: ['Admin', 'Professor'] },
    { id: 'auction', label: 'Auction Center', icon: <Gavel />, roles: ['Admin'] }, // <-- NEW TAB
    { id: 'vendor', label: 'Vendor Portal', icon: <Store />, roles: ['Admin', 'Vendor'] },
    { id: 'finance', label: 'Finance Analyzer', icon: <ChartIcon />, roles: ['Admin'] },
    { id: 'fees', label: 'Fee Management', icon: <CreditCard />, roles: ['Admin'] },
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
          <button onClick={() => { setUser(null); setActiveTab('dashboard'); }} className="hover:text-white">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <header className="bg-white shadow-sm px-8 py-6 sticky top-0 z-40">
          <h2 className="text-2xl font-bold text-[#2D4A3E] capitalize">{activeTab.replace('-', ' ')}</h2>
        </header>

        <div className="p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-xl font-bold text-[#2D4A3E]">Welcome to your Dashboard, {user.role}</h3>
              {user.role === 'Admin' && <AdminDashboard requests={profRequests} financeData={financeData} setFinanceData={setFinanceData} />}
              {user.role === 'Professor' && <ProfessorDashboard user={user} financeData={financeData} requests={profRequests} salaries={teachersSalaries} />}
              {user.role === 'Vendor' && <VendorDashboard user={user} requests={profRequests} />}
            </div>
          )}
          {activeTab === 'requests' && (
            <RequestView
              user={user}
              requests={profRequests}
              setRequests={setProfRequests}
              financeData={financeData}
              setFinanceData={setFinanceData} // <-- ADD THIS LINE
              vendorProducts={vendorProducts}
            />
          )}
          {activeTab === 'scanner' && (
            <ScannerView
              user={user}
              financeData={financeData}
              setFinanceData={setFinanceData}
              requests={profRequests}
              setRequests={setProfRequests}
              vendorProducts={vendorProducts}
            />
          )}
          {activeTab === 'salaries' && (
            <SalaryPortalView
              user={user}
              salaries={teachersSalaries}
              setSalaries={setTeachersSalaries}
              financeData={financeData}
            />
          )}
          {activeTab === 'auction' && (
            <AuctionCenterView
              requests={profRequests}
              setRequests={setProfRequests}
              vendorProducts={vendorProducts}
            />
          )}
          {activeTab === 'vendor' && <VendorPortalView
            user={user}
            vendorProducts={vendorProducts}
            setVendorProducts={setVendorProducts}
            requests={profRequests}
            setRequests={setProfRequests}
            financeData={financeData}
          />}
          {activeTab === 'finance' && <FinanceAnalyzerView financeData={financeData} />}
          {activeTab === 'fees' && <FeeManagementView />}
        </div>
      </main>
    </div>
  );
}

// --- LOGIN COMPONENT ---
function LoginView({ onLogin, onClose }) {
  const [regNum, setRegNum] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(regNum);
  };

  const containerContent = (
    <form onSubmit={handleSubmit} className="bg-white text-slate-900 p-10 rounded-2xl shadow-2xl border border-slate-200 w-96 relative animate-in zoom-in-95 duration-200">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      )}
      <div className="flex justify-center mb-6">
        <div className="bg-[#D4AF37] p-3 rounded-xl">
          <Building className="w-8 h-8 text-[#2D4A3E]" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-center text-[#2D4A3E] mb-2">Login to ScholiFi</h2>
      <p className="text-center text-slate-500 mb-8 text-sm">Use PRO-123, ADM-123, VEN-123, STD-0123, or PAR-0123</p>

      <input
        type="text"
        placeholder="Registration Number"
        className="w-full border border-slate-300 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[#2D4A3E] text-slate-900"
        value={regNum}
        onChange={(e) => setRegNum(e.target.value)}
      />
      <button
        type="submit"
        className="w-full bg-[#2D4A3E] text-white rounded-xl py-3 font-semibold hover:bg-[#1E332A] transition-colors"
      >
        Sign In
      </button>
    </form>
  );

  if (onClose) {
    return (
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        {containerContent}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#FBF9F5] items-center justify-center">
      {containerContent}
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
function RequestView({ user, requests, setRequests, financeData, setFinanceData, vendorProducts }) { // <-- ADDED IT HERE
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
      const apiBase = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiBase}/api/generate-rfp`, {
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

  const handleSubmit = async () => {
    if (!currentProduct || !quantity) return;

    const newRequestPayload = {
      prof_id: user.id,
      department_name: department,
      product_id: currentProduct.id,
      vendor_id: currentProduct.vendor,
      quantity: parseInt(quantity),
      custom_notes: desc,
      rfp_text: rfpText,
      status: 'Pending'
    };

    try {
      const { data, error } = await supabase.from('budget_requests').insert([newRequestPayload]).select();
      if (error) {
        console.error("Supabase request insertion failed:", error);
        alert("Database error: " + error.message);
        return;
      }
      const created = (data && data.length > 0) ? data[0] : { ...newRequestPayload, id: `local-${Math.random()}` };

      setRequests([...requests, {
        id: created.id,
        profId: created.prof_id,
        department: created.department_name,
        quantity: created.quantity,
        productId: created.product_id,
        productName: currentProduct.name,
        vendor: created.vendor_id,
        customNotes: created.custom_notes,
        rfp: created.rfp_text,
        status: created.status,
        budgetStatus: null
      }]);
    } catch (err) {
      console.error("Network error saving request:", err);
      // Fallback to local state
      setRequests([...requests, {
        id: `local-${Math.random()}`,
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
    }
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

  const handleApprove = async (id) => {
    try {
      await supabase.from('budget_requests').update({ status: 'Approved (Sent to Vendor)' }).eq('id', id);
    } catch (err) {
      console.error("Supabase update error:", err);
    }
    setRequests(requests.map(r => r.id === id ? { ...r, status: 'Approved (Sent to Vendor)' } : r));
  };

  // --- NEW: Open Modal instead of Alert ---
  const handleBuy = (req) => {
    setCheckoutReq(req);
  };

  // --- NEW: Confirm Payment Success ---
  // --- UPDATED: Confirm Payment Success & Deduct Budget ---
  const confirmPayment = async () => {
    const verifiedCost = checkoutReq.budgetStatus?.verifiedCost || 0;
    const deptName = checkoutReq.department;

    try {
      // 1. Update the order status to Paid
      await supabase.from('budget_requests').update({
        status: 'Paid & Ordered',
        verified_cost: verifiedCost
      }).eq('id', checkoutReq.id);

      // 2. Find the department and calculate their new total spent
      const dept = financeData.find(d => d.name === deptName);
      if (dept) {
        const newSpentAmount = (dept.spent || 0) + verifiedCost;

        // 3. Push the new spent amount to Supabase
        await supabase.from('departments').update({ spent: newSpentAmount }).eq('name', deptName);

        // 4. Instantly update the UI so the graphs change without a refresh!
        const updatedFinance = financeData.map(d =>
          d.name === deptName ? { ...d, spent: newSpentAmount } : d
        );
        setFinanceData(updatedFinance);
      }
    } catch (err) {
      console.error("Supabase update error:", err);
    }

    setRequests(requests.map(r => r.id === checkoutReq.id ? { ...r, status: 'Paid & Ordered' } : r));
    setCheckoutReq(null);
    alert(`Payment successful! ₹${verifiedCost.toLocaleString()} has been deducted from ${deptName}'s budget.`);
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
                    {user.role === 'Admin' && (req.status === 'Approved (Sent to Vendor)' || req.status === 'Contract Locked') && (
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
// --- NEW COMPONENT: Send Demo Invoice to Admin ---
function VendorSendInvoiceSection({ user, vendorProducts, financeData, requests, setRequests }) {
  const [invoiceProdId, setInvoiceProdId] = useState('');
  const [invoiceDept, setInvoiceDept] = useState('Computer Science');
  const [invoiceQty, setInvoiceQty] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [sendingInvoice, setSendingInvoice] = useState(false);

  const myProducts = Object.values(vendorProducts).flat().filter(p => p.vendor === user.id || p.vendor_id === user.id);

  useEffect(() => {
    if (myProducts.length > 0 && !invoiceProdId) {
      setInvoiceProdId(myProducts[0].id);
    }
  }, [myProducts, invoiceProdId]);

  const handleSendInvoice = async () => {
    const selectedProd = myProducts.find(p => p.id === invoiceProdId);
    if (!selectedProd) {
      return alert("Please select a product from your catalog.");
    }
    const qty = parseInt(invoiceQty);
    if (isNaN(qty) || qty <= 0) {
      return alert("Please enter a valid quantity.");
    }

    setSendingInvoice(true);
    const cost = selectedProd.price * qty;

    const newRequestPayload = {
      prof_id: user.id, // Vendor ID
      department_name: invoiceDept,
      product_id: selectedProd.id,
      vendor_id: user.id,
      quantity: qty,
      custom_notes: invoiceNotes || 'Demo Invoice sent by Vendor',
      rfp_text: 'Vendor Invoice Demo',
      status: 'Invoice Sent',
      verified_cost: cost
    };

    try {
      const { data, error } = await supabase.from('budget_requests').insert([newRequestPayload]).select();
      if (error) {
        throw error;
      }
      const created = (data && data.length > 0) ? data[0] : { ...newRequestPayload, id: `inv-${Math.random()}` };

      setRequests([...(requests || []), {
        id: created.id,
        profId: created.prof_id,
        department: created.department_name,
        quantity: created.quantity,
        productId: created.product_id,
        productName: selectedProd.name,
        vendor: created.vendor_id,
        customNotes: created.custom_notes,
        rfp: created.rfp_text,
        status: created.status,
        budgetStatus: {
          verifiedCost: cost,
          remainingBudget: 200000,
          isSufficient: true
        }
      }]);

      alert(`Success! Invoice for ₹${cost.toLocaleString()} sent to the Admin.`);
      setInvoiceQty('');
      setInvoiceNotes('');
    } catch (err) {
      console.error("Error sending invoice:", err);
      alert("Failed to send invoice: " + err.message);
    } finally {
      setSendingInvoice(false);
    }
  };

  if (myProducts.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mt-6">
        <h3 className="text-lg font-bold text-[#2D4A3E] mb-2">Send Demo Invoice to Admin</h3>
        <p className="text-sm text-slate-500">
          You don't have any products in your catalog yet. Add products to your catalog to send demo invoices to the Admin.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mt-6 space-y-4">
      <h3 className="text-lg font-bold text-[#2D4A3E]">Send Demo Invoice to Admin</h3>
      <p className="text-xs text-slate-500">
        Create and submit a mock invoice directly to the Admin's Invoice Scanner for approval and budget matching.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-bold text-slate-600">Select Item</label>
          <select
            value={invoiceProdId}
            onChange={e => setInvoiceProdId(e.target.value)}
            className="border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D4A3E] bg-white text-sm"
          >
            {myProducts.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} (₹{p.price.toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-xs font-bold text-slate-600">Target Department</label>
          <select
            value={invoiceDept}
            onChange={e => setInvoiceDept(e.target.value)}
            className="border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D4A3E] bg-white text-sm"
          >
            {(financeData || []).map(d => (
              <option key={d.name} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-xs font-bold text-slate-600">Quantity</label>
          <input
            type="number"
            placeholder="Quantity"
            value={invoiceQty}
            onChange={e => setInvoiceQty(e.target.value)}
            className="border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D4A3E] text-sm"
            min="1"
          />
        </div>
      </div>

      <div className="flex flex-col space-y-1">
        <label className="text-xs font-bold text-slate-600">Invoice Notes</label>
        <textarea
          placeholder="E.g., Hardware shipment invoice for Chemistry lab..."
          value={invoiceNotes}
          onChange={e => setInvoiceNotes(e.target.value)}
          className="border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D4A3E] text-sm"
          rows={2}
        />
      </div>

      <button
        onClick={handleSendInvoice}
        disabled={sendingInvoice}
        className="w-full bg-[#2D4A3E] text-white py-3 rounded-xl font-bold hover:bg-[#1E332A] transition-colors text-sm"
      >
        {sendingInvoice ? 'Sending Invoice...' : 'Send Demo Invoice to Admin'}
      </button>
    </div>
  );
}

function VendorPortalView({ user, vendorProducts, setVendorProducts, requests, setRequests, financeData }) {
  const [activeCategory, setActiveCategory] = useState('Tech');
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Tech');
  const [newItemBrand, setNewItemBrand] = useState('');
  const [customCategory, setCustomCategory] = useState(''); // --- NEW: State for custom category ---
  const [checkoutData, setCheckoutData] = useState(null);

  const handleAddProduct = async () => {
    if (!newItemName || !newItemPrice || !newItemBrand) {
      return alert("Please enter a name, brand, and price.");
    }

    const finalCategory = newItemCategory === 'Custom...' ? customCategory : newItemCategory;

    if (!finalCategory) {
      return alert("Please provide a category name.");
    }

    const payload = {
      category: finalCategory,
      name: newItemName,
      brand: newItemBrand,
      price: parseFloat(newItemPrice),
      vendor_id: user.id
    };

    // --- BULLETPROOF FIX: Try Database, Fallback to Local UI ---
    try {
      const { data, error } = await supabase.from('products').insert([payload]).select();

      if (error) {
        console.error('Supabase Error:', error);
        alert('Database error: ' + error.message);
        return;
      }

      // Supabase sometimes returns empty data [] if Row Level Security (RLS) is strict.
      // We fallback to the payload so the UI still updates!
      const created = (data && data.length > 0) ? data[0] : { ...payload, id: `prod-${Math.random()}` };

      const categoryList = vendorProducts[finalCategory] || [];
      setVendorProducts({
        ...vendorProducts,
        [finalCategory]: [...categoryList, created]
      });

      // Automatically switch to the newly created category tab!
      setActiveCategory(finalCategory);

    } catch (err) {
      console.error("Connection Error (Missing .env?):", err);
      // FALLBACK: If Supabase crashes (like missing API keys), just add it locally so your demo works!
      const created = { ...payload, id: `local-${Math.random()}` };
      const categoryList = vendorProducts[finalCategory] || [];
      setVendorProducts({
        ...vendorProducts,
        [finalCategory]: [...categoryList, created]
      });

      // Automatically switch to the newly created category tab!
      setActiveCategory(finalCategory);
    }

    // Reset the form
    setNewItemName('');
    setNewItemPrice('');
    setNewItemBrand('');
    setCustomCategory('');
    setNewItemCategory('Tech');
  };

  const handleRemoveProduct = async (category, productId) => {
    await supabase.from('products').delete().eq('id', productId);
    setVendorProducts({
      ...vendorProducts,
      [category]: vendorProducts[category].filter(p => p.id !== productId)
    });
  };

  const handleDirectPurchase = (prod) => {
    const qtyStr = window.prompt(`Direct Purchase: How many units of ${prod.name} would you like to buy?`);
    if (!qtyStr) return;

    const qty = parseInt(qtyStr);
    if (isNaN(qty) || qty <= 0) return alert("Please enter a valid number.");

    const totalCost = qty * prod.price;
    setCheckoutData({ prod, qty, totalCost });
  };

  const confirmDirectPayment = async () => {
    const newRequestPayload = {
      prof_id: user.id,
      department_name: 'Administration',
      product_id: checkoutData.prod.id,
      vendor_id: checkoutData.prod.vendor_id || checkoutData.prod.vendor,
      quantity: checkoutData.qty,
      custom_notes: 'Purchased directly from Vendor Portal by Admin',
      rfp_text: 'N/A - Direct Admin Purchase',
      status: 'Paid & Ordered',
      verified_cost: checkoutData.totalCost
    };

    const { data, error } = await supabase.from('budget_requests').insert([newRequestPayload]).select();

    if (error) {
      console.error('Error recording direct purchase:', error);
    } else if (data) {
      const created = data[0];
      setRequests([...(requests || []), {
        id: created.id,
        profId: created.prof_id,
        department: created.department_name,
        quantity: created.quantity,
        productId: created.product_id,
        productName: checkoutData.prod.name,
        vendor: created.vendor_id,
        customNotes: created.custom_notes,
        rfp: created.rfp_text,
        status: created.status,
        budgetStatus: {
          verifiedCost: checkoutData.totalCost,
          remainingBudget: 200000,
          isSufficient: true
        }
      }]);
    }

    alert(`Success! Purchased ${checkoutData.qty}x ${checkoutData.prod.name}.`);
    setCheckoutData(null);
  };

  return (
    <div className="space-y-6 relative">

      {/* Restored Modal and Auction House properly */}
      <VendorLiabilityModal user={user} requests={requests} setRequests={setRequests} />
      {user.role === 'Vendor' && <VendorAuctionHouse user={user} requests={requests} vendorProducts={vendorProducts} />}

      {user.role === 'Vendor' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-[#2D4A3E] mb-4">Add New Catalog Item</h3>
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            {/* --- UPDATED: Category Dropdown with Custom Option --- */}
            <select
              value={newItemCategory}
              onChange={e => setNewItemCategory(e.target.value)}
              className="border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D4A3E] md:w-1/4 bg-white"
            >
              {Object.keys(vendorProducts).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="Custom...">Custom...</option>
            </select>

            {/* --- NEW: Conditionally render custom category input --- */}
            {newItemCategory === 'Custom...' && (
              <input
                type="text"
                placeholder="New Category Name"
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                className="border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D4A3E] flex-1"
              />
            )}

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

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex space-x-4 mb-6 border-b pb-4 overflow-x-auto">
          {Object.keys(vendorProducts).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeCategory === cat ? 'bg-[#2D4A3E] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {(!vendorProducts[activeCategory] || vendorProducts[activeCategory].length === 0) ? (
          <p className="text-slate-500 text-sm">No items in this category.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vendorProducts[activeCategory].map(prod => (
              <div key={prod.id} className="border border-slate-100 p-4 rounded-xl flex justify-between items-center hover:shadow-md transition-shadow">
                <div>
                  <h4 className="font-bold text-[#2D4A3E]">
                    {prod.name}{prod.brand ? `, ${prod.brand}` : ''}
                  </h4>
                  <p className="text-sm text-slate-500">By {prod.vendor_id || prod.vendor}</p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <p className="font-bold text-[#D4AF37] text-lg">₹{prod.price.toLocaleString()}</p>

                  {user.role === 'Vendor' && (prod.vendor_id === user.id || prod.vendor === user.id) && (
                    <button
                      onClick={() => handleRemoveProduct(activeCategory, prod.id)}
                      className="text-xs mt-1 text-red-500 border border-red-500 px-3 py-1 rounded hover:bg-red-50 transition-colors font-medium"
                    >
                      Remove Item
                    </button>
                  )}

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

      {/* SEND DEMO INVOICE SECTION (Only visible to Vendors) */}
      {user.role === 'Vendor' && (
        <VendorSendInvoiceSection
          user={user}
          vendorProducts={vendorProducts}
          financeData={financeData}
          requests={requests}
          setRequests={setRequests}
        />
      )}

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
                  <span className="font-medium text-slate-800">{checkoutData.prod.vendor_id || checkoutData.prod.vendor}</span>
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

  // --- NEW: State for Smart Allocation ---
  const [surplusAmount, setSurplusAmount] = useState('');

  const handleEdit = (dept) => {
    setEditingDept(dept.name);
    setNewBudget(dept.budget);
  };

  const handleSave = async (deptName) => {
    const updatedVal = parseInt(newBudget);

    try {
      // Push manual edit to Supabase
      await supabase.from('departments').update({ budget: updatedVal }).eq('name', deptName);
    } catch (err) {
      console.error("Supabase update failed, continuing with local state for demo", err);
    }

    const updated = financeData.map(d => {
      if (d.name === deptName) {
        return { ...d, budget: updatedVal || d.budget };
      }
      return d;
    });
    setFinanceData(updated);
    setEditingDept(null);
  };

  // --- NEW: The Smart Allocation Logic (Supabase Compatible) ---
  const handleSmartAllocation = async () => {
    const surplus = parseFloat(surplusAmount);
    if (isNaN(surplus) || surplus <= 0) {
      return alert("Please enter a valid surplus amount.");
    }

    // 1. Calculate individual struggle scores (utilization rates)
    let totalStruggle = 0;
    const departmentsWithScores = financeData.map(dept => {
      const spentVal = dept.spent || 0;
      const utilizationRate = dept.budget > 0 ? (spentVal / dept.budget) : 0;
      totalStruggle += utilizationRate;
      return { ...dept, utilizationRate };
    });

    if (totalStruggle === 0) {
      return alert("No departments are currently spending. Cannot determine need.");
    }

    // 2. Distribute the surplus proportionally
    const updatedFinanceData = [...financeData];

    for (let i = 0; i < departmentsWithScores.length; i++) {
      const dept = departmentsWithScores[i];
      const allocationWeight = dept.utilizationRate / totalStruggle;
      const bonusFunds = Math.round(surplus * allocationWeight);
      const newBudgetTotal = dept.budget + bonusFunds;

      // Update local state array
      const index = updatedFinanceData.findIndex(d => d.name === dept.name);
      if (index !== -1) {
        updatedFinanceData[index] = { ...updatedFinanceData[index], budget: newBudgetTotal };
      }

      // 3. Try to update Supabase in the background
      try {
        await supabase.from('departments').update({ budget: newBudgetTotal }).eq('name', dept.name);
      } catch (err) {
        console.error(`Failed to update ${dept.name} in Supabase`, err);
      }
    }

    // 4. Update global state and reset UI
    setFinanceData(updatedFinanceData);
    setSurplusAmount('');
    alert(`Successfully distributed ₹${surplus.toLocaleString()} based on departmental need metrics!`);
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">

      {/* --- NEW: Smart Surplus Allocator Panel --- */}
      <div className="bg-gradient-to-r from-[#2D4A3E] to-[#1E332A] p-8 rounded-3xl shadow-lg border border-[#2D4A3E] relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ChartIcon className="w-48 h-48 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0 text-white md:w-1/2">
            <h3 className="text-2xl font-bold mb-2 flex items-center">
              <Sparkles className="w-6 h-6 mr-2 text-[#D4AF37]" />
              Smart Surplus Allocation
            </h3>
            <p className="text-sm text-blue-100 opacity-90 leading-relaxed">
              Did student enrollment increase? Enter surplus funds below. The algorithm evaluates the burn rate of each department and auto-distributes the capital to the sectors struggling the most.
            </p>
          </div>

          <div className="flex w-full md:w-auto space-x-3 bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/20">
            <input
              type="number"
              placeholder="Enter Surplus (₹)"
              value={surplusAmount}
              onChange={(e) => setSurplusAmount(e.target.value)}
              className="px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white text-[#2D4A3E] font-bold w-full md:w-48"
              min="1"
            />
            <button
              onClick={handleSmartAllocation}
              className="bg-[#D4AF37] text-white px-6 py-3 rounded-xl font-bold hover:bg-yellow-600 transition-colors shadow-md whitespace-nowrap"
            >
              Auto-Distribute
            </button>
          </div>
        </div>
      </div>

      {/* --- ORIGINAL: Department Budget Manager --- */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-[#D4AF37]/20 p-2 rounded-lg">
            <Wallet className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <h3 className="text-lg font-bold text-[#2D4A3E]">Department Budget Allocations</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {financeData.map(dept => {
            const spentVal = dept.spent || 0;
            const percent = (spentVal / dept.budget) * 100;
            const isEditing = editingDept === dept.name;

            return (
              <div key={dept.name} className="border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-slate-50 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#2D4A3E] group-hover:bg-[#D4AF37] transition-colors"></div>

                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="font-bold text-[#2D4A3E] text-lg">{dept.name}</h4>
                    <p className="text-sm text-slate-500 mt-0.5">Spent: ₹{spentVal.toLocaleString()}</p>
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

function ProfessorDashboard({ user, financeData, requests, salaries }) {
  // 1. Resolve department
  const profInfo = salaries ? salaries.find(t => t.id === user.id) : null;
  let myDeptName = profInfo ? profInfo.department : null;

  if (!myDeptName) {
    const myLastRequest = requests.find(r => r.profId === user.id);
    myDeptName = myLastRequest ? myLastRequest.department : 'Computer Science';
  }

  const dept = financeData.find(d => d.name === myDeptName) || { name: myDeptName, budget: 300000, spent: 0 };
  const percent = dept.budget > 0 ? (dept.spent / dept.budget) * 100 : 0;
  const isDanger = percent > 90;

  // 2. Personal Request Timeline
  const myRequests = requests.filter(r => r.profId === user.id);

  // Helper for tracking request status step
  const getStatusStep = (status) => {
    if (status.includes('Paid') || status.includes('Ordered')) return 3;
    if (status.includes('Approved')) return 2;
    return 1; // Pending
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">

      {/* 1. Isolated Department Tracker */}
      <div className="bg-[#2D4A3E] text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-60 h-20 bg-[#D4AF37]/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[#D4AF37] font-bold text-xs uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full">
                Isolated Department Budget
              </span>
              <h3 className="text-3xl font-black mt-2 tracking-tight">{dept.name}</h3>
            </div>
            <div className="text-left md:text-right">
              <p className="text-sm text-slate-300">Remaining Spending Power</p>
              <p className="text-3xl font-black text-[#D4AF37] mt-1">
                ₹{(dept.budget - dept.spent).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span>Budget Utilized: {percent.toFixed(1)}%</span>
              <span>Limit: ₹{dept.budget.toLocaleString()}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden border border-white/5">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${isDanger ? 'bg-red-500' : 'bg-gradient-to-r from-[#D4AF37] to-yellow-500'}`}
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
            </div>
            {isDanger && (
              <p className="text-xs text-red-300 font-bold flex items-center animate-pulse">
                ⚠️ Critical warning: You have utilized over 90% of your department budget.
              </p>
            )}
          </div>

          {/* Stats breakdown */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10 text-center">
            <div>
              <p className="text-xs text-slate-300 uppercase font-semibold">Total Allocated</p>
              <p className="text-lg font-bold text-white mt-1">₹{dept.budget.toLocaleString()}</p>
            </div>
            <div className="border-x border-white/10">
              <p className="text-xs text-slate-300 uppercase font-semibold">Total Spent</p>
              <p className="text-lg font-bold text-white mt-1">₹{dept.spent.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-300 uppercase font-semibold">Status</p>
              <p className={`text-lg font-bold mt-1 ${isDanger ? 'text-red-400' : 'text-green-400'}`}>
                {isDanger ? 'Restricted' : 'Healthy'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Personal Request Timeline */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
        <div>
          <h3 className="text-xl font-bold text-[#2D4A3E]">Your Request Tracking</h3>
          <p className="text-xs text-slate-500 mt-1">
            Real-time status tracking for items you have requested in the procurement system.
          </p>
        </div>

        {myRequests.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-sm text-slate-500">You haven't submitted any budget requests yet.</p>
            <p className="text-xs text-slate-400 mt-1">Head over to the "Budget Requests" tab to get started.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {myRequests.map(req => {
              const currentStep = getStatusStep(req.status);
              return (
                <div key={req.id} className="border border-slate-100 p-6 rounded-2xl bg-[#FBF9F5]/40 hover:shadow-md transition-all space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-[#2D4A3E] text-base">{req.quantity}x {req.productName}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Request ID: {req.id} | Vendor: {req.vendor}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-semibold">
                        {req.department}
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Timeline */}
                  <div className="pt-4 pb-2">
                    <div className="relative flex items-center justify-between">
                      {/* Background connecting line */}
                      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-200 z-0 rounded-full" />
                      {/* Active connecting line */}
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#2D4A3E] z-0 rounded-full transition-all duration-500"
                        style={{ width: `${currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%'}` }}
                      />

                      {/* Step 1: Pending */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 shadow-sm transition-all duration-300 ${currentStep >= 1
                          ? 'bg-[#2D4A3E] text-white border-[#2D4A3E]'
                          : 'bg-white text-slate-400 border-slate-200'
                          }`}>
                          1
                        </div>
                        <span className={`text-[10px] md:text-xs font-bold mt-2 ${currentStep >= 1 ? 'text-[#2D4A3E]' : 'text-slate-400'}`}>
                          Pending Admin
                        </span>
                      </div>

                      {/* Step 2: Approved */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 shadow-sm transition-all duration-300 ${currentStep >= 2
                          ? 'bg-[#2D4A3E] text-white border-[#2D4A3E]'
                          : 'bg-white text-slate-400 border-slate-200'
                          }`}>
                          2
                        </div>
                        <span className={`text-[10px] md:text-xs font-bold mt-2 ${currentStep >= 2 ? 'text-[#2D4A3E]' : 'text-slate-400'}`}>
                          Approved
                        </span>
                      </div>

                      {/* Step 3: Paid & Ordered */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 shadow-sm transition-all duration-300 ${currentStep >= 3
                          ? 'bg-[#2D4A3E] text-white border-[#2D4A3E]'
                          : 'bg-white text-slate-400 border-slate-200'
                          }`}>
                          3
                        </div>
                        <span className={`text-[10px] md:text-xs font-bold mt-2 ${currentStep >= 3 ? 'text-[#2D4A3E]' : 'text-slate-400'}`}>
                          Paid & Ordered
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
// --- ADMIN READ-ONLY LIVE AUCTION MONITOR ---
// --- ADMIN READ-ONLY LIVE AUCTION MONITOR (WITH DEMO BOTS) ---
// --- ADMIN READ-ONLY LIVE AUCTION MONITOR (WITH DEMO BOTS) ---
function AdminLiveAuctionCard({ req, handleCloseAuction, vendorProducts }) {
  const [lowestBid, setLowestBid] = useState(null);
  const [bidCount, setBidCount] = useState(0);

  // 1. UI POLLING: Updates the Admin's screen every 3 seconds
  useEffect(() => {
    const fetchBidData = async () => {
      const { data } = await supabase
        .from('bids')
        .select('*')
        .eq('request_id', req.id)
        .order('bid_amount', { ascending: true })
        .limit(1);

      if (data && data.length > 0) setLowestBid(data[0]);

      const { count } = await supabase
        .from('bids')
        .select('*', { count: 'exact', head: true })
        .eq('request_id', req.id);

      if (count !== null) setBidCount(count);
    };

    fetchBidData();
    const interval = setInterval(fetchBidData, 3000);
    return () => clearInterval(interval);
  }, [req.id]);

  // 2. DEMO BOT SIMULATOR FOR ADMIN VIEW (Decoupled from UI updates)
  useEffect(() => {
    if (req.status !== 'Open for Bidding') return;

    const botTimer = setInterval(async () => {
      // 40% chance to skip a beat for realism
      if (Math.random() > 0.6) return;

      // Calculate starting price based on the real catalog
      const allProducts = Object.values(vendorProducts || {}).flat();
      const product = allProducts.find(p => p.id === req.productId);
      const startingPrice = product ? (product.price * req.quantity) : 50000;

      // Fetch the absolute latest price directly from DB to avoid React state resetting the timer
      const { data } = await supabase
        .from('bids')
        .select('bid_amount')
        .eq('request_id', req.id)
        .order('bid_amount', { ascending: true })
        .limit(1);

      const currentPrice = (data && data.length > 0) ? data[0].bid_amount : startingPrice;

      const dropPercentage = (Math.random() * 0.01);
      let newBotBid = Math.floor(currentPrice - (currentPrice * dropPercentage));
      if (newBotBid >= currentPrice) newBotBid = currentPrice - 1;

      const botPayload = {
        request_id: req.id,
        vendor_id: `VEN-${Math.floor(Math.random() * 900) + 100}`,
        bid_amount: newBotBid
      };

      await supabase.from('bids').insert([botPayload]);
    }, 4500);

    return () => clearInterval(botTimer);
  }, [req.id, req.status, req.productId, req.quantity, vendorProducts]);

  return (
    <div className="border-2 border-[#D4AF37]/30 p-5 rounded-2xl bg-[#D4AF37]/5 relative overflow-hidden flex flex-col justify-between">
      <div>
        <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg tracking-wider animate-pulse">
          LIVE BIDS
        </div>
        <h4 className="font-bold text-[#2D4A3E] mb-1">{req.quantity}x {req.productName}</h4>
        <p className="text-sm text-slate-600 mb-4">Dept: {req.department}</p>

        <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Current Lowest</p>
          {lowestBid ? (
            <div>
              <p className="text-3xl font-bold text-[#D4AF37]">₹{lowestBid.bid_amount.toLocaleString()}</p>
              <p className="text-sm font-medium text-slate-600 mt-1">
                by {lowestBid.vendor_id} <span className="text-slate-400">({bidCount} total bids)</span>
              </p>
            </div>
          ) : (
            <p className="text-sm font-bold text-slate-400 my-2">Waiting for market bids...</p>
          )}
        </div>
      </div>

      <button
        onClick={() => handleCloseAuction(req.id)}
        className="w-full mt-2 bg-red-600 text-white px-4 py-3 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-md flex justify-center items-center"
      >
        <Gavel className="w-4 h-4 mr-2" /> End Auction & Lock Winner
      </button>
    </div>
  );
}

// --- ADMIN AUCTION CENTER VIEW ---
function AuctionCenterView({ requests, setRequests, vendorProducts }) {
  const pendingRequests = requests.filter(r => r.status === 'Pending');
  const activeAuctions = requests.filter(r => r.status === 'Open for Bidding');

  const handleBroadcast = async (req) => {
    const newStatus = 'Open for Bidding';
    const { error } = await supabase.from('budget_requests').update({ status: newStatus }).eq('id', req.id);

    if (error) {
      alert('Failed to broadcast auction: ' + error.message);
    } else {
      setRequests(requests.map(r => r.id === req.id ? { ...r, status: newStatus } : r));
    }
  };

  const handleCloseAuction = async (reqId) => {
    const { data: bids, error: bidError } = await supabase
      .from('bids')
      .select('*')
      .eq('request_id', reqId)
      .order('bid_amount', { ascending: true })
      .limit(1);

    if (bidError) return alert('Error fetching bids: ' + bidError.message);

    if (!bids || bids.length === 0) {
      return alert("You can't close this auction yet—no one has placed a bid!");
    }

    const winningBid = bids[0];
    const newStatus = 'Pending Liability';

    await supabase.from('bids').update({ is_winner: true }).eq('id', winningBid.id);

    await supabase.from('budget_requests').update({
      status: newStatus,
      vendor_id: winningBid.vendor_id,
      verified_cost: winningBid.bid_amount
    }).eq('id', reqId);

    setRequests(requests.map(r => r.id === reqId ? {
      ...r,
      status: newStatus,
      vendor: winningBid.vendor_id,
      budgetStatus: { ...r.budgetStatus, verifiedCost: winningBid.bid_amount }
    } : r));

    alert(`Auction Closed! Contract tentatively awarded to ${winningBid.vendor_id} for ₹${winningBid.bid_amount.toLocaleString()}. Awaiting their liability confirmation.`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-[#D4AF37]/20 p-2 rounded-lg">
            <Gavel className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <h3 className="text-lg font-bold text-[#2D4A3E]">Ready for Auction</h3>
        </div>

        {pendingRequests.length === 0 ? (
          <p className="text-slate-500 text-sm">No pending requests to broadcast.</p>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map(req => (
              <div key={req.id} className="border border-slate-100 p-4 rounded-xl flex justify-between items-center bg-slate-50 hover:shadow-sm transition-shadow">
                <div>
                  <h4 className="font-bold text-[#2D4A3E]">{req.quantity}x {req.productName}</h4>
                  <p className="text-sm text-slate-500 mt-1">Requested by: {req.profId} | Dept: {req.department}</p>
                </div>
                <button
                  onClick={() => handleBroadcast(req)}
                  className="bg-[#2D4A3E] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#1E332A] transition-colors shadow-sm"
                >
                  Broadcast to Vendors
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-[#2D4A3E] mb-4">Live Auctions</h3>

        {activeAuctions.length === 0 ? (
          <p className="text-slate-500 text-sm">No active auctions at the moment.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeAuctions.map(req => (
              <AdminLiveAuctionCard
                key={req.id}
                req={req}
                handleCloseAuction={handleCloseAuction}
                vendorProducts={vendorProducts}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
// --- VENDOR LIABILITY CLICKWRAP MODAL ---
function VendorLiabilityModal({ user, requests, setRequests }) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Find any auction this vendor just won that is waiting for signature
  const winningRequest = requests.find(r =>
    r.status === 'Pending Liability' &&
    (r.vendor === user.id || r.vendor_id === user.id)
  );

  // If they haven't won anything that needs signing, hide the modal completely
  if (!winningRequest) return null;

  const handleSignContract = async () => {
    if (!acceptedTerms) return alert("You must accept the liability terms to proceed.");

    // 1. Lock the contract in the database
    const newStatus = 'Contract Locked';
    const { error: reqError } = await supabase
      .from('budget_requests')
      .update({ status: newStatus })
      .eq('id', winningRequest.id);

    if (reqError) return alert("Error locking contract: " + reqError.message);

    // 2. Update the local UI state so the modal disappears
    setRequests(requests.map(r =>
      r.id === winningRequest.id ? { ...r, status: newStatus } : r
    ));

    alert("Contract Locked! The order is officially yours.");
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100]">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-[500px] relative animate-in zoom-in-95 duration-300 border-4 border-[#D4AF37]">

        <div className="text-center mb-6">
          <div className="bg-[#D4AF37]/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gavel className="w-8 h-8 text-[#D4AF37]" />
          </div>
          <h2 className="text-2xl font-bold text-[#2D4A3E]">Auction Won!</h2>
          <p className="text-slate-500 mt-2">You had the winning bid for this contract.</p>
        </div>

        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Item:</span>
            <span className="font-bold text-[#2D4A3E]">{winningRequest.quantity}x {winningRequest.productName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Department:</span>
            <span className="font-bold text-[#2D4A3E]">{winningRequest.department}</span>
          </div>
          <div className="w-full h-px bg-slate-200 my-2" />
          <div className="flex justify-between text-lg">
            <span className="font-bold text-slate-700">Final Bid Amount:</span>
            <span className="font-bold text-[#D4AF37]">
              ₹{winningRequest.budgetStatus?.verifiedCost?.toLocaleString() || 'N/A'}
            </span>
          </div>
        </div>

        {/* The Clickwrap Checkbox */}
        <div className="mb-6 flex items-start space-x-3 bg-red-50 p-4 rounded-xl border border-red-100">
          <input
            type="checkbox"
            id="liability"
            className="mt-1 w-5 h-5 accent-red-600 cursor-pointer"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
          />
          <label htmlFor="liability" className="text-sm text-red-900 cursor-pointer font-medium leading-relaxed">
            I agree to legally fulfill this order at the final bid price. I understand that failure to deliver may result in platform penalties.
          </label>
        </div>

        <button
          onClick={handleSignContract}
          className={`w-full py-3 rounded-xl font-bold transition-colors shadow-md ${acceptedTerms ? 'bg-[#2D4A3E] text-white hover:bg-[#1E332A]' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
        >
          Sign & Accept Contract
        </button>
      </div>
    </div>
  );
}
// --- VENDOR LIVE AUCTION & BOT SIMULATOR ---
// --- VENDOR LIVE AUCTION & BOT SIMULATOR ---
function VendorAuctionHouse({ user, requests, vendorProducts }) {
  const activeAuctions = requests.filter(r => r.status === 'Open for Bidding');
  const [activeBiddingId, setActiveBiddingId] = useState(null);
  const [bids, setBids] = useState([]);
  const [myBid, setMyBid] = useState('');

  const currentAuction = activeAuctions.find(r => r.id === activeBiddingId);

  // --- REAL PRICE CALCULATION ---
  const allProducts = Object.values(vendorProducts || {}).flat();
  const product = currentAuction ? allProducts.find(p => p.id === currentAuction.productId) : null;
  const startingPrice = product && currentAuction ? (product.price * currentAuction.quantity) : 50000;
  const currentLowest = bids.length > 0 ? Math.min(...bids.map(b => b.bid_amount)) : startingPrice;

  // 1. Fetch existing bids when a vendor clicks an auction
  useEffect(() => {
    if (!activeBiddingId) return;
    // ... rest of the component continues

    const fetchBids = async () => {
      const { data } = await supabase.from('bids').select('*').eq('request_id', activeBiddingId).order('created_at', { ascending: true });
      if (data) setBids(data);
    };
    fetchBids();
  }, [activeBiddingId]);

  // 2. THE BOT SIMULATOR: Auto-generates competitors
  useEffect(() => {
    if (!activeBiddingId) return;

    // Run the bot every 4.5 seconds
    const botTimer = setInterval(async () => {
      // 30% chance the bot decides not to bid this round (makes it feel human/random)
      if (Math.random() > 0.7) return;

      // Calculate a random drop between 0.1% and 1.0%
      const maxDrop = 0.01;
      const dropPercentage = (Math.random() * maxDrop);
      let newBotBid = Math.floor(currentLowest - (currentLowest * dropPercentage));

      // Ensure the bid actually drops by at least ₹1
      if (newBotBid >= currentLowest) newBotBid = currentLowest - 1;

      // Generate a random vendor name like "VEN-482"
      const randomVendorNum = Math.floor(Math.random() * 900) + 100;
      const botVendorId = `VEN-${randomVendorNum}`;

      const botPayload = {
        request_id: activeBiddingId,
        vendor_id: botVendorId,
        bid_amount: newBotBid
      };

      // Push bot bid to Supabase
      const { data } = await supabase.from('bids').insert([botPayload]).select();

      if (data) {
        setBids(prev => [...prev, data[0]]);
      }
    }, 4500);

    return () => clearInterval(botTimer); // Cleanup timer when they close the modal
  }, [activeBiddingId, currentLowest]);

  // 3. Handle Real Vendor's Bid
  const handleSubmitMyBid = async () => {
    const bidValue = parseInt(myBid);
    if (!bidValue || bidValue >= currentLowest) {
      return alert(`Your bid must be strictly lower than the current lowest bid (₹${currentLowest.toLocaleString()})`);
    }

    const payload = {
      request_id: activeBiddingId,
      vendor_id: user.id,
      bid_amount: bidValue
    };

    const { data } = await supabase.from('bids').insert([payload]).select();
    if (data) {
      setBids(prev => [...prev, data[0]]);
      setMyBid('');
    }
  };

  if (activeAuctions.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#D4AF37]/50 mt-6 relative overflow-hidden animate-in fade-in">
      <div className="absolute top-0 right-0 bg-[#D4AF37] text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl tracking-wider animate-pulse">
        LIVE REVERSE AUCTIONS
      </div>

      <h3 className="text-xl font-bold text-[#2D4A3E] mb-4 flex items-center">
        <Gavel className="w-6 h-6 mr-2 text-[#D4AF37]" /> Marketplace Bidding
      </h3>

      {/* List of active auctions */}
      {!activeBiddingId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeAuctions.map(req => (
            <div key={req.id} className="border border-slate-200 p-4 rounded-xl flex justify-between items-center hover:shadow-md transition-shadow">
              <div>
                <h4 className="font-bold text-[#2D4A3E]">{req.quantity}x {req.productName}</h4>
                <p className="text-sm text-slate-500">Dept: {req.department}</p>
              </div>
              <button
                onClick={() => setActiveBiddingId(req.id)}
                className="bg-[#D4AF37] text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-yellow-600 shadow-sm"
              >
                Join Auction
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* The Live Bidding War View */
        <div className="border border-slate-200 rounded-xl p-6 bg-slate-50">
          <div className="flex justify-between items-start mb-6">
            <div>
              <button onClick={() => setActiveBiddingId(null)} className="text-xs text-slate-500 hover:text-[#2D4A3E] font-bold mb-2 flex items-center">
                ← Back to Auctions
              </button>
              <h4 className="text-2xl font-bold text-[#2D4A3E]">{currentAuction.quantity}x {currentAuction.productName}</h4>
              <p className="text-sm text-slate-500">Bidding against simulated market competitors...</p>
            </div>
            <div className="text-right bg-white px-6 py-3 rounded-xl shadow-sm border border-[#D4AF37]/30">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Current Lowest</p>
              <p className="text-3xl font-bold text-[#D4AF37]">₹{currentLowest.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bid History Log */}
            <div className="bg-white border border-slate-200 rounded-xl h-64 overflow-y-auto p-4 flex flex-col-reverse">
              {bids.length === 0 ? (
                <p className="text-slate-400 text-sm text-center my-auto">Awaiting first bid...</p>
              ) : (
                <div className="space-y-2">
                  {bids.map((b, idx) => (
                    <div key={b.id || idx} className={`flex justify-between items-center p-2 rounded-lg text-sm ${b.vendor_id === user.id ? 'bg-[#2D4A3E]/10 border border-[#2D4A3E]/20' : 'bg-slate-50 border border-slate-100'}`}>
                      <span className="font-bold text-slate-700">
                        {b.vendor_id === user.id ? 'You (Me)' : b.vendor_id}
                      </span>
                      <span className="font-mono font-bold text-[#2D4A3E]">
                        ₹{b.bid_amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* My Bid Input */}
            <div className="flex flex-col justify-center bg-white border border-slate-200 rounded-xl p-6">
              <label className="text-sm font-bold text-slate-700 mb-2">Place Your Bid (₹)</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={myBid}
                  onChange={(e) => setMyBid(e.target.value)}
                  placeholder={`Must be < ${currentLowest}`}
                  className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-lg focus:outline-none focus:border-[#2D4A3E]"
                />
                <button
                  onClick={handleSubmitMyBid}
                  className="bg-[#2D4A3E] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#1E332A] transition-colors shadow-sm"
                >
                  Bid
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-3 text-center">
                Bids are legally binding. Winning bids will require digital liability confirmation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- INVOICE SCANNER VIEW ---
function ScannerView({ user, financeData, setFinanceData, requests, setRequests, vendorProducts }) {
  const [scanState, setScanState] = useState('idle'); // idle, scanning, result
  const [mockInvoice, setMockInvoice] = useState(null);

  const pendingInvoices = requests.filter(r => r.status === 'Invoice Sent');

  const handleUpload = (type) => {
    setScanState('scanning');
    setTimeout(() => {
      if (type === 'safe') {
        setMockInvoice({
          vendor: 'TechNova',
          amount: 25000,
          dept: 'Computer Science',
          items: [{ desc: 'Student Chromebooks (x1)', price: 25000 }]
        });
      } else {
        setMockInvoice({
          vendor: 'TechNova',
          amount: 95000,
          dept: 'Computer Science',
          items: [{ desc: 'High-End Developer Laptops (x2)', price: 95000 }]
        });
      }
      setScanState('result');
    }, 2000);
  };

  const handleProcessVendorInvoice = (inv) => {
    setScanState('scanning');
    setTimeout(() => {
      setMockInvoice({
        id: inv.id,
        vendor: inv.vendor,
        amount: inv.budgetStatus?.verifiedCost || inv.verified_cost || 0,
        dept: inv.department,
        items: [{ desc: `${inv.productName} (x${inv.quantity})`, price: inv.budgetStatus?.verifiedCost || inv.verified_cost || 0 }],
        isVendorInvoice: true
      });
      setScanState('result');
    }, 2000);
  };

  const handleApprove = async () => {
    const dept = financeData.find(d => d.name === mockInvoice.dept);
    const verifiedCost = mockInvoice.amount;
    const remainingBefore = dept ? (dept.budget - dept.spent) : 0;

    if (verifiedCost > remainingBefore) {
      alert('Cannot approve. Budget exceeded!');
      return;
    }

    try {
      // 1. Update the department spent budget in Supabase
      const newSpentAmount = (dept.spent || 0) + verifiedCost;
      await supabase.from('departments').update({ spent: newSpentAmount }).eq('name', mockInvoice.dept);

      if (mockInvoice.isVendorInvoice) {
        // Update the existing request in the database
        await supabase.from('budget_requests').update({
          status: 'Paid & Ordered',
          verified_cost: verifiedCost
        }).eq('id', mockInvoice.id);

        // Update local requests state
        setRequests(requests.map(r => r.id === mockInvoice.id ? {
          ...r,
          status: 'Paid & Ordered',
          budgetStatus: {
            verifiedCost: verifiedCost,
            remainingBudget: remainingBefore - verifiedCost,
            isSufficient: true
          }
        } : r));
      } else {
        // 2. Insert new budget request into Supabase with 'Paid & Ordered' status
        const newRequestPayload = {
          prof_id: user.id,
          department_name: mockInvoice.dept,
          product_id: 't2', // Using student chromebook
          vendor_id: mockInvoice.vendor,
          quantity: 1,
          custom_notes: 'Digitized and approved via AI OCR Scanner',
          rfp_text: 'N/A - Direct Scan & Approval',
          status: 'Paid & Ordered',
          verified_cost: verifiedCost
        };

        const { data, error } = await supabase.from('budget_requests').insert([newRequestPayload]).select();

        // Update local state
        const created = (data && data.length > 0) ? data[0] : { ...newRequestPayload, id: `local-${Math.random()}` };
        setRequests([...requests, {
          id: created.id,
          profId: created.prof_id,
          department: created.department_name,
          quantity: created.quantity,
          productId: created.product_id,
          productName: mockInvoice.items[0].desc,
          vendor: created.vendor_id,
          customNotes: created.custom_notes,
          rfp: created.rfp_text,
          status: created.status,
          budgetStatus: {
            verifiedCost: verifiedCost,
            remainingBudget: remainingBefore - verifiedCost,
            isSufficient: true
          }
        }]);
      }

      setFinanceData(financeData.map(d =>
        d.name === mockInvoice.dept ? { ...d, spent: newSpentAmount } : d
      ));

      alert(`Success! ₹${verifiedCost.toLocaleString()} has been spent from ${mockInvoice.dept}'s budget and PO has been created.`);
    } catch (err) {
      console.error("Supabase scanner approval failed:", err);
      alert("Error approving scan: " + err.message);
    }

    setScanState('idle');
    setMockInvoice(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-xl font-bold text-[#2D4A3E] mb-2 flex items-center">
          <ScanLine className="w-6 h-6 mr-2 text-[#D4AF37]" /> AI-Powered Invoice Digitizer
        </h3>
        <p className="text-sm text-slate-500">
          Upload physical invoice sheets here. The system uses AI OCR to extract values and automatically matches them with the remaining department funds to prevent accidental over-spending.
        </p>
      </div>

      {pendingInvoices.length > 0 && scanState === 'idle' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h4 className="text-lg font-bold text-[#2D4A3E] flex items-center">
            <span className="bg-[#D4AF37]/20 text-[#D4AF37] px-2.5 py-0.5 rounded-lg text-xs font-bold mr-2 uppercase">New</span>
            Pending Digital Invoices from Vendors
          </h4>
          <p className="text-xs text-slate-500">
            These invoices were digitally submitted by verified school vendors. You can process, match budget, and pay them directly using our AI OCR Scanner simulation.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            {pendingInvoices.map(inv => (
              <div key={inv.id} className="border border-slate-100 p-5 rounded-2xl flex flex-col justify-between hover:shadow-md transition-all bg-slate-50/50">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold bg-[#2D4A3E]/10 text-[#2D4A3E] px-2 py-1 rounded-lg">
                      {inv.department}
                    </span>
                    <span className="text-sm font-bold text-[#D4AF37]">
                      ₹{(inv.budgetStatus?.verifiedCost || inv.verified_cost || 0).toLocaleString()}
                    </span>
                  </div>
                  <h5 className="font-bold text-[#2D4A3E] mt-3">
                    {inv.productName} (x{inv.quantity})
                  </h5>
                  <p className="text-xs text-slate-500 mt-1">
                    Submitted by: <span className="font-mono">{inv.profId}</span>
                  </p>
                  {inv.customNotes && (
                    <p className="text-xs text-slate-400 mt-2 bg-white p-2 rounded-lg border border-slate-100 italic">
                      "{inv.customNotes}"
                    </p>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => handleProcessVendorInvoice(inv)}
                    className="bg-[#2D4A3E] text-white text-xs px-4 py-2 rounded-xl font-bold hover:bg-[#1E332A] transition-colors flex items-center"
                  >
                    <ScanLine className="w-3.5 h-3.5 mr-1" /> Digitize & Process
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {scanState === 'idle' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            className="border-2 border-dashed border-[#2D4A3E]/30 rounded-3xl bg-white p-12 text-center cursor-pointer hover:bg-slate-50 hover:border-[#2D4A3E] transition-all flex flex-col justify-between h-80"
            onClick={() => handleUpload('safe')}
          >
            <div>
              <div className="bg-[#2D4A3E]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-[#2D4A3E]" />
              </div>
              <h4 className="text-lg font-bold text-[#2D4A3E] mb-2">Simulate Safe Invoice Scan</h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                Scan an invoice of ₹25,000 for Computer Science department supplies (Safe within budget limit).
              </p>
            </div>
            <button className="bg-[#2D4A3E] text-white px-6 py-2.5 rounded-xl font-medium shadow-sm hover:bg-[#1E332A] transition-colors mt-4 self-center">
              Scan Safe Invoice
            </button>
          </div>

          <div
            className="border-2 border-dashed border-[#D4AF37]/30 rounded-3xl bg-white p-12 text-center cursor-pointer hover:bg-slate-50 hover:border-[#D4AF37] transition-all flex flex-col justify-between h-80"
            onClick={() => handleUpload('unsafe')}
          >
            <div>
              <div className="bg-[#D4AF37]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-[#D4AF37]" />
              </div>
              <h4 className="text-lg font-bold text-[#2D4A3E] mb-2">Simulate Budget-Exceeding Scan</h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                Scan an invoice of ₹95,000 for Computer Science department (Exceeds remaining department funds).
              </p>
            </div>
            <button className="bg-[#D4AF37] text-white px-6 py-2.5 rounded-xl font-medium shadow-sm hover:bg-yellow-600 transition-colors mt-4 self-center">
              Scan Overbudget Invoice
            </button>
          </div>
        </div>
      )}

      {scanState === 'scanning' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-16 text-center relative overflow-hidden h-80 flex flex-col justify-center items-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.8)] animate-pulse z-10" />
          <Loader2 className="w-12 h-12 text-[#2D4A3E] animate-spin mb-4" />
          <h3 className="text-xl font-bold text-[#2D4A3E] mb-2">AI OCR Engine Active</h3>
          <p className="text-slate-500 max-w-md">Digitizing items, extracting prices, and matching against real-time database allocations...</p>
        </div>
      )}

      {scanState === 'result' && mockInvoice && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold mb-6 flex items-center text-[#2D4A3E] border-b pb-4">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" /> Extracted Invoice Data
              </h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Supplier Vendor</span>
                  <span className="font-semibold text-slate-800">{mockInvoice.vendor}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Target Department</span>
                  <span className="font-semibold text-slate-800">{mockInvoice.dept}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Total Invoice Amount</span>
                  <span className="font-bold text-[#2D4A3E] text-lg">₹{mockInvoice.amount.toLocaleString()}</span>
                </div>

                <div className="mt-6">
                  <p className="text-slate-500 font-semibold mb-2">Extracted Items</p>
                  {mockInvoice.items.map((item, i) => (
                    <div key={i} className="flex justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <span className="text-slate-700 font-medium">{item.desc}</span>
                      <span className="font-bold text-[#2D4A3E]">₹{item.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <BudgetCheckWidget invoice={mockInvoice} financeData={financeData} />
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setScanState('idle');
                  setMockInvoice(null);
                }}
                className="flex-1 bg-white border border-slate-300 text-slate-700 px-4 py-3 rounded-xl font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 bg-[#2D4A3E] text-white px-4 py-3 rounded-xl font-medium shadow-sm hover:bg-[#1E332A] transition-colors"
              >
                Approve & Record Purchase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- AUTOMATED BUDGET CHECK WIDGET ---
function BudgetCheckWidget({ invoice, financeData }) {
  const dept = financeData.find(d => d.name === invoice.dept);
  const remainingBefore = dept ? (dept.budget - dept.spent) : 0;
  const exceeds = invoice.amount > remainingBefore;

  return (
    <div className={`p-6 rounded-3xl border ${exceeds ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
      <div className="flex items-start space-x-4 mb-4">
        {exceeds ? <AlertTriangle className="w-8 h-8 text-red-600 mt-1" /> : <CheckCircle className="w-8 h-8 text-green-600 mt-1" />}
        <div>
          <h4 className={`text-lg font-bold ${exceeds ? 'text-red-800' : 'text-green-800'}`}>Automated Budget Match</h4>
          <p className={`text-sm ${exceeds ? 'text-red-600' : 'text-green-700'}`}>
            {exceeds ? `Warning: Purchase exceeds ${dept?.name} budget!` : `Safe to proceed. Budget available.`}
          </p>
        </div>
      </div>

      <div className="space-y-2 mt-4 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>Available Dept Funds</span>
          <span className="font-semibold">₹{remainingBefore.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Invoice Digitized Amount</span>
          <span className="font-semibold text-red-600">-₹{invoice.amount.toLocaleString()}</span>
        </div>
        <div className="w-full h-px bg-slate-200 my-2" />
        <div className={`flex justify-between font-bold ${exceeds ? 'text-red-600' : 'text-green-700'}`}>
          <span>Projected Remaining Balance</span>
          <span>₹{(remainingBefore - invoice.amount).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

// --- SALARY PORTAL VIEW ---
function SalaryPortalView({ user, salaries, setSalaries, financeData }) {
  const [activeHistoryTeacher, setActiveHistoryTeacher] = useState(null); // For history modal
  const [recruitName, setRecruitName] = useState('');
  const [recruitId, setRecruitId] = useState('');
  const [recruitDept, setRecruitDept] = useState('Computer Science');
  const [recruitSalary, setRecruitSalary] = useState('');
  const [recruitSuccess, setRecruitSuccess] = useState('');
  const [recruitError, setRecruitError] = useState('');

  const [hikeTarget, setHikeTarget] = useState('all');
  const [hikePercentage, setHikePercentage] = useState('');
  const [hikeSuccess, setHikeSuccess] = useState('');
  const [hikeError, setHikeError] = useState('');

  // Professor Simulator State
  const [hikeSimVal, setHikeSimVal] = useState(0);

  // Derive metrics
  const totalPayroll = salaries.reduce((acc, curr) => acc + curr.currentSalary, 0);
  const avgSalary = salaries.length > 0 ? Math.round(totalPayroll / salaries.length) : 0;
  const activeStaff = salaries.length;

  // Calculate average hike
  let allHikePercentages = [];
  salaries.forEach(t => {
    if (t.hikeHistory && t.hikeHistory.length > 0) {
      t.hikeHistory.forEach(h => {
        allHikePercentages.push(h.percentage);
      });
    }
  });
  const avgHike = allHikePercentages.length > 0
    ? (allHikePercentages.reduce((a, b) => a + b, 0) / allHikePercentages.length).toFixed(1)
    : '0.0';

  // Recruit new teacher
  const handleRecruit = (e) => {
    e.preventDefault();
    setRecruitSuccess('');
    setRecruitError('');

    if (!recruitName.trim()) {
      setRecruitError('Please enter a valid name.');
      return;
    }
    const cleanId = recruitId.trim().toUpperCase();
    if (!cleanId.startsWith('PRO-')) {
      setRecruitError('Teacher ID must start with "PRO-" prefix.');
      return;
    }
    if (salaries.some(t => t.id === cleanId)) {
      setRecruitError(`Teacher ID ${cleanId} is already in use.`);
      return;
    }
    const startingSalary = parseFloat(recruitSalary);
    if (isNaN(startingSalary) || startingSalary <= 0) {
      setRecruitError('Starting salary must be a positive number.');
      return;
    }

    const newTeacher = {
      id: cleanId,
      name: recruitName.trim(),
      department: recruitDept,
      currentSalary: startingSalary,
      hikeHistory: []
    };

    setSalaries([...salaries, newTeacher]);
    setRecruitSuccess(`Successfully recruited ${newTeacher.name} (${newTeacher.id})!`);

    // Clear form
    setRecruitName('');
    setRecruitId('');
    setRecruitSalary('');
  };

  // Apply salary hike
  const handleApplyHike = (e) => {
    e.preventDefault();
    setHikeSuccess('');
    setHikeError('');

    const percentage = parseFloat(hikePercentage);
    if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
      setHikeError('Please enter a valid hike percentage (0 - 100%).');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    if (hikeTarget === 'all') {
      const updated = salaries.map(t => {
        const prev = t.currentSalary;
        const next = Math.round(prev * (1 + percentage / 100));
        return {
          ...t,
          currentSalary: next,
          hikeHistory: [
            ...(t.hikeHistory || []),
            { date: todayStr, percentage, prevSalary: prev, newSalary: next }
          ]
        };
      });
      setSalaries(updated);
      setHikeSuccess(`Successfully applied a ${percentage}% salary hike to all staff members!`);
    } else {
      const updated = salaries.map(t => {
        if (t.id === hikeTarget) {
          const prev = t.currentSalary;
          const next = Math.round(prev * (1 + percentage / 100));
          return {
            ...t,
            currentSalary: next,
            hikeHistory: [
              ...(t.hikeHistory || []),
              { date: todayStr, percentage, prevSalary: prev, newSalary: next }
            ]
          };
        }
        return t;
      });
      setSalaries(updated);
      const targetTeacher = salaries.find(t => t.id === hikeTarget);
      setHikeSuccess(`Successfully applied a ${percentage}% salary hike to ${targetTeacher.name}!`);
    }

    setHikePercentage('');
  };

  // Tax and net take home calculations for Simulator (Professor View)
  const calculateTakeHome = (monthlyGross) => {
    let tax = 0;
    if (monthlyGross > 150000) {
      tax += (monthlyGross - 150000) * 0.30;
      tax += 50000 * 0.20;
      tax += 50000 * 0.10;
    } else if (monthlyGross > 100000) {
      tax += (monthlyGross - 100000) * 0.20;
      tax += 50000 * 0.10;
    } else if (monthlyGross > 50000) {
      tax += (monthlyGross - 50000) * 0.10;
    }
    const net = monthlyGross - tax;
    return { tax, net };
  };

  // Find logged in professor info if user is Professor
  const profInfo = user.role === 'Professor' ? salaries.find(t => t.id === user.id) : null;
  const simulatedSalary = profInfo ? Math.round(profInfo.currentSalary * (1 + hikeSimVal / 100)) : 0;
  const simulatedCTC = simulatedSalary * 12;
  const { tax: simulatedTax, net: simulatedNet } = calculateTakeHome(simulatedSalary);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-xl font-bold text-[#2D4A3E] mb-2 flex items-center">
          <Wallet className="w-6 h-6 mr-2 text-[#D4AF37]" /> Salary & Compensation Portal
        </h3>
        <p className="text-sm text-slate-500">
          Secure portal to manage academic salaries, review payroll distribution, and model compensation enhancements.
        </p>
      </div>

      {user.role === 'Admin' && (
        <div className="space-y-8">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
              <div className="bg-[#2D4A3E]/10 p-3 rounded-xl">
                <Wallet className="w-6 h-6 text-[#2D4A3E]" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Payroll</p>
                <p className="text-xl font-bold text-[#2D4A3E]">₹{totalPayroll.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
              <div className="bg-[#D4AF37]/10 p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Salary</p>
                <p className="text-xl font-bold text-[#2D4A3E]">₹{avgSalary.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
              <div className="bg-[#2D4A3E]/10 p-3 rounded-xl">
                <Users className="w-6 h-6 text-[#2D4A3E]" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Staff</p>
                <p className="text-xl font-bold text-[#2D4A3E]">{activeStaff} Teachers</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
              <div className="bg-[#D4AF37]/10 p-3 rounded-xl">
                <Percent className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Hike</p>
                <p className="text-xl font-bold text-[#2D4A3E]">{avgHike}%</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Staff Directory Table */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-[#2D4A3E] mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-[#D4AF37]" /> Staff Payroll Directory
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead>
                    <tr className="border-b text-slate-400 uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-2">ID</th>
                      <th className="py-3 px-2">Name</th>
                      <th className="py-3 px-2">Dept</th>
                      <th className="py-3 px-2 text-right">Monthly</th>
                      <th className="py-3 px-2 text-right">Annual CTC</th>
                      <th className="py-3 px-2 text-center">Hikes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaries.map(teacher => {
                      const lastHike = teacher.hikeHistory && teacher.hikeHistory.length > 0
                        ? teacher.hikeHistory[teacher.hikeHistory.length - 1]
                        : null;
                      return (
                        <tr key={teacher.id} className="border-b hover:bg-slate-50">
                          <td className="py-4 px-2 font-mono font-bold text-xs text-[#D4AF37]">{teacher.id}</td>
                          <td className="py-4 px-2 font-bold text-[#2D4A3E]">{teacher.name}</td>
                          <td className="py-4 px-2 text-slate-500">{teacher.department}</td>
                          <td className="py-4 px-2 text-right font-bold">₹{teacher.currentSalary.toLocaleString()}</td>
                          <td className="py-4 px-2 text-right text-slate-500 font-medium">₹{(teacher.currentSalary * 12).toLocaleString()}</td>
                          <td className="py-4 px-2 text-center">
                            <button
                              onClick={() => setActiveHistoryTeacher(teacher)}
                              className="text-xs border border-[#2D4A3E]/30 text-[#2D4A3E] px-2.5 py-1 rounded-lg font-medium hover:bg-[#2D4A3E] hover:text-white transition-colors"
                            >
                              {lastHike ? `${lastHike.percentage}% Hike` : 'No History'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Panels */}
            <div className="space-y-6">
              {/* Apply Salary Hike Form */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-[#2D4A3E] mb-4 flex items-center">
                  <Percent className="w-5 h-5 mr-2 text-[#D4AF37]" /> Adjust Compensation
                </h3>
                <form onSubmit={handleApplyHike} className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold block mb-1">Target Recipient</label>
                    <select
                      value={hikeTarget}
                      onChange={e => setHikeTarget(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A3E] bg-white"
                    >
                      <option value="all">Apply to All Staff</option>
                      {salaries.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold block mb-1">Hike Amount</label>
                    <div className="flex space-x-2 mb-2">
                      {[2, 5, 10].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setHikePercentage(val)}
                          className="flex-1 border border-slate-200 py-1.5 rounded-lg text-xs font-bold hover:bg-[#2D4A3E] hover:text-white transition-all"
                        >
                          {val}%
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      placeholder="Custom Percentage (%)"
                      value={hikePercentage}
                      onChange={e => setHikePercentage(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A3E]"
                      min="0.1"
                      max="100"
                      step="0.1"
                    />
                  </div>

                  {hikeError && <p className="text-xs text-red-500 font-bold">{hikeError}</p>}
                  {hikeSuccess && <p className="text-xs text-green-600 font-bold">{hikeSuccess}</p>}

                  <button
                    type="submit"
                    className="w-full bg-[#2D4A3E] text-white py-2.5 rounded-xl font-medium hover:bg-[#1E332A] transition-colors text-sm shadow-sm"
                  >
                    Apply Hike
                  </button>
                </form>
              </div>

              {/* Recruit New Teacher Form */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-[#2D4A3E] mb-4 flex items-center">
                  <UserPlus className="w-5 h-5 mr-2 text-[#D4AF37]" /> Recruit Faculty
                </h3>
                <form onSubmit={handleRecruit} className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold block mb-1">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Prof. Vikas Gupta"
                      value={recruitName}
                      onChange={e => setRecruitName(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A3E]"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold block mb-1">Teacher ID</label>
                    <input
                      type="text"
                      placeholder="e.g. PRO-202"
                      value={recruitId}
                      onChange={e => setRecruitId(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A3E]"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold block mb-1">Department</label>
                    <select
                      value={recruitDept}
                      onChange={e => setRecruitDept(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A3E] bg-white"
                    >
                      {financeData.map(d => (
                        <option key={d.name} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold block mb-1">Monthly Salary (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 85000"
                      value={recruitSalary}
                      onChange={e => setRecruitSalary(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A3E]"
                    />
                  </div>

                  {recruitError && <p className="text-xs text-red-500 font-bold">{recruitError}</p>}
                  {recruitSuccess && <p className="text-xs text-green-600 font-bold">{recruitSuccess}</p>}

                  <button
                    type="submit"
                    className="w-full bg-[#D4AF37] text-white py-2.5 rounded-xl font-medium hover:bg-yellow-600 transition-colors text-sm shadow-sm"
                  >
                    Confirm Recruitment
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Teacher Hike History Modal */}
          {activeHistoryTeacher && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-3xl shadow-2xl w-[450px] relative border border-slate-200">
                <button
                  onClick={() => setActiveHistoryTeacher(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-bold text-[#2D4A3E] mb-2">{activeHistoryTeacher.name}</h3>
                <p className="text-xs text-slate-400 uppercase font-bold mb-4">{activeHistoryTeacher.id} • {activeHistoryTeacher.department}</p>

                <h4 className="font-bold text-sm text-[#2D4A3E] mb-2 border-b pb-2">Hike & Payroll Logs</h4>
                <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                  {(!activeHistoryTeacher.hikeHistory || activeHistoryTeacher.hikeHistory.length === 0) ? (
                    <p className="text-sm text-slate-400 text-center py-4">No payroll adjustments recorded yet.</p>
                  ) : (
                    activeHistoryTeacher.hikeHistory.map((h, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm">
                        <div>
                          <p className="font-bold text-[#2D4A3E]">{h.percentage}% Salary Hike</p>
                          <p className="text-[11px] text-slate-400">Date: {h.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#D4AF37]">₹{h.newSalary.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400">Was: ₹{h.prevSalary.toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {user.role === 'Professor' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left panel: Pay Summary & History */}
          <div className="md:col-span-2 space-y-8">
            {profInfo ? (
              <>
                {/* Compensation Card */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-[#D4AF37]/10 px-4 py-1 text-xs font-bold text-[#D4AF37] rounded-bl-xl uppercase">
                    Payroll Record Active
                  </div>
                  <h3 className="text-lg font-bold text-slate-400 uppercase tracking-wider mb-4">Current Compensation</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-3xl font-extrabold text-[#2D4A3E]">₹{profInfo.currentSalary.toLocaleString()}</p>
                      <p className="text-xs text-slate-400 mt-1 uppercase font-bold">Monthly Gross Pay</p>
                    </div>
                    <div>
                      <p className="text-3xl font-extrabold text-[#D4AF37]">₹{(profInfo.currentSalary * 12).toLocaleString()}</p>
                      <p className="text-xs text-slate-400 mt-1 uppercase font-bold">Annualized CTC</p>
                    </div>
                  </div>
                  <div className="w-full h-px bg-slate-100 my-6" />
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-slate-400 text-xs">Faculty Name</p>
                      <p className="font-bold text-[#2D4A3E] mt-0.5">{profInfo.name}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Teacher ID</p>
                      <p className="font-mono font-bold text-[#D4AF37] mt-0.5">{profInfo.id}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Department</p>
                      <p className="font-bold text-[#2D4A3E] mt-0.5">{profInfo.department}</p>
                    </div>
                  </div>
                </div>

                {/* History Timeline */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-[#2D4A3E] mb-6 flex items-center border-b pb-4">
                    <Award className="w-5 h-5 mr-2 text-[#D4AF37]" /> Adjustments Timeline
                  </h3>
                  {(!profInfo.hikeHistory || profInfo.hikeHistory.length === 0) ? (
                    <p className="text-slate-400 text-sm text-center py-6">No salary adjustments have been logged for this profile yet.</p>
                  ) : (
                    <div className="relative pl-6 border-l-2 border-slate-100 space-y-6">
                      {profInfo.hikeHistory.map((h, i) => (
                        <div key={i} className="relative">
                          <span className="absolute -left-[31px] top-1 bg-white border-2 border-[#D4AF37] w-4 h-4 rounded-full"></span>
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                            <div>
                              <p className="font-bold text-[#2D4A3E]">{h.percentage}% Promotion Hike</p>
                              <p className="text-xs text-slate-400 mt-0.5">Applied: {h.date}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-extrabold text-[#D4AF37]">₹{h.newSalary.toLocaleString()}</p>
                              <p className="text-[10px] text-slate-400">Previous: ₹{h.prevSalary.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-slate-500">Could not retrieve salary information for {user.id}.</p>
            )}
          </div>

          {/* Right panel: Salary Simulator */}
          {profInfo && (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-fit space-y-6">
              <h3 className="text-lg font-bold text-[#2D4A3E] flex items-center border-b pb-4">
                <Sparkles className="w-5 h-5 mr-2 text-[#D4AF37]" /> Income Estimator Simulator
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-700">Projected Salary Increase</span>
                  <span className="font-bold text-[#D4AF37]">{hikeSimVal}% Hike</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={hikeSimVal}
                  onChange={e => setHikeSimVal(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#2D4A3E]"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-bold px-1">
                  <span>0%</span>
                  <span>10%</span>
                  <span>20%</span>
                  <span>30%</span>
                </div>
              </div>

              <div className="w-full h-px bg-slate-100 my-6" />

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Est. Monthly Gross Pay:</span>
                  <span className="font-bold text-[#2D4A3E]">₹{simulatedSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Est. Annualized CTC:</span>
                  <span className="font-bold text-slate-800">₹{simulatedCTC.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Estimated Income Tax:</span>
                  <span className="font-bold text-red-500">-₹{Math.round(simulatedTax).toLocaleString()}</span>
                </div>
                <div className="w-full h-px bg-slate-100 my-4" />
                <div className="flex justify-between text-base font-bold bg-[#2D4A3E]/5 p-4 rounded-xl border border-[#2D4A3E]/10">
                  <span className="text-[#2D4A3E]">Projected Take-Home:</span>
                  <span className="text-[#D4AF37]">₹{Math.round(simulatedNet).toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-slate-400 text-center italic mt-2">
                  Take-home estimate is calculated using basic simulated monthly tax slabs.
                </p>
                <p className="text-[10px] text-slate-400 text-center italic mt-2">
                  Take-home estimate is calculated using basic simulated monthly tax slabs.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FeeManagementView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [newFee, setNewFee] = useState({ category: '', amount: '', dueDate: '', academicYear: '2026-2027' });
  const [reminderText, setReminderText] = useState('');
  const [isImportant, setIsImportant] = useState(true);
  const [toast, setToast] = useState(null);
  const [trigger, setTrigger] = useState(0);

  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem('scholifi_fee_students');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    return [
      { id: 'STD-0727', name: 'Aryan Sharma', class: '7th A', rollNo: 'STD0727', email: 'student.0727555@scholify.com', parentMobile: '+91 55566 60777' },
      { id: 'STD-101', name: 'Rohan Gupta', class: '8th B', rollNo: 'STD0101', email: 'student.101@scholify.com', parentMobile: '+91 99988 87701' },
      { id: 'STD-102', name: 'Priya Sen', class: '6th C', rollNo: 'STD0102', email: 'student.102@scholify.com', parentMobile: '+91 99988 87702' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('scholifi_fee_students', JSON.stringify(students));
  }, [students]);

  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudent, setNewStudent] = useState({ id: '', name: '', class: '', rollNo: '', email: '', parentMobile: '' });

  // Helper to parse currency string (e.g. "₹ 1,800.00" -> 1800)
  const parseAmount = (amtStr) => {
    if (!amtStr) return 0;
    const cleanStr = amtStr.replace(/[^\d.]/g, '');
    return parseFloat(cleanStr) || 0;
  };

  const getStudentData = (studentId) => {
    const savedNotices = localStorage.getItem(`scholifi_notices_${studentId}`);
    let notices = [];
    if (savedNotices) {
      try { notices = JSON.parse(savedNotices); } catch (e) { }
    } else {
      notices = studentId === 'STD-0727' ? [{ id: 1, text: '2 days left for fee payment', isImportant: true }] : [];
    }

    const savedUpcoming = localStorage.getItem(`scholifi_upcoming_payments_${studentId}`);
    let upcoming = [];
    if (savedUpcoming) {
      try { upcoming = JSON.parse(savedUpcoming); } catch (e) { }
    } else {
      upcoming = [
        {
          id: '1',
          academicYear: '2026-2027',
          feeCategory: 'Quarterly Fee (Installment 2 of 4)',
          amountToBePaid: '₹ 1,800.00',
          penalty: 'NA',
          dueDate: 'Aug 15, 2026',
          status: 'Due Soon',
        },
        {
          id: '2',
          academicYear: '2026-2027',
          feeCategory: 'Transport Fee (Term 2)',
          amountToBePaid: '₹ 800.00',
          penalty: '+ ₹ 100.00 Late Fee',
          dueDate: 'Jul 01, 2026',
          status: 'Overdue',
        },
      ];
    }

    const savedHistory = localStorage.getItem(`scholifi_payment_history_${studentId}`);
    let history = [];
    if (savedHistory) {
      try { history = JSON.parse(savedHistory); } catch (e) { }
    } else {
      history = [
        {
          id: '1',
          academicYear: '2026-2027',
          feeCategory: 'Quarterly Fee',
          amountPaid: '₹ 1,800.00',
          paymentDateTime: 'Mar 05, 2026 • 02:45 PM',
          transactionId: '#TXN-2026-8941',
          receiptNo: 'REC-2026-8941',
          paymentStatus: 'Success',
          paymentMethod: 'Netbanking',
          paymentType: 'Installment (1 of 4)',
          description: 'Quarterly Fee (Term 1 - Installment 1 of 4)',
          subtotal: '1,800.00',
          lateFine: '0.00',
          discount: '0.00',
          words: 'One Thousand Eight Hundred Rupees Only.',
        },
        {
          id: '2',
          academicYear: '2026-2027',
          feeCategory: 'Transport Fee',
          amountPaid: '₹ 800.00',
          paymentDateTime: 'Mar 05, 2026 • 09:15 AM',
          transactionId: '#TXN-2025-1092',
          receiptNo: 'REC-2025-1092',
          paymentStatus: 'Success',
          paymentMethod: 'UPI',
          paymentType: 'Full',
          description: 'Transport Fee (Term 1)',
          subtotal: '800.00',
          lateFine: '0.00',
          discount: '0.00',
          words: 'Eight Hundred Rupees Only.',
        },
      ];
    }

    return { notices, upcoming, history };
  };

  const saveStudentData = (studentId, data) => {
    if (data.notices) localStorage.setItem(`scholifi_notices_${studentId}`, JSON.stringify(data.notices));
    if (data.upcoming) localStorage.setItem(`scholifi_upcoming_payments_${studentId}`, JSON.stringify(data.upcoming));
    if (data.history) localStorage.setItem(`scholifi_payment_history_${studentId}`, JSON.stringify(data.history));
    setTrigger(prev => prev + 1);
  };

  const handleCreateStudentSubmit = (e) => {
    e.preventDefault();
    if (!newStudent.id.trim() || !newStudent.name.trim() || !newStudent.class.trim()) {
      return alert("ID, Name, and Class are required fields.");
    }

    const stdId = newStudent.id.trim().toUpperCase();
    if (!stdId.startsWith('STD-') && !stdId.startsWith('PAR-')) {
      return alert("Student/Parent ID must start with 'STD-' or 'PAR-' (e.g. STD-103) to enable portal login.");
    }

    if (students.some(s => s.id.toUpperCase() === stdId)) {
      return alert("A student with this ID already exists.");
    }

    const createdStudent = {
      id: stdId,
      name: newStudent.name.trim(),
      class: newStudent.class.trim(),
      rollNo: newStudent.rollNo.trim() || stdId.replace(/[^\d]/g, '') || 'STD-NEW',
      email: newStudent.email.trim() || `${stdId.toLowerCase()}@scholify.com`,
      parentMobile: newStudent.parentMobile.trim() || '+91 99999 88888'
    };

    setStudents([...students, createdStudent]);
    showToast(`Successfully added student ${createdStudent.name} (${createdStudent.id})!`);
    setNewStudent({ id: '', name: '', class: '', rollNo: '', email: '', parentMobile: '' });
    setShowAddStudentModal(false);
  };

  // Compile calculations for each student
  const studentStats = students.map(student => {
    const data = getStudentData(student.id);
    const totalPending = data.upcoming.reduce((acc, curr) => acc + parseAmount(curr.amountToBePaid), 0);
    const totalPaid = data.history.reduce((acc, curr) => acc + parseAmount(curr.amountPaid), 0);

    let earliestDueDate = 'N/A';
    if (data.upcoming.length > 0) {
      earliestDueDate = data.upcoming[0].dueDate;
    }

    let status = 'All Paid';
    if (data.upcoming.some(p => p.status === 'Overdue')) {
      status = 'Overdue';
    } else if (data.upcoming.some(p => p.status === 'Due Soon')) {
      status = 'Due Soon';
    }

    return {
      ...student,
      totalPending,
      totalPaid,
      earliestDueDate,
      status,
      duesCount: data.upcoming.length,
      data
    };
  });

  // KPI calculations
  const totalCollected = studentStats.reduce((acc, curr) => acc + curr.totalPaid, 0);
  const totalOutstanding = studentStats.reduce((acc, curr) => acc + curr.totalPending, 0);
  const totalReminders = studentStats.reduce((acc, curr) => acc + curr.data.notices.length, 0);
  const collectionRate = totalCollected + totalOutstanding > 0
    ? ((totalCollected / (totalCollected + totalOutstanding)) * 100).toFixed(1)
    : '100';

  const filteredStudents = studentStats.filter(s =>
    s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSendReminderSubmit = (e) => {
    e.preventDefault();
    if (!selectedStudent || !reminderText.trim()) return;

    const currentData = getStudentData(selectedStudent.id);
    const newNotice = {
      id: Date.now(),
      text: reminderText,
      isImportant: isImportant,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    };

    currentData.notices.unshift(newNotice);
    saveStudentData(selectedStudent.id, currentData);
    showToast(`Payment reminder sent to ${selectedStudent.id}!`);
    setReminderText('');
    setShowReminderModal(false);
  };

  const handleChargeFeeSubmit = (e) => {
    e.preventDefault();
    if (!selectedStudent || !newFee.category || !newFee.amount) return;

    const currentData = getStudentData(selectedStudent.id);
    const formattedAmount = `₹ ${parseFloat(newFee.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    const dateObj = new Date(newFee.dueDate);
    const formattedDueDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

    const newUpcomingItem = {
      id: String(Date.now()),
      academicYear: newFee.academicYear,
      feeCategory: newFee.category,
      amountToBePaid: formattedAmount,
      penalty: 'NA',
      dueDate: formattedDueDate,
      status: 'Due Soon'
    };

    currentData.upcoming.push(newUpcomingItem);
    saveStudentData(selectedStudent.id, currentData);
    showToast(`Fee charged successfully to ${selectedStudent.id}!`);
    setNewFee({ category: '', amount: '', dueDate: '', academicYear: '2026-2027' });
    setShowChargeModal(false);
  };

  const openReminderModal = (student, presetText = '') => {
    setSelectedStudent(student);
    setReminderText(presetText);
    setShowReminderModal(true);
  };

  const openChargeModal = (student) => {
    setSelectedStudent(student);
    setShowChargeModal(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 bg-[#2D4A3E] text-[#D4AF37] px-6 py-4 rounded-xl shadow-2xl z-50 border border-[#D4AF37]/30 flex items-center space-x-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold text-sm">{toast}</span>
        </div>
      )}

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Collection</p>
              <h3 className="text-2xl font-black text-[#2D4A3E] mt-2">₹{totalCollected.toLocaleString()}</h3>
            </div>
            <div className="bg-[#2D4A3E]/10 p-3 rounded-xl text-[#2D4A3E] group-hover:bg-[#2D4A3E] group-hover:text-white transition-all duration-300">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">Lifetime student payments</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Outstanding Dues</p>
              <h3 className="text-2xl font-black text-rose-600 mt-2">₹{totalOutstanding.toLocaleString()}</h3>
            </div>
            <div className="bg-rose-50 p-3 rounded-xl text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all duration-300">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">Unpaid student charges</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Active Reminders</p>
              <h3 className="text-2xl font-black text-[#D4AF37] mt-2">{totalReminders}</h3>
            </div>
            <div className="bg-amber-50 p-3 rounded-xl text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-white transition-all duration-300">
              <Bell className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">Notices sent to student dashboards</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Collection Rate</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-2">{collectionRate}%</h3>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${collectionRate}%` }}></div>
          </div>
        </div>
      </div>

      {/* Main Student Fee List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <h4 className="text-lg font-bold text-[#2D4A3E]">Student Fee Directory</h4>
            <button
              onClick={() => setShowAddStudentModal(true)}
              className="bg-[#D4AF37] text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-yellow-600 transition-colors flex items-center space-x-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Student</span>
            </button>
          </div>

          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Search student ID or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A3E]/20 focus:border-[#2D4A3E]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs tracking-wider text-center">
                <th className="py-4 px-6 text-left">Student Info</th>
                <th className="py-4 px-6 text-center">Class</th>
                <th className="py-4 px-6 text-center">Dues Count</th>
                <th className="py-4 px-6 text-center">Total Dues</th>
                <th className="py-4 px-6 text-center">Next Due Date</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 font-medium text-sm">
                    No students match the search criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-left">
                      <div>
                        <div className="font-bold text-slate-900">{student.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{student.id}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center font-semibold text-slate-800">{student.class}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${student.duesCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'}`}>
                        {student.duesCount} pending
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center font-bold text-[#2D4A3E]">
                      ₹{student.totalPending.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6 text-center text-slate-500 font-medium">{student.earliestDueDate}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${student.status === 'All Paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : student.status === 'Overdue'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                        }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => openReminderModal(student, `Overdue Reminder: Please settle outstanding fees of ₹ ${student.totalPending.toLocaleString()} immediately.`)}
                          disabled={student.duesCount === 0}
                          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${student.duesCount === 0
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-amber-50 text-amber-700 hover:bg-[#D4AF37] hover:text-white border border-amber-200'
                            }`}
                        >
                          <Bell className="w-3.5 h-3.5" />
                          <span>Remind</span>
                        </button>
                        <button
                          onClick={() => openChargeModal(student)}
                          className="flex items-center space-x-1.5 bg-[#2D4A3E]/10 text-[#2D4A3E] hover:bg-[#2D4A3E] hover:text-white border border-[#2D4A3E]/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Charge</span>
                        </button>
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="flex items-center space-x-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          <span>Details</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Student Details Sub-Panel */}
      {selectedStudent && !showChargeModal && !showReminderModal && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in duration-300 relative">
          <button
            onClick={() => setSelectedStudent(null)}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col md:flex-row justify-between md:items-center pb-6 border-b border-slate-100 gap-4">
            <div>
              <h4 className="text-lg font-bold text-[#2D4A3E]">Detailed Fee Ledger: {selectedStudent.name}</h4>
              <p className="text-xs text-slate-400 mt-1">Student ID: {selectedStudent.id} | Class: {selectedStudent.class} | Email: {selectedStudent.email}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openReminderModal(selectedStudent, `Fee Alert: Settle your upcoming fee installments.`)}
                className="bg-amber-50 text-amber-700 hover:bg-[#D4AF37] hover:text-white border border-amber-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm"
              >
                <Bell className="w-4 h-4" />
                <span>Send Custom Reminder</span>
              </button>
              <button
                onClick={() => openChargeModal(selectedStudent)}
                className="bg-[#2D4A3E] text-white hover:bg-[#1E332A] px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Charge New Fee</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">

            {/* Dues sub-table */}
            <div>
              <h5 className="font-bold text-sm text-[#2D4A3E] uppercase tracking-wider mb-3">Pending Charges</h5>
              <div className="border border-slate-150 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-150">
                    <tr>
                      <th className="py-2.5 px-4">Fee Category</th>
                      <th className="py-2.5 px-4 text-center">Due Date</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedStudent.data.upcoming.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-6 text-center text-slate-400 font-medium">No pending fees.</td>
                      </tr>
                    ) : (
                      selectedStudent.data.upcoming.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-medium text-slate-800">{item.feeCategory}</td>
                          <td className="py-3 px-4 text-center text-slate-500">{item.dueDate}</td>
                          <td className="py-3 px-4 text-right font-bold text-[#2D4A3E]">{item.amountToBePaid}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${item.status === 'Overdue' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paid History sub-table */}
            <div>
              <h5 className="font-bold text-sm text-[#2D4A3E] uppercase tracking-wider mb-3">Payment Receipts</h5>
              <div className="border border-slate-150 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-150">
                    <tr>
                      <th className="py-2.5 px-4">Fee Category</th>
                      <th className="py-2.5 px-4 text-center">Date & Time</th>
                      <th className="py-2.5 px-4 text-center">Transaction ID</th>
                      <th className="py-2.5 px-4 text-right">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedStudent.data.history.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-6 text-center text-slate-400 font-medium">No payment history found.</td>
                      </tr>
                    ) : (
                      selectedStudent.data.history.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-medium text-slate-800">{item.feeCategory}</td>
                          <td className="py-3 px-4 text-center text-slate-500">{item.paymentDateTime.split(' • ')[0]}</td>
                          <td className="py-3 px-4 text-center font-mono text-[10px] text-slate-500">{item.transactionId}</td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-600">{item.amountPaid}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charge Fee Modal */}
      {showChargeModal && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-[#2D4A3E] text-white flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-[#D4AF37]" />
                <h4 className="font-bold">Charge Fee: {selectedStudent.id}</h4>
              </div>
              <button
                onClick={() => setShowChargeModal(false)}
                className="text-slate-300 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChargeFeeSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Fee Category</label>
                <select
                  required
                  value={newFee.category}
                  onChange={(e) => setNewFee({ ...newFee, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A3E]/20 focus:border-[#2D4A3E]"
                >
                  <option value="">Select Category...</option>
                  <option value="Quarterly Fee (Installment 3 of 4)">Quarterly Fee (Installment 3 of 4)</option>
                  <option value="Exam Fee (Semester 2)">Exam Fee (Semester 2)</option>
                  <option value="Library Fine">Library Fine</option>
                  <option value="Sports Tournament Fee">Sports Tournament Fee</option>
                  <option value="Transport Fee (Term 3)">Transport Fee (Term 3)</option>
                  <option value="Science Lab Equipment Charge">Science Lab Equipment Charge</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Amount (INR ₹)</label>
                  <input
                    required
                    type="number"
                    min="1"
                    placeholder="1000"
                    value={newFee.amount}
                    onChange={(e) => setNewFee({ ...newFee, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A3E]/20 focus:border-[#2D4A3E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Academic Year</label>
                  <input
                    required
                    type="text"
                    value={newFee.academicYear}
                    onChange={(e) => setNewFee({ ...newFee, academicYear: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A3E]/20 focus:border-[#2D4A3E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Due Date</label>
                <input
                  required
                  type="date"
                  value={newFee.dueDate}
                  onChange={(e) => setNewFee({ ...newFee, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A3E]/20 focus:border-[#2D4A3E]"
                />
              </div>

              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowChargeModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#2D4A3E] text-white rounded-xl text-sm font-semibold hover:bg-[#1E332A] transition-colors shadow-sm"
                >
                  Charge Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Reminder Modal */}
      {showReminderModal && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-[#2D4A3E] text-white flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-[#D4AF37]" />
                <h4 className="font-bold">Send Reminder: {selectedStudent.id}</h4>
              </div>
              <button
                onClick={() => setShowReminderModal(false)}
                className="text-slate-300 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendReminderSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Student Details</label>
                <div className="bg-[#2D4A3E]/5 p-3 rounded-xl border border-[#2D4A3E]/10 space-y-1">
                  <p className="text-xs font-bold text-[#2D4A3E]">{selectedStudent.name}</p>
                  <p className="text-[10px] text-slate-500">Roll No: {selectedStudent.rollNo} | Class: {selectedStudent.class}</p>
                  <p className="text-[10px] text-slate-500">Outstanding: <span className="font-bold text-rose-600">₹{selectedStudent.totalPending.toLocaleString()}</span></p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Reminder Notice Text</label>
                <textarea
                  required
                  rows="4"
                  value={reminderText}
                  onChange={(e) => setReminderText(e.target.value)}
                  placeholder="Enter notice text here..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A3E]/20 focus:border-[#2D4A3E]"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isImportant"
                  checked={isImportant}
                  onChange={(e) => setIsImportant(e.target.checked)}
                  className="h-4 w-4 border-slate-300 rounded text-[#2D4A3E] focus:ring-[#2D4A3E]"
                />
                <label htmlFor="isImportant" className="text-xs text-slate-600 font-medium cursor-pointer">
                  Mark notice as Important (Red badge with flashing dot)
                </label>
              </div>

              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowReminderModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#D4AF37] text-white rounded-xl text-sm font-semibold hover:bg-yellow-600 transition-colors shadow-sm flex items-center justify-center space-x-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Notification</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-[#2D4A3E] text-white flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-[#D4AF37]" />
                <h4 className="font-bold">Add Student to Directory</h4>
              </div>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="text-slate-300 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudentSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Student ID</label>
                  <input
                    required
                    type="text"
                    placeholder="STD-103"
                    value={newStudent.id}
                    onChange={(e) => setNewStudent({ ...newStudent, id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A3E]/20 focus:border-[#2D4A3E]"
                  />
                  <p className="text-[9px] text-slate-400 mt-1">Must start with STD- or PAR-</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Roll Number</label>
                  <input
                    type="text"
                    placeholder="STD0103"
                    value={newStudent.rollNo}
                    onChange={(e) => setNewStudent({ ...newStudent, rollNo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A3E]/20 focus:border-[#2D4A3E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Full Name</label>
                <input
                  required
                  type="text"
                  placeholder="Ramu Sain"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A3E]/20 focus:border-[#2D4A3E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Class / Grade</label>
                  <input
                    required
                    type="text"
                    placeholder="9th B"
                    value={newStudent.class}
                    onChange={(e) => setNewStudent({ ...newStudent, class: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A3E]/20 focus:border-[#2D4A3E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Parent Mobile</label>
                  <input
                    type="text"
                    placeholder="+91 XXXXX XXXXX"
                    value={newStudent.parentMobile}
                    onChange={(e) => setNewStudent({ ...newStudent, parentMobile: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A3E]/20 focus:border-[#2D4A3E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="ramu.sain@scholify.com"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A3E]/20 focus:border-[#2D4A3E]"
                />
              </div>

              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#2D4A3E] text-white rounded-xl text-sm font-semibold hover:bg-[#1E332A] transition-colors shadow-sm"
                >
                  Create Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function LandingPageView({ onLogin, showLoginModal, setShowLoginModal }) {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: "How do I log in to the school portals?",
      a: "You can sign in using simulated registration codes. Standard test profiles include: ADM-123 (Admin), PRO-123 (Professor), VEN-123 (Vendor), STD-0727 (Student), or PAR-0123 (Parent)."
    },
    {
      q: "Can administrators add new students and parents?",
      a: "Yes! In the Admin Fee Management tab, admins can dynamically register new student details. The newly added registration number can then be used to log in directly."
    },
    {
      q: "How does the Invoice Scanner work?",
      a: "The Scanner utilizes automated parser simulations (integrated with database logs) to read uploaded PDF invoice receipts and calculate outstanding liabilities."
    },
    {
      q: "Is there a real budget allocation system?",
      a: "Yes. Department heads can submit budget requests, and admins can approve them or put them up for vendor auction bidding."
    }
  ];

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#162820] text-slate-100 font-sans antialiased overflow-x-hidden selection:bg-[#D4AF37] selection:text-[#162820]">
      {/* Header / Nav */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#162820]/80 backdrop-blur-md border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center space-x-2 cursor-pointer">
            <div className="bg-[#D4AF37] p-2 rounded-xl">
              <Building className="w-5 h-5 text-[#2D4A3E]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white flex items-center">
              Scholi<span className="text-[#D4AF37]">Fi</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          <div>
            <button
              onClick={() => setShowLoginModal(true)}
              className="bg-[#D4AF37] hover:bg-yellow-600 text-[#162820] font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg hover:shadow-yellow-500/10"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="about" className="relative min-h-[90vh] flex items-center justify-center pt-24 overflow-hidden">
        {/* Background Image with Dark Overlays */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/scholifi_hero_bg.png')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#162820]/95 via-[#162820]/75 to-[#162820]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(45,74,62,0.4)_0%,rgba(22,40,32,0.95)_100%)]" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1 className="text-4xl sm:text-6xl font-bold text-white tracking-tight leading-tight sm:leading-none">
            School Intelligence That <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-yellow-100 to-[#D4AF37]">Lights the Way</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-medium">
            ScholiFi connects teachers, students, parents, and administrators in a single, secure, and beautiful portal to automate fees, budgets, and communication.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <button
              onClick={() => setShowLoginModal(true)}
              className="w-full sm:w-auto bg-white hover:bg-slate-100 text-[#162820] font-bold px-8 py-4 rounded-xl shadow-2xl transition-all flex items-center justify-center space-x-2"
            >
              <span>Enter Portal</span>
            </button>
            <a
              href="#features"
              className="w-full sm:w-auto border border-white/20 hover:border-white/50 hover:bg-white/5 text-white font-bold px-8 py-4 rounded-xl transition-all flex items-center justify-center"
            >
              Explore Features
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-[#0E1A15] border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Our Unified School Ecosystem</h2>
            <p className="text-slate-400">All the tools you need to run, track, and optimize your school operations seamlessly.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* 1. Fee Administration */}
            <div className="bg-[#162820]/40 p-8 rounded-2xl border border-white/5 hover:border-[#D4AF37]/20 transition-all group space-y-4">
              <div className="bg-[#D4AF37]/10 p-3 rounded-xl w-fit group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <h3 className="text-lg font-bold text-white">Fee Administration</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Set custom charges (like library or science fees), log payouts, and automatically notify parents through direct student notice alerts.
              </p>
            </div>

            {/* 2. Invoice OCR Scanner */}
            <div className="bg-[#162820]/40 p-8 rounded-2xl border border-white/5 hover:border-[#D4AF37]/20 transition-all group space-y-4">
              <div className="bg-[#D4AF37]/10 p-3 rounded-xl w-fit group-hover:scale-110 transition-transform">
                <ScanLine className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <h3 className="text-lg font-bold text-white">Invoice OCR Scanner</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Upload and scan PDF receipts to extract department liabilities. Keep school ledger balances perfectly adjusted.
              </p>
            </div>

            {/* 3. Vendor Bidding */}
            <div className="bg-[#162820]/40 p-8 rounded-2xl border border-white/5 hover:border-[#D4AF37]/20 transition-all group space-y-4">
              <div className="bg-[#D4AF37]/10 p-3 rounded-xl w-fit group-hover:scale-110 transition-transform">
                <Gavel className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <h3 className="text-lg font-bold text-white">Vendor Bidding</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Publish open department requests to the Auction House where verified suppliers submit bids to supply school inventory.
              </p>
            </div>

            {/* 4. Staff Payroll */}
            <div className="bg-[#162820]/40 p-8 rounded-2xl border border-white/5 hover:border-[#D4AF37]/20 transition-all group space-y-4">
              <div className="bg-[#D4AF37]/10 p-3 rounded-xl w-fit group-hover:scale-110 transition-transform">
                <Wallet className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <h3 className="text-lg font-bold text-white">Staff Payroll</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Simulate take-home salary increments using tax models, approve salary hikes, and log teacher payroll history logs.
              </p>
            </div>

            {/* 5. AI Budget Requests */}
            <div className="bg-[#162820]/40 p-8 rounded-2xl border border-white/5 hover:border-[#D4AF37]/20 transition-all group space-y-4">
              <div className="bg-[#D4AF37]/10 p-3 rounded-xl w-fit group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <h3 className="text-lg font-bold text-white">AI Budget Requests</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Professors can generate professional Requests for Proposals (RFPs) instantly using integrated AI models.
              </p>
            </div>

            {/* 6. Finance Analyzer */}
            <div className="bg-[#162820]/40 p-8 rounded-2xl border border-white/5 hover:border-[#D4AF37]/20 transition-all group space-y-4">
              <div className="bg-[#D4AF37]/10 p-3 rounded-xl w-fit group-hover:scale-110 transition-transform">
                <ChartIcon className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <h3 className="text-lg font-bold text-white">Finance Analyzer</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Visualize total spending distribution and budget vs. spent statuses across all departments in real-time charts.
              </p>
            </div>

            {/* 7. Vendor E-Commerce Hub */}
            <div className="bg-[#162820]/40 p-8 rounded-2xl border border-white/5 hover:border-[#D4AF37]/20 transition-all group space-y-4">
              <div className="bg-[#D4AF37]/10 p-3 rounded-xl w-fit group-hover:scale-110 transition-transform">
                <Store className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <h3 className="text-lg font-bold text-white">Vendor Portal</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Empower vendors to manage dynamic product catalogs, track revenue, and submit digital invoices directly.
              </p>
            </div>

            {/* 8. Student & Parent Portals */}
            <div className="bg-[#162820]/40 p-8 rounded-2xl border border-white/5 hover:border-[#D4AF37]/20 transition-all group space-y-4">
              <div className="bg-[#D4AF37]/10 p-3 rounded-xl w-fit group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <h3 className="text-lg font-bold text-white">Student Portals</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Provide families with a beautiful interface to view fee ledgers, generate automated PDF receipts, and pay via UPI QR codes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Trusted by Leading Educators</h2>
            <p className="text-slate-400">Read what administrators, parents, and teachers say about our modern academic portal.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#162820]/20 p-8 rounded-2xl border border-white/5 space-y-6">
              <div className="flex text-[#D4AF37] space-x-1">
                {[...Array(5)].map((_, i) => <Award key={i} className="w-4 h-4 fill-[#D4AF37]" />)}
              </div>
              <p className="text-slate-300 italic text-sm leading-relaxed">
                "ScholiFi completely automated our bidding process and saved us over ₹ 2.5 Lakhs this semester alone."
              </p>
              <div className="flex items-center space-x-3 pt-2">
                <div className="bg-[#D4AF37]/10 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-[#D4AF37]">
                  DKG
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Dr. K. Gupta</h4>
                  <p className="text-[11px] text-slate-500">School Principal</p>
                </div>
              </div>
            </div>

            <div className="bg-[#162820]/20 p-8 rounded-2xl border border-white/5 space-y-6">
              <div className="flex text-[#D4AF37] space-x-1">
                {[...Array(5)].map((_, i) => <Award key={i} className="w-4 h-4 fill-[#D4AF37]" />)}
              </div>
              <p className="text-slate-300 italic text-sm leading-relaxed">
                "The fee reminder feature is a lifesaver. I can pay instantly and download my receipts directly from my phone."
              </p>
              <div className="flex items-center space-x-3 pt-2">
                <div className="bg-[#D4AF37]/10 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-[#D4AF37]">
                  AS
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Aryan's Parent</h4>
                  <p className="text-[11px] text-slate-500">Guardian Portal user</p>
                </div>
              </div>
            </div>

            <div className="bg-[#162820]/20 p-8 rounded-2xl border border-white/5 space-y-6">
              <div className="flex text-[#D4AF37] space-x-1">
                {[...Array(5)].map((_, i) => <Award key={i} className="w-4 h-4 fill-[#D4AF37]" />)}
              </div>
              <p className="text-slate-300 italic text-sm leading-relaxed">
                "Managing grade approvals and tracking CS department budgets has never been so seamless."
              </p>
              <div className="flex items-center space-x-3 pt-2">
                <div className="bg-[#D4AF37]/10 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-[#D4AF37]">
                  RRP
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Prof. R. Roy</h4>
                  <p className="text-[11px] text-slate-500">Department Head</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* FAQs */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Frequently Asked Questions</h2>
          <p className="text-slate-400">Everything you need to know about navigating the ScholiFi dashboard portals.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={index} className="bg-[#162820]/40 rounded-2xl border border-white/5 overflow-hidden transition-all">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-5 flex justify-between items-center text-left hover:bg-white/5 transition-colors"
                >
                  <span className="font-bold text-white text-sm sm:text-base">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#D4AF37]' : ''}`} />
                </button>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-48' : 'max-h-0'}`}>
                  <p className="px-6 pb-6 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-4">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-[#0E1A15]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <Building className="w-4 h-4 text-[#D4AF37]" />
            <span className="font-bold text-white">ScholiFi</span>
          </div>
          <p>© 2026 ScholiFi. All rights reserved.</p>
        </div>
      </footer>

      {/* Sign In Overlay Modal */}
      {showLoginModal && (
        <LoginView onLogin={onLogin} onClose={() => setShowLoginModal(false)} />
      )}
    </div>
  );
}