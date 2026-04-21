const SEED = [
    { kode: 'PRD-001', nama: 'Urea', kategori: 'Kimia',   stok: 50, harga: 100000, tanggal: '2026-01-10' },
    { kode: 'PRD-002', nama: 'Kompos', kategori: 'Organik', stok: 30, harga: 80000,  tanggal: '2026-01-15' },
    { kode: 'PRD-003', nama: 'NPK', kategori: 'Kimia',   stok: 40, harga: 120000, tanggal: '2026-02-01' },
    { kode: 'PRD-004', nama: 'Pupuk Kandang', kategori: 'Organik', stok: 3,  harga: 70000,  tanggal: '2026-02-10' },
];

const STORAGE_KEY = 'agromart_inventaris';

const loadData = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [...SEED];
};

const saveData = (arr) => localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));

let inventaris = loadData();
let editKode   = null;

const produkGrid   = document.getElementById('produkGrid');
const tabelBody    = document.getElementById('tabelBody');
const searchInput  = document.getElementById('searchInput');
const filterSel    = document.getElementById('filterKategori');
const cbFilters    = document.querySelectorAll('.cbFilter');
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle   = document.getElementById('modalTitle');
const modalClose   = document.getElementById('modalClose');
const btnTambah    = document.getElementById('btnTambah');
const btnSimpan    = document.getElementById('btnSimpan');

const fKode     = document.getElementById('fKode');
const fNama     = document.getElementById('fNama');
const fKategori = document.getElementById('fKategori');
const fStok     = document.getElementById('fStok');
const fHarga    = document.getElementById('fHarga');
const fTanggal  = document.getElementById('fTanggal');

const rupiah = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');

const formatTgl = (s) => s
    ? new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    : '-';

const renderGrid = (data) => {
    if (data.length === 0) {
        produkGrid.innerHTML = '<p class="empty-msg">Tidak ada produk ditemukan.</p>';
        return;
    }

    produkGrid.innerHTML = data.map(p => {
        const imgSrc   = p.nama.toLowerCase().replace(/\s+/g, '') + '.png';
        const fallback = `https://placehold.co/200x130/e8f5d0/76944C?text=${encodeURIComponent(p.nama)}`;
        return `
            <article class="card">
                <img src="${imgSrc}" alt="${p.nama}" onerror="this.src='${fallback}'">
                <h4>${p.nama}</h4>
                <p>${rupiah(p.harga)}</p>
                <span class="stok-badge ${p.stok < 10 ? 'stok-warn' : 'stok-ok'}">
                    Stok: ${p.stok}
                </span>
            </article>
        `;
    }).join('');
};

const renderTabel = (data) => {
    if (data.length === 0) {
        tabelBody.innerHTML = '<tr><td colspan="7" class="empty-msg">Tidak ada data.</td></tr>';
        return;
    }

    tabelBody.innerHTML = data.map(p => `
        <tr>
            <td>${p.kode}</td>
            <td>${p.nama}</td>
            <td>${p.kategori}</td>
            <td style="color:${p.stok < 10 ? '#c0392b' : 'inherit'}; font-weight:${p.stok < 10 ? '700' : '400'}">
                ${p.stok} ${p.stok < 10 ? '⚠️' : ''}
            </td>
            <td>${rupiah(p.harga)}</td>
            <td>${formatTgl(p.tanggal)}</td>
            <td>
                <button class="btn-edit"  data-kode="${p.kode}">Edit</button>
                <button class="btn-hapus" data-kode="${p.kode}">Hapus</button>
            </td>
        </tr>
    `).join('');
};

const updateStats = () => {
    document.getElementById('statTotal').textContent   = inventaris.length;
    document.getElementById('statNilai').textContent   = rupiah(
        inventaris.reduce((sum, p) => sum + p.harga * p.stok, 0)
    );
    document.getElementById('statMenipis').textContent = inventaris.filter(p => p.stok < 10).length;
};

const getFiltered = () => {
    const q   = searchInput.value.toLowerCase().trim();
    const cat = filterSel.value;
    const cbs = [...cbFilters].filter(c => c.checked).map(c => c.value);

    return inventaris.filter(p => {
        const matchQ   = !q || p.nama.toLowerCase().includes(q) || p.kode.toLowerCase().includes(q);
        const matchCat = !cat || p.kategori === cat;
        const matchCb  = cbs.length === 0 || cbs.includes(p.kategori);
        return matchQ && matchCat && matchCb;
    });
};

