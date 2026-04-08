// --- INITIALIZE SUPABASE ---
const SUPABASE_URL = 'https://movptqnjygxpkwbuhomc.supabase.co'; // <--- Change this
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vdnB0cW5qeWd4cGt3YnVob21jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMjE4MjIsImV4cCI6MjA5MDg5NzgyMn0.Wu1SV1NawqOummmafdhPEWAGyz20Qzn65_UGJWHjb60';
const ADMIN_EMAIL = 'kuyabrill@gmail.com'; 

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let cart = [];

// --- TRANSLATIONS ---
const translations = {
    en: {
        seller: "Seller Centre", help: "Help",
        all: "All Treats", nuts: "Nuts", dried: "Dried Fruits", mixes: "Mixes",
        cartTitle: "Your Cart", checkout: "Checkout & Delivery",
        payment: "Mode of Payment:", location: "Delivery Location:", placeOrder: "Submit Order"
    },
    tl: {
        seller: "Sentro ng Nagbebenta", help: "Tulong",
        all: "Lahat ng Pagkain", nuts: "Mani", Pinatuyong: "Pinatuyong Prutas", mixes: "Pinaghalo",
        cartTitle: "Iyong Cart", checkout: "Pagbabayad at Pagpapadala",
        payment: "Paraan ng Pagbabayad:", location: "Lugar ng Pagpapadala:", placeOrder: "I-submit ang Order"
    },
    ceb: {
        seller: "Sentro sa Tigbaligya", help: "Tabang",
        all: "Tanan Pagkaon", nuts: "Mani", dried: "Pina-uga nga Prutas", mixes: "Sagol",
        cartTitle: "Imong Cart", checkout: "Pagbayad ug Paghatod",
        payment: "Paagi sa Pagbayad:", location: "Lugar nga Ideliver:", placeOrder: "I-submit ang Order"
    }
};

function changeLanguage() {
    const lang = document.getElementById('language-selector').value;
    document.getElementById('lang-seller').innerText = translations[lang].seller;
    document.getElementById('lang-help').innerText = translations[lang].help;
    document.querySelector('.lang-all').innerText = translations[lang].all;
    document.querySelector('.lang-nuts').innerText = translations[lang].nuts;
    document.querySelector('.lang-dried').innerText = translations[lang].dried;
    document.querySelector('.lang-mixes').innerText = translations[lang].mixes;
    document.querySelector('.lang-cart-title').innerText = translations[lang].cartTitle;
    document.querySelector('.lang-checkout').innerText = translations[lang].checkout;
    document.querySelector('.lang-payment').innerText = translations[lang].payment;
    document.querySelector('.lang-location').innerText = translations[lang].location;
    document.querySelector('.lang-place-order').innerText = translations[lang].placeOrder;
}

// --- NAVIGATION & UI ---
function navigate(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');
    if(pageId === 'cart') updateCartUI();
}

async function updateUIBasedOnAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    currentUser = session?.user;

    const loginBtn = document.getElementById('nav-login-btn');
    const cartBtn = document.getElementById('nav-cart-btn');
    const logoutBtn = document.getElementById('nav-logout-btn');
    const adminBtn = document.getElementById('nav-admin-btn');

    if (currentUser) {
        loginBtn.classList.add('hidden');
        cartBtn.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
        if (currentUser.email === ADMIN_EMAIL || currentUser.phone) adminBtn.classList.remove('hidden');
    } else {
        loginBtn.classList.remove('hidden');
        cartBtn.classList.add('hidden');
        logoutBtn.classList.add('hidden');
        adminBtn.classList.add('hidden');
    }
}

// --- MUSIC TOGGLE LOGIC ---
function toggleMusic() {
    const music = document.getElementById('bg-music');
    const btn = document.getElementById('music-toggle-btn');
    
    if (music.paused) {
        music.play();
        btn.innerText = "🔊 Vibe";
        btn.style.color = "#D35400"; // Makes it pop when active
    } else {
        music.pause();
        btn.innerText = "🔇 Vibe";
        btn.style.color = "#8C6A53"; // Returns to normal color
    }
}

// --- THE NUT BREAK ANIMATION ENGINE ---
document.addEventListener('click', function(e) {
    // Prevent the animation from firing if they click the music button
    if(e.target.id === 'music-toggle-btn') return; 
    createNutCrushEffect(e.pageX, e.pageY);
});

