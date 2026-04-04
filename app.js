// --- CONFIGURATION (FILL THESE IN!) ---
const SUPABASE_URL = 'https://movptqnjygxpkwbuhomc.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vdnB0cW5qeWd4cGt3YnVob21jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMjE4MjIsImV4cCI6MjA5MDg5NzgyMn0.Wu1SV1NawqOummmafdhPEWAGyz20Qzn65_UGJWHjb60'; 
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_EMAIL = 'kuyabrill@gmail.com'; 
// --------------------------------------

let currentUser = null;
let cart = [];

// --- UI ROUTING ---
function navigate(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');
}

// --- AUTH STATE MANAGER ---
async function updateUIBasedOnAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    
    const loginBtn = document.getElementById('nav-login-btn');
    const logoutBtn = document.getElementById('nav-logout-btn');
    const cartBtn = document.getElementById('nav-cart-btn');
    const adminBtn = document.getElementById('nav-admin-btn');

    if (session) {
        currentUser = session.user;
        if(loginBtn) loginBtn.classList.add('hidden');
        if(logoutBtn) logoutBtn.classList.remove('hidden');
        if(cartBtn) cartBtn.classList.remove('hidden');
        
        // Show admin button if the logged-in email matches ADMIN_EMAIL
        if (currentUser.email === ADMIN_EMAIL && adminBtn) {
            adminBtn.classList.remove('hidden');
        }

        if(document.getElementById('auth') && !document.getElementById('auth').classList.contains('hidden')) {
            navigate('shop');
        }
    } else {
        currentUser = null;
        cart = []; 
        if(loginBtn) loginBtn.classList.remove('hidden');
        if(logoutBtn) logoutBtn.classList.add('hidden');
        if(cartBtn) cartBtn.classList.add('hidden');
        if(adminBtn) adminBtn.classList.add('hidden');
    }
}

// --- OTP AUTH FLOW ---
async function requestOTP(e) {
    e.preventDefault();
    const email = document.getElementById('customer-email').value;
    const btn = document.getElementById('btn-request-otp');
    btn.innerText = "Sending code..."; btn.disabled = true;

    const { error } = await supabase.auth.signInWithOtp({ email: email });

    if (error) {
        alert("Error: " + error.message);
        btn.innerText = "Send Secure Code"; btn.disabled = false;
    } else {
        document.getElementById('otp-request-form').classList.add('hidden');
        document.getElementById('otp-verify-form').classList.remove('hidden');
    }
}

async function verifyOTP(e) {
    e.preventDefault();
    const email = document.getElementById('customer-email').value;
    const otp = document.getElementById('customer-otp').value;
    const btn = document.getElementById('btn-verify-otp');
    btn.innerText = "Verifying..."; btn.disabled = true;

    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });

    if (error) {
        alert("Invalid code.");
        btn.innerText = "Verify & Enter Shop"; btn.disabled = false;
    } else {
        alert("Welcome!");
        updateUIBasedOnAuth();
        navigate('shop');
        loadProducts(); // Reload to activate "Add to cart" buttons
    }
}

function resetAuthForm() {
    document.getElementById('otp-verify-form').classList.add('hidden');
    document.getElementById('otp-request-form').classList.remove('hidden');
    document.getElementById('btn-request-otp').innerText = "Send Secure Code";
    document.getElementById('btn-request-otp').disabled = false;
    document.getElementById('customer-otp').value = "";
}

async function logoutUser() {
    await supabase.auth.signOut();
    updateUIBasedOnAuth();
    navigate('shop');
    loadProducts(); // Reload to deactivate "Add to cart" buttons
}

// --- FETCH & DISPLAY PRODUCTS ---
async function loadProducts(categoryFilter = 'All') {
    const list = document.getElementById('product-list');
    if(!list) return; // Only run on index.html

    list.innerHTML = '<p style="text-align:center; width:100%;">Loading sweet treats...</p>';

    let query = supabase.from('products').select('*').order('created_at', { ascending: false });
    if (categoryFilter !== 'All') query = query.eq('category', categoryFilter);

    const { data, error } = await query;

    if (error) {
        list.innerHTML = '<p style="color:red;">Error loading products.</p>';
        return;
    }

    list.innerHTML = '';
    data.forEach(p => {
        const btnHtml = currentUser 
            ? `<button class="btn-add" onclick="addToCart('${p.name}', ${p.price})">Add to Cart</button>`
            : `<button class="btn-primary" onclick="navigate('auth')">Login to Buy</button>`;

        list.innerHTML += `
            <div class="card">
                <img src="${p.image_url}" alt="${p.name}" class="product-img">
                <h3>${p.name}</h3>
                <p style="color:#aaa; font-size:0.9rem;">${p.category}</p>
                <div class="price">₱${p.price.toFixed(2)}</div>
                ${btnHtml}
            </div>
        `;
    });
}

// --- ADMIN UPLOAD FUNCTION ---
async function uploadProduct(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-upload');
    btn.innerText = "Uploading..."; btn.disabled = true;

    const name = document.getElementById('p-name').value;
    const category = document.getElementById('p-category').value;
    const price = document.getElementById('p-price').value;
    const file = document.getElementById('p-image').files[0];

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    
    // 1. Upload Image
    const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file);
    if (uploadError) {
        alert("Image upload failed: " + uploadError.message);
        btn.innerText = "Upload to Database"; btn.disabled = false; return;
    }

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);

    // 3. Insert Database Row
    const { error: dbError } = await supabase.from('products').insert([
        { name, category, price, image_url: publicUrl }
    ]);

    if (dbError) {
        alert("Database error: " + dbError.message);
    } else {
        alert("Product added successfully!");
        e.target.reset();
    }
    btn.innerText = "Upload to Database"; btn.disabled = false;
}

// --- CART LOGIC ---
function addToCart(name, price) {
    cart.push({ name, price });
    updateCartUI();
    alert(`${name} added to cart!`);
}

function updateCartUI() {
    const cartItemsDiv = document.getElementById('cart-items');
    let total = 0;
    
    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p>Your cart is empty.</p>';
    } else {
        cartItemsDiv.innerHTML = '';
        cart.forEach((item, index) => {
            total += item.price;
            cartItemsDiv.innerHTML += `
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #eee;">
                    <span>${item.name}</span>
                    <span>₱${item.price.toFixed(2)} <button onclick="removeFromCart(${index})" style="background:#ffb6c1; border:none; color:white; cursor:pointer;">X</button></span>
                </div>
            `;
        });
    }
    
    document.getElementById('nav-cart-total').innerText = total.toFixed(2);
    if(document.getElementById('cart-page-total')) document.getElementById('cart-page-total').innerText = total.toFixed(2);
}

function removeFromCart(index) { cart.splice(index, 1); updateCartUI(); }

// --- INITIALIZE ON LOAD ---
document.addEventListener('DOMContentLoaded', () => {
    updateUIBasedOnAuth().then(() => loadProducts());
});
