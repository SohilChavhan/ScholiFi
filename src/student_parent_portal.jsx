import React, { useState, useEffect } from 'react';
import { LayoutDashboard, CreditCard, History, Building, LogOut, Download, X, FileText, CheckCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2pdf from 'html2pdf.js';

export default function StudentParentPortal({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [payNowItem, setPayNowItem] = useState(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const studentName = user.id;

  // Dynamically resolve student details based on ID
  const getStudentDetails = (id) => {
    const savedStudents = localStorage.getItem('scholifi_fee_students');
    if (savedStudents) {
      try {
        const list = JSON.parse(savedStudents);
        const match = list.find(s => s.id.toUpperCase() === id.toUpperCase());
        if (match) {
          return {
            class: match.class,
            rollNo: match.rollNo || match.id.replace(/[^\d]/g, '') || 'STD-NEW',
            email: match.email || `${match.id.toLowerCase()}@scholify.com`,
            parentMobile: match.parentMobile || '+91 99999 88888'
          };
        }
      } catch (e) { }
    }

    const stdId = id.toUpperCase();
    if (stdId === 'STD-101') {
      return { class: '8th B', rollNo: 'STD0101', email: 'student.101@scholify.com', parentMobile: '+91 99988 87701' };
    } else if (stdId === 'STD-102') {
      return { class: '6th C', rollNo: 'STD0102', email: 'student.102@scholify.com', parentMobile: '+91 99988 87702' };
    }
    // Default fallback (including STD-0727)
    return { class: '7th A', rollNo: 'STD0727', email: 'student.0727555@scholify.com', parentMobile: '+91 55566 60777' };
  };

  const stdDetails = getStudentDetails(user.id);

  // Dynamic state loaded from local storage
  const [notices, setNotices] = useState(() => {
    const saved = localStorage.getItem(`scholifi_notices_${user.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: 1, text: '2 days left for fee payment', isImportant: true }
    ];
  });

  const [paymentHistory, setPaymentHistory] = useState(() => {
    const saved = localStorage.getItem(`scholifi_payment_history_${user.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
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
  });

  const [upcomingPayments, setUpcomingPayments] = useState(() => {
    const saved = localStorage.getItem(`scholifi_upcoming_payments_${user.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
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
  });

  // Effects to synchronize state changes back to local storage
  useEffect(() => {
    localStorage.setItem(`scholifi_notices_${user.id}`, JSON.stringify(notices));
  }, [notices, user.id]);

  useEffect(() => {
    localStorage.setItem(`scholifi_payment_history_${user.id}`, JSON.stringify(paymentHistory));
  }, [paymentHistory, user.id]);

  useEffect(() => {
    localStorage.setItem(`scholifi_upcoming_payments_${user.id}`, JSON.stringify(upcomingPayments));
  }, [upcomingPayments, user.id]);

  const confirmFeePayment = () => {
    setPaymentConfirmed(true);

    if (payNowItem) {
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const newTxnId = `#TXN-${now.getFullYear()}-${randomNum}`;
      const newReceiptNo = `REC-${now.getFullYear()}-${randomNum}`;

      // --- NEW FIX: Correctly parse and add the base fee + penalty ---
      const rawSubtotal = parseFloat(payNowItem.amountToBePaid.replace(/[^\d.]/g, '')) || 0;
      const rawPenalty = payNowItem.penalty !== 'NA' ? (parseFloat(payNowItem.penalty.replace(/[^\d.]/g, '')) || 100) : 0;
      const finalTotal = rawSubtotal + rawPenalty;

      const newHistoryItem = {
        id: String(Date.now()),
        academicYear: payNowItem.academicYear,
        feeCategory: payNowItem.feeCategory.split('(')[0].trim(),
        amountPaid: `₹ ${finalTotal.toFixed(2)}`, // Uses the correctly calculated total
        paymentDateTime: `${formattedDate} • ${formattedTime}`,
        transactionId: newTxnId,
        receiptNo: newReceiptNo,
        paymentStatus: 'Success',
        paymentMethod: 'UPI',
        paymentType: payNowItem.feeCategory.includes('Installment') ? 'Installment' : 'Full',
        description: payNowItem.feeCategory,
        subtotal: rawSubtotal.toFixed(2),
        lateFine: rawPenalty.toFixed(2),
        discount: '0.00',
        words: 'Fee Payment Processed Successfully.',
      };

      setPaymentHistory((prev) => [newHistoryItem, ...prev]);
      setUpcomingPayments((prev) => prev.filter((p) => p.id !== payNowItem.id));
    }

    setTimeout(() => {
      setPayNowItem(null);
      setPaymentConfirmed(false);
    }, 2000);
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('receipt-print-area');
    if (!element) return;
    const opt = {
      margin: 0.4,
      filename: `${selectedReceipt?.receiptNo || 'Receipt'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard /> },
    { id: 'payments', label: 'Payments', icon: <CreditCard /> },
    { id: 'payment-history', label: 'Payment History', icon: <History /> },
  ];


  return (
    <div className="flex h-screen bg-[#FBF9F5] text-slate-900 font-sans animate-in fade-in duration-500">
      {/* Sidebar */}
      <aside className="w-64 bg-[#2D4A3E] text-white flex flex-col shadow-xl z-10">
        <div className="p-6 flex items-center space-x-3 border-b border-[#1E332A]">
          <div className="bg-[#D4AF37] p-2 rounded-lg">
            <Building className="w-6 h-6 text-[#2D4A3E]" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">ScholiFi</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === item.id
                ? 'bg-[#D4AF37]/20 text-[#D4AF37] font-medium'
                : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
            >
              {React.cloneElement(item.icon, { className: 'w-5 h-5' })}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#1E332A] text-sm text-gray-300 flex justify-between items-center">
          <div>
            <p className="font-bold text-[#D4AF37]">{user.role}</p>
            <p className="text-xs">{user.id}</p>
          </div>
          <button onClick={onLogout} className="hover:text-white transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <header className="bg-white shadow-sm px-8 py-6 sticky top-0 z-40">
          <h2 className="text-2xl font-bold text-[#2D4A3E] capitalize">
            {activeTab.replace('-', ' ')}
          </h2>
        </header>

        <div className="p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-xl font-bold text-[#2D4A3E]">
                Welcome, {studentName}!
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Part: Student Info */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h4 className="text-lg font-bold text-[#2D4A3E] mb-4">Student Information</h4>
                  <div className="divide-y divide-slate-100">
                    <div className="flex justify-between items-center py-3">
                      <span className="text-sm font-semibold text-slate-500">Name</span>
                      <span className="text-sm font-bold text-[#2D4A3E]">{studentName}</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-sm font-semibold text-slate-500">Class</span>
                      <span className="text-sm font-bold text-slate-800">{stdDetails.class}</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-sm font-semibold text-slate-500">Roll No.</span>
                      <span className="text-sm font-bold text-slate-800">{stdDetails.rollNo}</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-sm font-semibold text-slate-500">Email</span>
                      <span className="text-sm font-bold text-slate-800">{stdDetails.email}</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-sm font-semibold text-slate-500">Parent Mobile No.</span>
                      <span className="text-sm font-bold text-slate-800">{stdDetails.parentMobile}</span>
                    </div>
                  </div>
                </div>

                {/* Right Part: Notices */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h4 className="text-lg font-bold text-[#2D4A3E] mb-4">Notices</h4>
                  {notices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                      <p className="text-sm font-medium">No new notices</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notices.map(notice => (
                        <div
                          key={notice.id}
                          className={`flex items-center space-x-3 p-4 rounded-xl hover:shadow-sm transition-shadow duration-200 ${notice.isImportant ? 'bg-red-50 border border-red-100' : 'bg-slate-50 border border-slate-100'}`}
                        >
                          {notice.isImportant && (
                            <span className="flex items-center space-x-1.5 bg-red-100 text-red-700 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider whitespace-nowrap">
                              <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
                              <span>IMP</span>
                            </span>
                          )}
                          <span className="text-sm font-medium text-slate-700">
                            {notice.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-xl font-bold text-[#2D4A3E]">Payments</h3>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs tracking-wider text-center">
                        <th className="py-4 px-6 text-center">Academic Year</th>
                        <th className="py-4 px-6 text-center">Fee Category</th>
                        <th className="py-4 px-6 text-center">Amount to be paid</th>
                        <th className="py-4 px-6 text-center">Penalty</th>
                        <th className="py-4 px-6 text-center">Due Date</th>
                        <th className="py-4 px-6 text-center">Status</th>
                        <th className="py-4 px-6 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {upcomingPayments.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-8 text-center text-slate-400 font-medium text-sm">
                            No pending fee payments!
                          </td>
                        </tr>
                      ) : (
                        upcomingPayments.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-6 font-medium text-slate-900">{item.academicYear}</td>
                            <td className="py-4 px-6">{item.feeCategory}</td>
                            <td className="py-4 px-6 font-bold text-[#2D4A3E] whitespace-nowrap">{item.amountToBePaid}</td>
                            <td className="py-4 px-6 text-xs font-semibold whitespace-nowrap">
                              {item.penalty === 'NA' ? (
                                <span className="text-slate-400">NA</span>
                              ) : (
                                <span className="text-rose-600 font-bold">{item.penalty}</span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-slate-500 whitespace-nowrap">{item.dueDate}</td>
                            <td className="py-4 px-6 text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.status === 'Due Soon'
                                ? 'bg-amber-100 text-amber-800'
                                : item.status === 'Overdue'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <button
                                onClick={() => setPayNowItem(item)}
                                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#2D4A3E] text-white hover:bg-[#1E332A] transition-colors shadow-sm"
                              >
                                Pay Now
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payment-history' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-xl font-bold text-[#2D4A3E]">Payment History</h3>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs tracking-wider text-center">
                        <th className="py-4 px-6 text-center">Academic Year</th>
                        <th className="py-4 px-6 text-center">Fee Category</th>
                        <th className="py-4 px-6 text-center">Amount Paid</th>
                        <th className="py-4 px-6 text-center">Payment Date & Time</th>
                        <th className="py-4 px-6 text-center">Transaction ID</th>
                        <th className="py-4 px-6 text-center">Payment Status</th>
                        <th className="py-4 px-6 text-center">Payment Method</th>
                        <th className="py-4 px-6 text-center">Payment Type</th>
                        <th className="py-4 px-6 text-center">Receipts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {paymentHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6 font-medium text-slate-900">{item.academicYear}</td>
                          <td className="py-4 px-6">{item.feeCategory}</td>
                          <td className="py-4 px-6 font-bold text-[#2D4A3E] whitespace-nowrap">{item.amountPaid}</td>
                          <td className="py-4 px-6 text-slate-500 whitespace-nowrap">{item.paymentDateTime}</td>
                          <td className="py-4 px-6 font-mono text-xs text-slate-600">{item.transactionId}</td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.paymentStatus === 'Success'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.paymentStatus === 'Pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                              }`}>
                              {item.paymentStatus}
                            </span>
                          </td>
                          <td className="py-4 px-6">{item.paymentMethod}</td>
                          <td className="py-4 px-6 text-slate-600">{item.paymentType}</td>
                          <td className="py-4 px-6 text-center">
                            <button
                              onClick={() => setSelectedReceipt(item)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#2D4A3E]/10 text-[#2D4A3E] hover:bg-[#2D4A3E] hover:text-white transition-colors"
                            >
                              View Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Toolbar */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-[#2D4A3E]" />
                <h3 className="font-bold text-[#2D4A3E]">Receipt Viewer</h3>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center space-x-2 bg-[#2D4A3E] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#1E332A] transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Content Area */}
            <div className="p-8 overflow-auto bg-white text-slate-800 font-mono text-sm leading-relaxed" id="receipt-print-area">
              {/* Receipt Header Structure */}
              <div className="text-center space-y-1 mb-6 border-b-2 border-slate-800 pb-4">
                <h2 className="text-xl font-bold tracking-wider text-slate-900 uppercase">
                  {/* Mock Data, should be altered to editor's choice */}
                  XYZ School
                </h2>
                <p className="text-xs text-slate-600">
                  {/* Mock Data, should be altered to editor's choice */}
                  Mankhurd, Mumbai, 400088
                </p>
                <p className="text-xs text-slate-600">
                  {/* Mock Data, should be altered to editor's choice */}
                  Phone: +91 555 7770 666 | Email: XYZ@scholify.com
                </p>
              </div>

              <div className="text-center font-bold text-base tracking-widest my-4 uppercase">
                FEE PAYMENT RECEIPT
              </div>

              {/* Receipt Metadata */}
              <div className="grid grid-cols-2 gap-4 my-4 py-2 border-y border-dashed border-slate-400 text-xs">
                <div>
                  <p><span className="font-bold">Receipt No   :</span> {selectedReceipt.receiptNo}</p>
                  <p><span className="font-bold">Transaction ID:</span> {selectedReceipt.transactionId}</p>
                </div>
                <div className="text-right">
                  <p><span className="font-bold">Date     :</span> {selectedReceipt.paymentDateTime.split('•')[0]?.trim() || selectedReceipt.paymentDateTime}</p>
                  <p><span className="font-bold">Time     :</span> {selectedReceipt.paymentDateTime.split('•')[1]?.trim() || ''}</p>
                </div>
              </div>

              {/* Student Details Section */}
              <div className="my-4">
                <div className="font-bold text-xs uppercase tracking-wider mb-1 text-slate-900">STUDENT DETAILS</div>
                <div className="border-t border-slate-400 pt-2 grid grid-cols-2 gap-y-1 text-xs">
                  <p><span className="font-bold">Student Name :</span> {studentName}</p>
                  <p><span className="font-bold">Student ID :</span> {user.id}</p>
                  {/* Mock Data, should be altered to use database */}
                  <p><span className="font-bold">Grade / Class:</span> Grade 7 - Section A</p>
                  <p><span className="font-bold">Academic Yr:</span> {selectedReceipt.academicYear}</p>
                  {/* Mock Data, should be altered to use database */}
                  <p><span className="font-bold">Parent Name  :</span> FATHER</p>
                </div>
              </div>

              {/* Payment Details Table */}
              <div className="my-6">
                <div className="font-bold text-xs uppercase tracking-wider mb-1 text-slate-900">PAYMENT DETAILS</div>
                <table className="w-full text-xs border-t border-b border-slate-400 py-2">
                  <thead>
                    <tr className="border-b border-slate-300 text-slate-700">
                      <th className="py-2 text-left">DESCRIPTION</th>
                      <th className="py-2 text-right">AMOUNT (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-3 text-left">{selectedReceipt.description || selectedReceipt.feeCategory}</td>
                      <td className="py-3 text-right font-medium">{selectedReceipt.subtotal || selectedReceipt.amountPaid}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Subtotal & Totals */}
                <div className="flex flex-col items-end text-xs space-y-1 pt-3">
                  <div className="w-64 flex justify-between">
                    <span className="font-bold">SUBTOTAL    :</span>
                    <span>{selectedReceipt.subtotal || selectedReceipt.amountPaid}</span>
                  </div>
                  <div className="w-64 flex justify-between">
                    <span className="font-bold">LATE FINE   :</span>
                    <span>{selectedReceipt.lateFine || '0.00'}</span>
                  </div>
                  <div className="w-64 flex justify-between">
                    <span className="font-bold">DISCOUNT    :</span>
                    <span>{selectedReceipt.discount || '0.00'}</span>
                  </div>
                  <div className="w-64 border-t border-slate-400 my-1"></div>
                  <div className="w-64 flex justify-between font-bold text-sm text-slate-900">
                    <span>TOTAL PAID  :</span>
                    <span>{selectedReceipt.amountPaid}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method & Status */}
              <div className="border-t border-slate-400 pt-3 text-xs space-y-1">
                <p><span className="font-bold">Payment Method :</span> {selectedReceipt.paymentMethod}</p>
                <p><span className="font-bold">Payment Status :</span> <span className="font-bold text-emerald-700">{selectedReceipt.paymentStatus.toUpperCase()}</span></p>
                <p className="pt-2 italic"><span className="font-bold not-italic">Words:</span> {selectedReceipt.words || 'One Thousand Eight Hundred Rupees Only.'}</p>
              </div>

              {/* Footer Note */}
              <div className="mt-8 border-t border-dashed border-slate-400 pt-4 text-center text-[11px] text-slate-500">
                Note: This is a computer-generated receipt. No physical signature is required.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Payment Checkout Modal */}
      {payNowItem && (() => {
        // --- NEW FIX: Calculate total for the QR Code and Modal display ---
        const rawSubtotal = parseFloat(payNowItem.amountToBePaid.replace(/[^\d.]/g, '')) || 0;
        const rawPenalty = payNowItem.penalty !== 'NA' ? (parseFloat(payNowItem.penalty.replace(/[^\d.]/g, '')) || 100) : 0;
        const checkoutTotal = rawSubtotal + rawPenalty;

        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-3xl shadow-2xl w-[400px] relative animate-in zoom-in-95 duration-200">

              <button onClick={() => { setPayNowItem(null); setPaymentConfirmed(false); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800">
                <X className="w-6 h-6" />
              </button>

              {!paymentConfirmed ? (
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-[#2D4A3E] mb-1">Fee Checkout</h2>
                  <p className="text-slate-500 mb-6">Scan to pay with any UPI App</p>

                  <div className="bg-slate-50 p-6 rounded-2xl inline-block border border-slate-200 shadow-inner mb-6">
                    {/* --- UPDATED: Pass the calculated checkoutTotal to the QR Code --- */}
                    <QRCodeSVG
                      value={`upi://pay?pa=7770011695@ybl&pn=ScholiFi%20School&am=${checkoutTotal}&cu=INR`}
                      size={200}
                      level={"H"}
                      fgColor="#2D4A3E"
                    />
                  </div>

                  <div className="space-y-2 text-left bg-[#FBF9F5] p-4 rounded-xl border border-[#D4AF37]/30 mb-6">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Fee Category:</span>
                      <span className="font-medium text-slate-800">{payNowItem.feeCategory}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Academic Year:</span>
                      <span className="font-medium text-slate-800">{payNowItem.academicYear}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Due Date:</span>
                      <span className="font-medium text-slate-800">{payNowItem.dueDate}</span>
                    </div>
                    {payNowItem.penalty !== 'NA' && (
                      <div className="flex justify-between text-sm text-rose-600">
                        <span>Penalty:</span>
                        <span className="font-semibold">{payNowItem.penalty}</span>
                      </div>
                    )}
                    <div className="w-full h-px bg-slate-200 my-2" />
                    <div className="flex justify-between text-lg font-bold text-[#2D4A3E]">
                      <span>Total:</span>
                      {/* --- UPDATED: Display the calculated checkoutTotal --- */}
                      <span>₹ {checkoutTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={confirmFeePayment}
                    className="w-full bg-[#D4AF37] text-white py-3 rounded-xl font-medium hover:bg-yellow-600 transition-colors shadow-md"
                  >
                    I have completed the payment
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4 animate-in zoom-in-50 duration-300" />
                  <h2 className="text-2xl font-bold text-[#2D4A3E] mb-2">Payment Recorded!</h2>
                  <p className="text-slate-500 text-sm">Your payment is being verified. This window will close automatically.</p>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
