/* =======================================================
   LOGIKA TO-DO LIST
   Semua data disimpan di localStorage browser (tanpa server/database),
   jadi tugas tetap ada walau halaman ditutup, tapi hanya tersimpan
   di browser & perangkat ini saja.
   ======================================================= */

// Key yang dipakai untuk menyimpan data di localStorage
const STORAGE_KEY = 'daftar-tugas-struk';

// Filter tampilan yang sedang aktif: 'semua' | 'aktif' | 'selesai'
let currentFilter = 'semua';

// Ambil semua elemen HTML yang akan sering dipakai
const addForm     = document.getElementById('addForm');
const taskInput   = document.getElementById('taskInput');
const taskList    = document.getElementById('taskList');
const emptyState  = document.getElementById('emptyState');
const filterRow   = document.getElementById('filterRow');
const clearBtn    = document.getElementById('clearBtn');
const sumTotal    = document.getElementById('sumTotal');
const sumDone     = document.getElementById('sumDone');
const sumLeft     = document.getElementById('sumLeft');
const todayDateEl = document.getElementById('todayDate');
const receiptNoEl = document.getElementById('receiptNumber');


/**
 * loadTasks()
 * Mengambil data tugas dari localStorage dan mengubahnya dari teks JSON
 * menjadi array biasa. Kalau belum pernah ada data (pengguna baru),
 * fungsi ini mengembalikan array kosong supaya halaman tidak error.
 */
function loadTasks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (err) {
    // Data tersimpan rusak/tidak valid -> mulai dari kosong saja
    return [];
  }
}

/**
 * saveTasks(tasks)
 * Menyimpan array tugas ke localStorage dalam bentuk teks JSON.
 * Dipanggil setiap kali ada perubahan: tambah, hapus, atau centang tugas.
 */
function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

/**
 * escapeHTML(text)
 * Mengubah karakter spesial HTML (<, >, &, dst) menjadi versi amannya.
 * Ini mencegah teks yang diketik pengguna dianggap sebagai kode HTML
 * saat ditampilkan ulang ke halaman -- praktik keamanan dasar untuk
 * input yang berasal dari pengguna.
 */
function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * addTask(text)
 * Membuat satu tugas baru lalu menambahkannya ke daftar yang tersimpan.
 * Id tiap tugas dibuat dari gabungan waktu saat ini + angka acak,
 * supaya tidak pernah bentrok antar tugas.
 */
function addTask(text) {
  const tasks = loadTasks();
  tasks.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    text: text.trim(),
    done: false
  });
  saveTasks(tasks);
  renderTasks();
}

/**
 * toggleTask(id)
 * Membalik status sebuah tugas: dari belum selesai jadi selesai, atau sebaliknya.
 * Dipanggil saat tombol centang pada satu baris tugas diklik.
 */
function toggleTask(id) {
  const tasks = loadTasks();
  const target = tasks.find(t => t.id === id);
  if (target) target.done = !target.done;
  saveTasks(tasks);
  renderTasks();
}

/**
 * deleteTask(id)
 * Menghapus satu tugas dari daftar berdasarkan id-nya.
 * Dipanggil saat tombol "×" pada satu baris tugas diklik.
 */
function deleteTask(id) {
  const tasks = loadTasks().filter(t => t.id !== id);
  saveTasks(tasks);
  renderTasks();
}

/**
 * clearCompleted()
 * Menghapus semua tugas yang sudah berstatus "selesai" sekaligus.
 * Dipanggil saat tombol "Bersihkan yang Selesai" diklik.
 */
function clearCompleted() {
  const tasks = loadTasks().filter(t => !t.done);
  saveTasks(tasks);
  renderTasks();
}

/**
 * setFilter(filterName)
 * Mengganti filter tampilan: semua tugas / yang masih aktif / yang sudah selesai.
 * Juga memberi tanda visual pada tombol filter yang sedang dipilih,
 * lalu menggambar ulang daftar sesuai filter baru.
 */