const renderAll = () => {
    const filtered = getFiltered();
    renderGrid(filtered);
    renderTabel(filtered);
    updateStats();
};

searchInput.addEventListener('input', renderAll);

filterSel.addEventListener('change', () => {
    const val = filterSel.value;
    cbFilters.forEach(cb => {
        cb.checked = val !== '' && cb.value === val;
    });
    renderAll();
});

cbFilters.forEach(cb => cb.addEventListener('change', () => {
    const checked = [...cbFilters].filter(c => c.checked).map(c => c.value);
    filterSel.value = checked.length === 1 ? checked[0] : '';
    renderAll();
}));

const openModal = (mode = 'tambah', kode = null) => {
    clearForm();
    clearValidation();

    if (mode === 'edit') {
        const p = inventaris.find(x => x.kode === kode);
        if (!p) return;
        editKode               = kode;
        modalTitle.textContent = 'Edit Produk';
        fKode.value            = p.kode;
        fKode.disabled         = true;
        fNama.value            = p.nama;
        fKategori.value        = p.kategori;
        fStok.value            = p.stok;
        fHarga.value           = p.harga;
        fTanggal.value         = p.tanggal;
    } else {
        editKode               = null;
        modalTitle.textContent = '+ Tambah Produk Baru';
        fKode.disabled         = false;
    }

    modalOverlay.classList.add('open');
};

const closeModal = () => modalOverlay.classList.remove('open');

btnTambah.addEventListener('click', () => openModal('tambah'));
modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});

const setValid = (inputId, ok) => {
    const fg = document.getElementById(inputId).closest('.form-group');
    fg.classList.toggle('invalid', !ok);
};

const clearValidation = () => {
    document.querySelectorAll('.form-group').forEach(fg => fg.classList.remove('invalid'));
};

const clearForm = () => {
    [fKode, fNama, fStok, fHarga, fTanggal].forEach(el => el.value = '');
    fKategori.value = '';
};

const validate = () => {
    let ok = true;

    const kodeVal  = fKode.value.trim();
    const kodeUnik = editKode !== null || !inventaris.some(p => p.kode === kodeVal);
    const kodeOk   = kodeVal !== '' && kodeUnik;
    setValid('fKode', kodeOk);
    if (!kodeOk) ok = false;

    const namaOk = fNama.value.trim() !== '';
    setValid('fNama', namaOk);
    if (!namaOk) ok = false;

    const katOk = fKategori.value !== '';
    setValid('fKategori', katOk);
    if (!katOk) ok = false;

    const stokOk = fStok.value !== '' && Number(fStok.value) >= 0;
    setValid('fStok', stokOk);
    if (!stokOk) ok = false;

    const hargaOk = fHarga.value !== '' && Number(fHarga.value) > 0;
    setValid('fHarga', hargaOk);
    if (!hargaOk) ok = false;

    const tglOk = fTanggal.value !== '';
    setValid('fTanggal', tglOk);
    if (!tglOk) ok = false;

    return ok;
};

btnSimpan.addEventListener('click', () => {
    if (!validate()) return;

    const produk = {
        kode:     fKode.value.trim(),
        nama:     fNama.value.trim(),
        kategori: fKategori.value,
        stok:     Number(fStok.value),
        harga:    Number(fHarga.value),
        tanggal:  fTanggal.value,
    };

    if (editKode !== null) {
        const idx = inventaris.findIndex(p => p.kode === editKode);
        inventaris[idx] = produk;
    } else {
        inventaris.push(produk);
    }

    saveData(inventaris);
    closeModal();
    renderAll();
});

tabelBody.addEventListener('click', (e) => {
    const kode = e.target.dataset.kode;
    if (!kode) return;

    if (e.target.classList.contains('btn-edit')) {
        openModal('edit', kode);
    }

    if (e.target.classList.contains('btn-hapus')) {
        const p = inventaris.find(x => x.kode === kode);
        const konfirmasi = confirm(`Hapus produk "${p.nama}" (${kode})?\nTindakan ini tidak dapat dibatalkan.`);
        if (konfirmasi) {
            inventaris = inventaris.filter(x => x.kode !== kode);
            saveData(inventaris);
            renderAll();
        }
    }
});

renderAll();