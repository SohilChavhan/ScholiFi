import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Wallet, Store, CheckCircle, FileText, Building, LineChart as ChartIcon, UserPlus, LogOut, Sparkles, X, Gavel, ScanLine, Upload, Loader2, AlertTriangle, TrendingUp, Percent, Users, Award } from 'lucide-react'; // Added 'X' icon for the close button
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { QRCodeSVG } from 'qrcode.react'; // --- NEW IMPORT ---
import { supabase } from './supabaseClient';

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
    else alert('Invalid Registration Number. Use PRO-..., ADM-..., or VEN-...');
  };

  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard />, roles: ['Admin', 'Professor', 'Vendor'] },
    { id: 'requests', label: 'Budget Requests', icon: <FileText />, roles: ['Admin', 'Professor'] },
    { id: 'scanner', label: 'Invoice Scanner', icon: <ScanLine />, roles: ['Admin', 'Professor'] },
    { id: 'salaries', label: 'Salary Portal', icon: <Wallet />, roles: ['Admin', 'Professor'] },
    { id: 'auction', label: 'Auction Center', icon: <Gavel />, roles: ['Admin'] }, // <-- NEW TAB
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
              vendorProducts={vendorProducts} // <-- ADD THIS LINE
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
function VendorPortalView({ user, vendorProducts, setVendorProducts, requests, setRequests }) {
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
function ScannerView({ user, financeData, setFinanceData, requests, setRequests }) {
  const [scanState, setScanState] = useState('idle'); // idle, scanning, result
  const [mockInvoice, setMockInvoice] = useState(null);

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
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}