import React, { useState, useEffect } from 'react';

// Data Menu
const MENU_ITEMS = [
  { id: 1, name: 'Bubur', price: 4000, category: 'Makanan Utama' },
  { id: 2, name: 'Tim', price: 4000, category: 'Makanan Utama' },
  { id: 3, name: 'Puding', price: 3000, category: 'Cemilan' },
];

// Helper: Format ke Rupiah
const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number);
};

export default function KasirBuburApp() {
  const [cart, setCart] = useState([]);
  
  // 1. Ambil data dari localStorage saat aplikasi pertama kali dimuat
  const [history, setHistory] = useState(() => {
    try {
      const savedHistory = localStorage.getItem('riwayat_kasir_bubur');
      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (error) {
      console.error("Gagal memuat riwayat", error);
      return [];
    }
  });

  // 2. Simpan data ke localStorage otomatis setiap kali ada transaksi baru
  useEffect(() => {
    localStorage.setItem('riwayat_kasir_bubur', JSON.stringify(history));
  }, [history]);

  const [paymentAmount, setPaymentAmount] = useState('');
  const [activeTab, setActiveTab] = useState('kasir'); // 'kasir' atau 'riwayat'
  
  // State baru untuk popup (modal) menu custom
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customName, setCustomName] = useState('Bubur Custom');
  const [customPrice, setCustomPrice] = useState('');

  // Hitung total belanja di keranjang
  const totalCart = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const change = (parseInt(paymentAmount) || 0) - totalCart;
  const isPaymentValid = (parseInt(paymentAmount) || 0) >= totalCart && totalCart > 0;

  // Fungsi Tambah ke Keranjang
  const addToCart = (item) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem => 
          cartItem.id === item.id 
            ? { ...cartItem, qty: cartItem.qty + 1 } 
            : cartItem
        );
      }
      return [...prevCart, { ...item, qty: 1 }];
    });
  };

  // Fungsi Ubah Qty di Keranjang
  const updateQty = (id, delta) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === id) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : null;
        }
        return item;
      }).filter(Boolean); // Hapus item jika null (qty <= 0)
    });
  };

  // Fungsi Tambah Menu Custom
  const handleAddCustom = () => {
    if (!customName || !customPrice) return;
    const price = parseInt(customPrice);
    if (isNaN(price) || price <= 0) return;

    const customItem = {
      id: 'custom-' + Date.now(), // ID unik agar tidak bentrok dengan menu utama
      name: customName,
      price: price,
      category: 'Custom'
    };
    
    addToCart(customItem);
    setShowCustomModal(false);
    setCustomName('Bubur Custom'); // Reset form
    setCustomPrice('');
  };

  // Fungsi Proses Pembayaran
  const handlePayment = () => {
    if (!isPaymentValid) return;

    const newTransaction = {
      id: Date.now(), // Gunakan timestamp sebagai ID Unik
      date: new Date().toLocaleString('id-ID'),
      items: [...cart],
      total: totalCart,
      amountPaid: parseInt(paymentAmount),
      change: change
    };

    setHistory(prev => [newTransaction, ...prev]);
    setCart([]); // Kosongkan keranjang
    setPaymentAmount(''); // Reset input pembayaran
    alert('Pembayaran Berhasil!');
  };

  // Fungsi Export ke CSV (Excel)
  const exportToCSV = () => {
    if (history.length === 0) {
      alert("Belum ada data transaksi untuk diexport.");
      return;
    }

    // Header CSV
    let csvContent = "ID Transaksi,Tanggal & Waktu,Item Pesanan,Total Tagihan,Uang Dibayar,Kembalian\n";

    history.forEach(row => {
      const itemsString = row.items.map(i => `${i.name} (${i.qty}x)`).join(" + ");
      // Escape tanda kutip untuk mencegah format berantakan di excel
      csvContent += `"${row.id}","${row.date}","${itemsString}",${row.total},${row.amountPaid},${row.change}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Riwayat_Penjualan_Bubur_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-orange-50 font-sans text-gray-800">
      {/* Header */}
      <header className="bg-orange-600 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Kasir Bubur Nusantara
          </h1>
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('kasir')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'kasir' ? 'bg-white text-orange-600 shadow' : 'hover:bg-orange-500'}`}
            >
              Mesin Kasir
            </button>
            <button 
              onClick={() => setActiveTab('riwayat')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'riwayat' ? 'bg-white text-orange-600 shadow' : 'hover:bg-orange-500'}`}
            >
              Riwayat
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 py-6">
        {/* TAB 1: KASIR */}
        {activeTab === 'kasir' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Bagian Menu (Kiri/Atas) */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold mb-4 text-orange-900 border-b-2 border-orange-200 pb-2">Daftar Menu</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {MENU_ITEMS.map(item => (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 hover:border-orange-400 hover:shadow-md transition-all text-left flex flex-col justify-between h-32 active:scale-95"
                  >
                    <div>
                      <span className="text-xs font-semibold text-orange-500 uppercase tracking-wider">{item.category}</span>
                      <h3 className="font-bold text-gray-800 leading-tight mt-1">{item.name}</h3>
                    </div>
                    <div className="text-orange-600 font-bold">{formatRupiah(item.price)}</div>
                  </button>
                ))}
                
                {/* Tombol Menu Custom */}
                <button
                  onClick={() => setShowCustomModal(true)}
                  className="bg-orange-50 p-4 rounded-xl shadow-sm border-2 border-dashed border-orange-300 hover:border-orange-500 hover:bg-orange-100 transition-all text-center flex flex-col justify-center items-center h-32 active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-bold text-orange-700">Menu Custom</span>
                </button>
              </div>
            </div>

            {/* Bagian Keranjang & Pembayaran (Kanan/Bawah) */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col h-[calc(100vh-140px)] sticky top-[88px]">
              <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
                <h2 className="text-xl font-bold text-gray-800">Keranjang Pesanan</h2>
              </div>
              
              {/* Daftar Item Keranjang */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p>Keranjang masih kosong</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{item.name}</div>
                        <div className="text-orange-600 text-sm">{formatRupiah(item.price)}</div>
                      </div>
                      <div className="flex items-center gap-3 bg-white rounded-lg px-2 py-1 shadow-sm border border-gray-200">
                        <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-orange-600 hover:bg-orange-50 rounded-md font-bold text-lg">-</button>
                        <span className="w-6 text-center font-bold">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-orange-600 hover:bg-orange-50 rounded-md font-bold text-lg">+</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Area Total & Pembayaran */}
              <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600 font-medium">Total Tagihan</span>
                  <span className="text-2xl font-bold text-gray-900">{formatRupiah(totalCart)}</span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Uang Tunai (Rp)</label>
                    <input 
                      type="number"
                      className="w-full p-3 border border-gray-300 rounded-xl text-lg font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                      placeholder="Masukkan jumlah uang..."
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                  </div>
                  
                  {paymentAmount && (
                    <div className={`flex justify-between items-center p-3 rounded-xl ${change < 0 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                      <span className="font-medium">{change < 0 ? 'Uang Kurang' : 'Kembalian'}</span>
                      <span className="font-bold text-lg">{change < 0 ? formatRupiah(Math.abs(change)) : formatRupiah(change)}</span>
                    </div>
                  )}

                  <button 
                    onClick={handlePayment}
                    disabled={!isPaymentValid}
                    className={`w-full py-4 rounded-xl font-bold text-lg text-white transition-all shadow-md mt-2 ${isPaymentValid ? 'bg-orange-600 hover:bg-orange-700 active:scale-95' : 'bg-gray-300 cursor-not-allowed'}`}
                  >
                    {totalCart === 0 ? 'Pilih Pesanan Dulu' : 'Proses Pembayaran'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RIWAYAT TRANSAKSI */}
        {activeTab === 'riwayat' && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Riwayat Penjualan</h2>
                <p className="text-gray-500 text-sm mt-1">Daftar transaksi yang telah selesai dibayar.</p>
              </div>
              <button 
                onClick={exportToCSV}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Export Excel (.csv)
              </button>
            </div>
            
            <div className="overflow-x-auto">
              {history.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <p>Belum ada transaksi hari ini.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="p-4 text-sm font-semibold text-gray-600">Waktu</th>
                      <th className="p-4 text-sm font-semibold text-gray-600">Item Pesanan</th>
                      <th className="p-4 text-sm font-semibold text-gray-600 text-right">Total</th>
                      <th className="p-4 text-sm font-semibold text-gray-600 text-right">Tunai</th>
                      <th className="p-4 text-sm font-semibold text-gray-600 text-right">Kembalian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((tx) => (
                      <tr key={tx.id} className="border-b border-gray-100 hover:bg-orange-50/50 transition-colors">
                        <td className="p-4 text-sm text-gray-700 whitespace-nowrap">
                          {tx.date.split(', ')[0]} <br/>
                          <span className="text-xs text-gray-500">{tx.date.split(', ')[1]}</span>
                        </td>
                        <td className="p-4 text-sm text-gray-700 min-w-[200px]">
                          <ul className="list-disc list-inside">
                            {tx.items.map((item, idx) => (
                              <li key={idx}>{item.name} <span className="font-semibold text-orange-600">x{item.qty}</span></li>
                            ))}
                          </ul>
                        </td>
                        <td className="p-4 text-sm font-bold text-gray-900 text-right">{formatRupiah(tx.total)}</td>
                        <td className="p-4 text-sm text-gray-700 text-right">{formatRupiah(tx.amountPaid)}</td>
                        <td className="p-4 text-sm text-green-600 font-medium text-right">{formatRupiah(tx.change)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal Menu Custom */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Tambah Menu Custom</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Menu</label>
                <input 
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Misal: Bubur Setengah Porsi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp)</label>
                <input 
                  type="number"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="Misal: 2500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowCustomModal(false)}
                className="flex-1 py-3 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleAddCustom}
                disabled={!customName || !customPrice}
                className="flex-1 py-3 rounded-xl font-bold bg-orange-600 text-white hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                Tambahkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}