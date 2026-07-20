import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ScanLine, Wallet, Store, CheckCircle, AlertTriangle, FileText, Download, Building, Upload, DollarSign, Loader2 } from 'lucide-react';

const DEPARTMENTS = [
  { id: 'cs', name: 'Computer Science', total: 50000, spent: 48500 },
  { id: 'chem', name: 'Chemistry', total: 30000, spent: 12000 },
  { id: 'admin', name: 'Administration', total: 20000, spent: 5000 },
];

const INITIAL_POS = [
  { id: 'PO-1042', vendor: 'EduTech Laptops', amount: 15000, dept: 'Computer Science', status: 'Approved', date: '2026-07-15' },
  { id: 'PO-1043', vendor: 'LabCorp Supplies', amount: 3500, dept: 'Chemistry', status: 'Pending', date: '2026-07-18' },
];

const BIDS = [
  { id: 'BID-991', title: '50 Laptops for CS Lab', vendor: 'TechNova', amount: 45000, rating: 4.8 },
  { id: 'BID-992', title: '50 Laptops for CS Lab', vendor: 'EduSystems', amount: 42500, rating: 4.2 },
  { id: 'BID-993', title: 'Chemistry Glassware', vendor: 'ChemCo', amount: 3000, rating: 4.9 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [budgets, setBudgets] = useState(DEPARTMENTS);
  const [pos, setPos] = useState(INITIAL_POS);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-school-blue text-white flex flex-col shadow-xl z-10">
        <div className="p-6 flex items-center space-x-3 border-b border-blue-800">
          <div className="bg-school-gold p-2 rounded-lg">
            <Building className="w-6 h-6 text-school-blue" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">ScholiFi</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavItem icon={<LayoutDashboard />} label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<ScanLine />} label="Invoice Scanner" isActive={activeTab === 'scanner'} onClick={() => setActiveTab('scanner')} />
          <NavItem icon={<Wallet />} label="Budgets" isActive={activeTab === 'budgets'} onClick={() => setActiveTab('budgets')} />
          <NavItem icon={<Store />} label="Vendor Portal" isActive={activeTab === 'vendor'} onClick={() => setActiveTab('vendor')} />
        </nav>

        <div className="p-4 border-t border-blue-800 text-sm text-blue-300">
          <p>School District Admin</p>
          <p className="mt-1">© 2026 FinOps</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-50 relative">
        <header className="bg-white shadow-sm px-8 py-6 sticky top-0 z-0">
          <h2 className="text-2xl font-bold text-slate-800 capitalize">{activeTab.replace('-', ' ')}</h2>
        </header>

        <div className="p-8">
          {activeTab === 'dashboard' && <DashboardView budgets={budgets} pos={pos} />}
          {activeTab === 'scanner' && <ScannerView budgets={budgets} setBudgets={setBudgets} pos={pos} setPos={setPos} />}
          {activeTab === 'budgets' && <BudgetView budgets={budgets} />}
          {activeTab === 'vendor' && <VendorPortalView />}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-school-lightblue/20 text-school-goldlight font-medium' : 'text-blue-100 hover:bg-white/5 hover:text-white'
        }`}
    >
      {React.cloneElement(icon, { className: 'w-5 h-5' })}
      <span>{label}</span>
    </button>
  );
}

// ================= Views =================

function DashboardView({ budgets, pos }) {
  const totalBudget = budgets.reduce((acc, curr) => acc + curr.total, 0);
  const totalSpent = budgets.reduce((acc, curr) => acc + curr.spent, 0);
  const percentUsed = (totalSpent / totalBudget) * 100;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Budget" value={`$${totalBudget.toLocaleString()}`} icon={<Wallet className="w-8 h-8 text-school-blue" />} />
        <StatCard title="Total Spent" value={`$${totalSpent.toLocaleString()}`} subtitle={`${percentUsed.toFixed(1)}% utilized`} icon={<DollarSign className="w-8 h-8 text-school-gold" />} />
        <StatCard title="Pending POs" value={pos.filter(p => p.status === 'Pending').length.toString()} icon={<FileText className="w-8 h-8 text-orange-500" />} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-bold mb-4 text-slate-800">Recent Purchase Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-sm">
                <th className="pb-3 font-medium">PO ID</th>
                <th className="pb-3 font-medium">Vendor</th>
                <th className="pb-3 font-medium">Department</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium text-right">Amount</th>
                <th className="pb-3 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {pos.map(po => (
                <tr key={po.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="py-4 font-medium text-school-blue">{po.id}</td>
                  <td className="py-4">{po.vendor}</td>
                  <td className="py-4">{po.dept}</td>
                  <td className="py-4">{po.date}</td>
                  <td className="py-4 text-right font-medium">${po.amount.toLocaleString()}</td>
                  <td className="py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${po.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                      {po.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h4 className="text-3xl font-bold text-slate-800 mt-2">{value}</h4>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
      <div className="bg-slate-50 p-4 rounded-xl">
        {icon}
      </div>
    </div>
  );
}

function ScannerView({ budgets, setBudgets, pos, setPos }) {
  const [scanState, setScanState] = useState('idle'); // idle, scanning, result
  const [mockInvoice, setMockInvoice] = useState(null);

  const handleUpload = () => {
    setScanState('scanning');
    setTimeout(() => {
      setMockInvoice({
        vendor: 'TechNova',
        amount: 2500,
        dept: 'Computer Science', // Intentionally using CS which has 48500 spent out of 50000
        items: [{ desc: 'Oculus Quest 3 (x5)', price: 2500 }]
      });
      setScanState('result');
    }, 2500);
  };

  const handleApprove = () => {
    // Check budget
    const dept = budgets.find(b => b.name === mockInvoice.dept);
    if (dept.spent + mockInvoice.amount > dept.total) {
      alert('Cannot approve. Budget exceeded!');
      return;
    }

    // Update budget and POs
    setBudgets(budgets.map(b => b.name === mockInvoice.dept ? { ...b, spent: b.spent + mockInvoice.amount } : b));
    setPos([{ id: `PO-${Math.floor(Math.random() * 1000) + 2000}`, vendor: mockInvoice.vendor, amount: mockInvoice.amount, dept: mockInvoice.dept, status: 'Approved', date: new Date().toISOString().split('T')[0] }, ...pos]);
    setScanState('idle');
    setMockInvoice(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500">

      {scanState === 'idle' && (
        <div
          className="border-2 border-dashed border-school-blue/30 rounded-3xl bg-white p-16 text-center cursor-pointer hover:bg-school-lightblue/10 transition-colors"
          onClick={handleUpload}
        >
          <div className="bg-school-lightblue/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Upload className="w-10 h-10 text-school-blue" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Upload Paper Invoice</h3>
          <p className="text-slate-500 mb-6">Drag and drop or click to browse</p>
          <button className="bg-school-blue text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-school-blue/20 hover:bg-blue-800 transition-colors">
            Select File
          </button>
        </div>
      )}

      {scanState === 'scanning' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-school-gold/50 shadow-[0_0_15px_rgba(251,191,36,0.8)] animate-scan z-10" />
          <Loader2 className="w-12 h-12 text-school-blue animate-spin mx-auto mb-6" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">AI OCR Active</h3>
          <p className="text-slate-500">Digitizing invoice contents & cross-referencing vendor DB...</p>
        </div>
      )}

      {scanState === 'result' && mockInvoice && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center text-slate-800">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" /> Extracted Data
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Vendor</span>
                <span className="font-semibold text-slate-800">{mockInvoice.vendor}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Department</span>
                <span className="font-semibold text-slate-800">{mockInvoice.dept}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Total Amount</span>
                <span className="font-semibold text-school-blue text-lg">${mockInvoice.amount.toLocaleString()}</span>
              </div>

              <div className="mt-4">
                <p className="text-slate-500 mb-2">Line Items</p>
                {mockInvoice.items.map((item, i) => (
                  <div key={i} className="flex justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-slate-700">{item.desc}</span>
                    <span className="font-medium">${item.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <BudgetCheckWidget invoice={mockInvoice} budgets={budgets} />
            <div className="flex space-x-4">
              <button onClick={() => setScanState('idle')} className="flex-1 bg-white border border-slate-300 text-slate-700 px-4 py-3 rounded-xl font-medium hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleApprove} className="flex-1 bg-school-blue text-white px-4 py-3 rounded-xl font-medium shadow-lg shadow-school-blue/20 hover:bg-blue-800 transition-colors">
                Approve PO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BudgetCheckWidget({ invoice, budgets }) {
  const dept = budgets.find(b => b.name === invoice.dept);
  const remainingBefore = dept.total - dept.spent;
  const exceeds = invoice.amount > remainingBefore;

  return (
    <div className={`p-6 rounded-3xl border ${exceeds ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
      <div className="flex items-start space-x-4 mb-4">
        {exceeds ? <AlertTriangle className="w-8 h-8 text-red-500" /> : <CheckCircle className="w-8 h-8 text-green-600" />}
        <div>
          <h4 className={`text-lg font-bold ${exceeds ? 'text-red-800' : 'text-green-800'}`}>Automated Budget Match</h4>
          <p className={`text-sm ${exceeds ? 'text-red-600' : 'text-green-700'}`}>
            {exceeds ? `Warning: Purchase exceeds ${dept.name} budget!` : `Safe to proceed. Budget available.`}
          </p>
        </div>
      </div>

      <div className="space-y-2 mt-4 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>Remaining Budget</span>
          <span className="font-medium">${remainingBefore.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Invoice Amount</span>
          <span className="font-medium">-${invoice.amount.toLocaleString()}</span>
        </div>
        <div className="w-full h-px bg-slate-300 my-2" />
        <div className={`flex justify-between font-bold ${exceeds ? 'text-red-600' : 'text-green-700'}`}>
          <span>New Balance</span>
          <span>${(remainingBefore - invoice.amount).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

function BudgetView({ budgets }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold text-slate-800 mb-6">Department Budgets</h3>
        <div className="space-y-8">
          {budgets.map(dept => {
            const percent = (dept.spent / dept.total) * 100;
            const isDanger = percent > 90;
            return (
              <div key={dept.id}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold text-slate-700">{dept.name}</span>
                  <span className="text-slate-500">${dept.spent.toLocaleString()} / ${dept.total.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-1000 ${isDanger ? 'bg-red-500' : 'bg-school-blue'}`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
                {isDanger && (
                  <p className="text-xs text-red-500 mt-2 flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" /> Approaching budget limit
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function VendorPortalView() {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Open Contracts */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Open School Contracts</h3>
          <div className="space-y-4">
            <div className="p-4 border border-school-blue/30 bg-school-lightblue/10 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-school-gold text-white text-xs font-bold px-3 py-1 rounded-bl-lg">Accepting Bids</div>
              <h4 className="font-semibold text-slate-800 text-lg">50 Laptops for CS Lab</h4>
              <p className="text-sm text-slate-500 mt-1">Specs: 16GB RAM, 512GB SSD, i7 Processor</p>
              <div className="mt-4 flex space-x-2">
                <span className="text-xs bg-white text-school-blue border border-school-blue px-2 py-1 rounded">Dept: Computer Science</span>
                <span className="text-xs bg-white text-slate-600 border border-slate-200 px-2 py-1 rounded">Closes in 2 days</span>
              </div>
            </div>

            <div className="p-4 border border-slate-200 bg-slate-50 rounded-xl">
              <h4 className="font-semibold text-slate-800">Chemistry Glassware Replenishment</h4>
              <p className="text-sm text-slate-500 mt-1">Beakers, flasks, and pipettes for Fall term.</p>
            </div>
          </div>
        </div>

        {/* Bids Received */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Bids for: 50 Laptops</h3>
          <div className="space-y-4">
            {BIDS.filter(b => b.title.includes('Laptops')).map(bid => (
              <div key={bid.id} className="flex justify-between items-center p-4 border border-slate-100 rounded-xl hover:shadow-md transition-shadow">
                <div>
                  <h4 className="font-semibold text-slate-800">{bid.vendor}</h4>
                  <div className="flex items-center text-sm text-slate-500 mt-1 space-x-3">
                    <span className="flex items-center text-school-gold"><CheckCircle className="w-3 h-3 mr-1" /> {bid.rating} Rating</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-school-blue">${bid.amount.toLocaleString()}</p>
                  <button className="mt-2 text-xs bg-school-blue text-white px-3 py-1.5 rounded-lg hover:bg-blue-800 transition-colors">Award Contract</button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t pt-6">
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Simulate Vendor Bid</h3>
            <div className="flex space-x-2">
              <input type="text" placeholder="Bid Amount ($)" className="flex-1 border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/50" />
              <button className="bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors">Submit</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