function createNutCrushEffect(x, y) {
    const shellColors = ['#D4C4B7', '#8C6A53', '#5C4636', '#3A2618', '#F3EFE6'];
    const particleCount = 8 + Math.floor(Math.random() * 5);

    for(let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'nut-particle';
        
        const size = 4 + Math.random() * 8; 
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.backgroundColor = shellColors[Math.floor(Math.random() * shellColors.length)];
        
        document.body.appendChild(particle);

        const angle = Math.random() * Math.PI * 2; 
        const velocity = 40 + Math.random() * 60;  
        
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity - 30; 
        const rot = Math.random() * 360; 

        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);
        particle.style.setProperty('--rot', `${rot}deg`);

        setTimeout(() => particle.remove(), 600);
    }
}

// --- AUTHENTICATION ---
async function requestOTP(e) {
    e.preventDefault();
    const contact = document.getElementById('customer-contact').value.trim();
    const btn = document.getElementById('btn-send-otp');
    btn.innerText = "Sending...";
    btn.disabled = true;

    const isEmail = contact.includes('@');
    
    const { error } = await supabaseClient.auth.signInWithOtp(
        isEmail ? { email: contact } : { phone: contact }
    );

    if (error) {
        alert("Error: " + error.message);
        btn.innerText = "Send Secure Code";
        btn.disabled = false;
    } else {
        document.getElementById('otp-request-form').classList.add('hidden');
        document.getElementById('otp-verify-form').classList.remove('hidden');
    }
}

async function verifyOTP(e) {
    e.preventDefault();
    const contact = document.getElementById('customer-contact').value.trim();
    const isEmail = contact.includes('@');
    const otp = document.getElementById('customer-otp').value.trim(); 
    const btn = document.getElementById('btn-verify-otp');
    
    if (otp.length !== 6 || isNaN(otp)) {
        alert("Hold up! The secure code must be exactly 6 numbers.");
        return; 
    }

    btn.innerText = "Verifying...";
    btn.disabled = true;

    const { error } = await supabaseClient.auth.verifyOtp({ 
        email: isEmail ? contact : undefined,
        phone: !isEmail ? contact : undefined,
        token: otp, 
        type: isEmail ? 'email' : 'sms' 
    });

    if (error) {
        alert("Error: " + error.message);
        btn.innerText = "Verify & Enter Shop";
        btn.disabled = false;
    } else {
        alert("Welcome to Nini Nuts!");
        await updateUIBasedOnAuth();
        navigate('shop');
        loadProducts(); 
    }
}

async function logoutUser() {
    await supabaseClient.auth.signOut();
    cart = []; 
    document.getElementById('nav-cart-total').innerText = "0";
    alert("You have been logged out.");
    updateUIBasedOnAuth();
    navigate('landing');
}

// --- SHOP LOGIC ---
function searchProducts() {
    const query = document.getElementById('search-input').value.toLowerCase();
    navigate('shop');
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        const title = card.querySelector('h3').innerText.toLowerCase();
        if (title.includes(query)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

async function loadProducts(category = 'All') {
    let query = supabaseClient.from('products').select('*');
    if (category !== 'All') query = query.eq('category', category);
    
    const { data: products, error } = await query;
    const list = document.getElementById('product-list');
    list.innerHTML = '';

    if (error) {
        console.error("Error loading products", error);
        return;
    }

    products.forEach(p => {
        const isSoldOut = p.stock <= 0;
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
            <img src="${p.image_url}" class="product-img">
            <h3>${p.name}</h3>
            <p class="price">₱${p.price}</p>
            ${isSoldOut ? 
                `<p class="sold-out">SOLD OUT</p>` : 
                `<div style="display:flex; justify-content:center; align-items:center; gap:10px; margin-bottom:15px;">
                    <button class="qty-btn" onclick="adjustTempQty(${p.id}, -1)">-</button>
                    <span id="temp-qty-${p.id}" style="font-size: 1.2rem; font-weight: bold;">1</span>
                    <button class="qty-btn" onclick="adjustTempQty(${p.id}, 1, ${p.stock})">+</button>
                </div>
                <button class="btn-primary" onclick="addToCart(${p.id}, '${p.name}', ${p.price}, ${p.stock})">Add to Cart</button>`
            }
        `;
        list.appendChild(div);
    });
}

function adjustTempQty(id, change, maxStock) {
    const qtySpan = document.getElementById(`temp-qty-${id}`);
    let currentQty = parseInt(qtySpan.innerText);
    let newQty = currentQty + change;
    
    if (newQty < 1) newQty = 1;
    if (newQty > maxStock) {
        alert("Cannot exceed available stock of " + maxStock);
        newQty = maxStock;
    }
    qtySpan.innerText = newQty;
}

// --- CART & CHECKOUT LOGIC ---
function addToCart(id, name, price, maxStock) {
    if (!currentUser) {
        alert("Please log in to add items to your cart!");
        navigate('auth');
        return;
    }
    
    const selectedQty = parseInt(document.getElementById(`temp-qty-${id}`).innerText);
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        if (existingItem.qty + selectedQty > maxStock) {
            alert("Adding this would exceed available stock!");
            return;
        }
        existingItem.qty += selectedQty;
    } else {
        cart.push({ id, name, price, qty: selectedQty });
    }

    document.getElementById('nav-cart-total').innerText = cart.reduce((sum, item) => sum + item.qty, 0);
    alert(`Added ${selectedQty}x ${name} to cart!`);
}

function updateCartUI() {
    const cartDiv = document.getElementById('cart-items');
    cartDiv.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        total += item.price * item.qty;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <span><b>${item.name}</b> (x${item.qty})</span>
            <span>₱${item.price * item.qty}</span>
            <button onclick="removeFromCart(${index})">Remove</button>
        `;
        cartDiv.appendChild(div);
    });

    document.getElementById('cart-page-total').innerText = total;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    document.getElementById('nav-cart-total').innerText = cart.reduce((sum, item) => sum + item.qty, 0);
    updateCartUI();
}

async function placeOrder() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }
    const mode = document.getElementById('payment-mode').value;
    alert(`Order placed successfully via ${mode.toUpperCase()}! Thank you for shopping with Nini Nuts.`);
    cart = [];
    document.getElementById('nav-cart-total').innerText = "0";
    navigate('shop');
    loadProducts(); 
}