function setFilter(filterName) {
  currentFilter = filterName;
  filterRow.querySelectorAll('.filter-btn').forEach(btn => {
    const isActive = btn.dataset.filter === filterName;
    btn.classList.toggle('is-active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
  });
  renderTasks();
}

/**
 * renderTasks()
 * Fungsi utama yang menggambar ulang seluruh tampilan daftar tugas:
 * 1. Ambil data terbaru dari localStorage
 * 2. Saring sesuai filter yang sedang aktif
 * 3. Tampilkan tiap tugas sebagai satu baris struk (atau pesan kosong kalau tidak ada)
 * 4. Hitung ulang ringkasan total / selesai / sisa di bagian bawah struk
 */
function renderTasks() {
  const allTasks = loadTasks();

  const visibleTasks = allTasks.filter(t => {
    if (currentFilter === 'aktif') return !t.done;
    if (currentFilter === 'selesai') return t.done;
    return true; // currentFilter === 'semua'
  });

  taskList.innerHTML = '';
  emptyState.hidden = visibleTasks.length !== 0;

  visibleTasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.done ? ' is-done' : '');
    li.dataset.id = task.id;
    li.innerHTML = `
      <span class="task-index">${String(index + 1).padStart(2, '0')}</span>
      <span class="task-text">${escapeHTML(task.text)}</span>
      <span class="task-actions">
        <button class="btn-check" data-action="toggle" aria-label="${task.done ? 'Tandai belum selesai' : 'Tandai selesai'}">${task.done ? '✓' : ''}</button>
        <button class="btn-delete" data-action="delete" aria-label="Hapus tugas">×</button>
      </span>
      ${task.done ? '<span class="stamp">SELESAI</span>' : ''}
    `;
    taskList.appendChild(li);
  });

  // Hitung ringkasan berdasarkan SELURUH tugas, bukan cuma yang sedang ditampilkan
  const total = allTasks.length;
  const done  = allTasks.filter(t => t.done).length;
  sumTotal.textContent = total;
  sumDone.textContent  = done;
  sumLeft.textContent  = total - done;
}

/**
 * updateDateTime()
 * Menampilkan tanggal hari ini di kepala struk dengan format singkat Indonesia.
 * Dipanggil sekali saat halaman pertama kali dibuka.
 */
function updateDateTime() {
  const today = new Date();
  todayDateEl.textContent = 'Tgl: ' + today.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

/**
 * generateReceiptNumber()
 * Membuat nomor struk acak hanya untuk hiasan visual (tidak disimpan kemana pun),
 * supaya tampilannya makin mirip struk belanja asli.
 */
function generateReceiptNumber() {
  const num = Math.floor(10000 + Math.random() * 89999);
  receiptNoEl.textContent = 'No: ' + num;
}


/* ===== EVENT LISTENER: menghubungkan tombol/aksi di halaman ke fungsi di atas ===== */

// Saat form "tambah tugas" disubmit (klik tombol + atau tekan Enter di input)
addForm.addEventListener('submit', (e) => {
  e.preventDefault(); // jangan reload halaman seperti form biasa
  const value = taskInput.value.trim();
  if (value === '') return; // jangan menambah tugas kosong
  addTask(value);
  taskInput.value = '';
  taskInput.focus();
});

// Klik salah satu tombol filter (Semua / Aktif / Selesai)
filterRow.addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  setFilter(btn.dataset.filter);
});

// Klik tombol "Bersihkan yang Selesai"
clearBtn.addEventListener('click', clearCompleted);

// Satu event listener untuk SELURUH daftar tugas (event delegation).
// Caranya lebih efisien daripada memasang listener baru di setiap baris
// setiap kali renderTasks() dipanggil ulang.
taskList.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = btn.closest('.task-item').dataset.id;
  if (btn.dataset.action === 'toggle') toggleTask(id);
  if (btn.dataset.action === 'delete') deleteTask(id);
});


/* ===== JALANKAN SAAT HALAMAN PERTAMA KALI DIBUKA ===== */
updateDateTime();
generateReceiptNumber();
renderTasks();
