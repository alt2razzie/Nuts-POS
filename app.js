// ==========================================
// 1. SUPABASE CONFIGURATION (UPDATE THESE!)
// ==========================================
const SUPABASE_URL = 'https://movptqnjygxpkwbuhomc.supabase.co'; // <--- Put your URL here
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vdnB0cW5qeWd4cGt3YnVob21jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMjE4MjIsImV4cCI6MjA5MDg5NzgyMn0.Wu1SV1NawqOummmafdhPEWAGyz20Qzn65_UGJWHjb60'; // <--- Put your KEY here
const ADMIN_EMAIL = 'kuyabrill@gmail.com'; // <--- Put your Admin Email here

// FIX: Renamed from 'supabase' to 'supabaseClient' to prevent browser errors!
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// State Variables
let currentUser = null;
let cart = [];

// ==========================================
// 2. NAVIGATION & UI STATE
// ==========================================
function navigate(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');
    window.scrollTo(0, 0);
}

async function updateUIBasedOnAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    const loginBtn = document.getElementById('nav-login-btn');
    const logoutBtn = document.getElementById('nav-logout-btn');
    const cartBtn = document.getElementById('nav-cart-btn');
    const adminBtn = document.getElementById('nav-admin-btn');

    if (session) {
        currentUser = session.user;
        if(loginBtn) loginBtn.classList.add('hidden');
        if(logoutBtn) logoutBtn.classList.remove('hidden');
        if(cartBtn) cartBtn.classList.remove('hidden');
        
        if (currentUser.email === ADMIN_EMAIL && adminBtn) {
            adminBtn.classList.remove('hidden');
        }

        if(document.getElementById('auth') && !document.getElementById('auth').classList.contains('hidden')) {
            navigate('shop');
        }
    } else {
        currentUser = null;
        cart = []; 
        updateCartUI();
        if(loginBtn) loginBtn.classList.remove('hidden');
        if(logoutBtn) logoutBtn.classList.add('hidden');
        if(cartBtn) cartBtn.classList.add('hidden');
        if(adminBtn) adminBtn.classList.add('hidden');
    }
}

// ==========================================
// 3. AUTHENTICATION (EMAIL OTP)
// ==========================================
async function requestOTP(e) {
    e.preventDefault();
    const email = document.getElementById('customer-email').value;
    const btn = document.getElementById('btn-request-otp');
    
    btn.innerText = "Sending Secure Code...";
    btn.disabled = true;

    const { error } = await supabaseClient.auth.signInWithOtp({ 
        email: email,
        options: { shouldCreateUser: true }
    });

    if (error) {
        alert("Error sending code: " + error.message);
        btn.innerText = "Send Secure Code";
        btn.disabled = false;
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
    
    btn.innerText = "Verifying Code...";
    btn.disabled = true;

    const { error } = await supabaseClient.auth.verifyOtp({ 
        email: email, 
        token: otp, 
        type: 'email' 
    });

    if (error) {
        alert("Invalid or expired code. Please try again.");
        btn.innerText = "Verify & Enter Shop";
        btn.disabled = false;
    } else {
        alert("Welcome to Nini Nuts!");
        await updateUIBasedOnAuth();
        navigate('shop');
        loadProducts(); 
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
    await supabaseClient.auth.signOut();
    alert("You have been successfully logged out.");
    await updateUIBasedOnAuth();
    navigate('shop');
    loadProducts(); 
}

// ==========================================
// 4. SHOP & DATABASE FETCHING
// ==========================================
async function loadProducts(categoryFilter = 'All') {
    const list = document.getElementById('product-list');
    if(!list) return; 

    list.innerHTML = '<p style="text-align: center; width: 100%;">Loading sweet treats from the database...</p>';

    let query = supabaseClient.from('products').select('*').order('created_at', { ascending: false });
    if (categoryFilter !== 'All') {
        query = query.eq('category', categoryFilter);
    }

    const { data, error } = await query;

    if (error) {
        list.innerHTML = '<p style="color: red; text-align: center; width: 100%;">Failed to load products. Check your database connection.</p>';
        console.error(error);
        return;
    }

    list.innerHTML = '';
    
    if(data.length === 0) {
        list.innerHTML = '<p style="text-align: center; width: 100%;">No products found. Time to upload some treats!</p>';
        return;
    }

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

// ==========================================
// 5. CART LOGIC
// ==========================================
function addToCart(name, price) {
    cart.push({ name, price });
    updateCartUI();
    alert(`${name} added to your cart!`);
}

function updateCartUI() {
    const cartItemsDiv = document.getElementById('cart-items');
    if(!cartItemsDiv) return;

    let total = 0;
    cartItemsDiv.innerHTML = '';
    
    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p style="color: #888; text-align: center;">Your cart is feeling a bit empty.</p>';
    } else {
        cart.forEach((item, index) => {
            total += item.price;
            cartItemsDiv.innerHTML += `
                <div class="cart-item">
                    <span>${item.name}</span>
                    <span>₱${item.price.toFixed(2)} <button onclick="removeFromCart(${index})">X</button></span>
                </div>
            `;
        });
    }
    
    document.getElementById('nav-cart-total').innerText = total.toFixed(2);
    document.getElementById('cart-page-total').innerText = total.toFixed(2);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

// ==========================================
// 6. ADMIN DATABASE UPLOAD
// ==========================================
async function uploadProduct(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-upload');
    
    const name = document.getElementById('p-name').value;
    const category = document.getElementById('p-category').value;
    const price = document.getElementById('p-price').value;
    const fileInput = document.getElementById('p-image');
    
    if (fileInput.files.length === 0) return alert("Please select an image.");
    const file = fileInput.files[0];

    btn.innerText = "Uploading to Cloud...";
    btn.disabled = true;

    // A. Upload Image to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabaseClient.storage
        .from('product-images')
        .upload(fileName, file);

    if (uploadError) {
        alert("Image upload failed: " + uploadError.message);
        btn.innerText = "Upload to Database"; 
        btn.disabled = false; 
        return;
    }

    // B. Get Public URL for the image
    const { data: { publicUrl } } = supabaseClient.storage
        .from('product-images')
        .getPublicUrl(fileName);

    // C. Insert Data into Database
    const { error: dbError } = await supabaseClient.from('products').insert([
        { name: name, category: category, price: parseFloat(price), image_url: publicUrl }
    ]);

    if (dbError) {
        alert("Database error: " + dbError.message);
    } else {
        alert("Product added successfully!");
        e.target.reset(); // Clear the form
    }
    
    btn.innerText = "Upload to Database"; 
    btn.disabled = false;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateUIBasedOnAuth().then(() => {
        loadProducts();
    });
});