// Start up
updateUIBasedOnAuth();
navigate('landing'); 
loadProducts();
navigate('landing'); 
loadProducts();

// =========================================
// NINI NUTS AI CONCIERGE (Powered by Groq)
// =========================================

const GROQ_API_KEY = "gsk_z1sV9WW0zUfw7ZN8EjeOWGdyb3FY3G0XP2atLpjre7XlHpfywWHms"; 

// The Brain of your AI. Update this with your exact inventory and prices!
const SYSTEM_PROMPT = `
You are the friendly, helpful AI Concierge for a premium boutique store called 'Nini Nuts'. 
Your tone is warm, inviting, and slightly playful (you can use nut puns occasionally).
Keep your answers brief and highly readable for a chat window.

Nini Nuts Catalog & Prices:
- Roasted Almonds: ₱350/jar
- Cashew Nuts: ₱400/jar
- Pistachios: ₱450/jar
- Walnut Halves: ₱420/jar
- Trail Mix (Almonds, Cashews, Raisins, Dark Choc): ₱380/jar
- Dried Mangoes: ₱250/pack
- Dried Strawberries: ₱300/pack

Important Facts:
- We offer Same Day Delivery in Cagayan de Oro (CDO) via Lalamove/Maxim.
- Free shipping in CDO for orders over ₱1000.
- All our nuts are organic certified and freshly roasted in small batches every morning.
- If asked about ordering, tell them to browse the products on the screen and click 'Add to Cart'.
`;

let chatHistory = [{ role: "system", content: SYSTEM_PROMPT }];

function toggleChat() {
    const chatWindow = document.getElementById('chat-window');
    chatWindow.classList.toggle('hidden');
}

function handleChatEnter(e) {
    if (e.key === 'Enter') sendChatMessage();
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;

    // 1. Display User Message
    appendMessage(message, 'user-msg');
    input.value = '';
    
    // Show typing indicator
    const typingId = appendMessage("Nini is typing...", 'ai-msg');

    // 2. Add to history
    chatHistory.push({ role: "user", content: message });

    // 3. Call Groq API
    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama3-8b-8192", // Fast and capable model for customer service
                messages: chatHistory,
                temperature: 0.7,
                max_tokens: 150 // Keep responses snappy
            })
        });

        const data = await response.json();
        
        if (data.choices && data.choices.length > 0) {
            const aiResponse = data.choices[0].message.content;
            
            // Remove typing indicator and show real response
            document.getElementById(typingId).remove();
            appendMessage(aiResponse, 'ai-msg');
            
            // Save AI response to history so it remembers the conversation
            chatHistory.push({ role: "assistant", content: aiResponse });
        } else {
            throw new Error("No response from Groq");
        }

    } catch (error) {
        console.error("Groq API Error:", error);
        document.getElementById(typingId).remove();
        appendMessage("Oops! My servers got a little roasted. Please try asking again in a moment.", 'ai-msg');
        // Remove the failed user message from history so it doesn't break future context
        chatHistory.pop(); 
    }
}

function appendMessage(text, className) {
    const chatContainer = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${className}`;
    msgDiv.innerText = text;
    
    // Generate a unique ID so we can easily remove it (used for the typing indicator)
    const id = 'msg-' + Date.now();
    msgDiv.id = id;
    
    chatContainer.appendChild(msgDiv);
    
    // Auto-scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return id;
}
