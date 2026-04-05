const SUPABASE_URL = 'https://YOUR_URL.supabase.co'; 
const SUPABASE_KEY = 'YOUR_KEY'; 
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const UI_PASSCODE = "pastelnuts2026";

function checkPasscode() {
    const guess = prompt("Enter Admin Passcode:");
    if (guess === UI_PASSCODE) {
        document.getElementById('passcode-screen').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
        loadAdminProducts();
    } else {
        alert("Incorrect passcode. Returning to shop.");
        window.location.href = 'index.html';
    }
}

async function addProduct(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-upload');
    btn.innerText = "Uploading...";
    btn.disabled = true;

    const name = document.getElementById('product-name').value;
    const category = document.getElementById('product-category').value;
    const price = document.getElementById('product-price').value;
    const stock = document.getElementById('product-stock').value;
    const file = document.getElementById('product-image').files[0];

    // 1. Upload Image to Storage Bucket
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabaseClient.storage
        .from('product-images')
        .upload(fileName, file);

    if (uploadError) {
        alert("Image upload failed: " + uploadError.message);
        btn.innerText = "Upload to Store";
        btn.disabled = false;
        return;
    }

    // 2. Get the public URL for the image
    const { data: { publicUrl } } = supabaseClient.storage
        .from('product-images')
        .getPublicUrl(fileName);

    // 3. Save Product info and Stock to Database
    const { error: dbError } = await supabaseClient
        .from('products')
        .insert([{ 
            name: name, 
            category: category, 
            price: price, 
            image_url: publicUrl, 
            stock: parseInt(stock) 
        }]);

    if (dbError) {
        alert("Database error: " + dbError.message);
    } else {
        alert("Product added successfully!");
        e.target.reset();
        loadAdminProducts();
    }

    btn.innerText = "Upload to Store";
    btn.disabled = false;
}

async function loadAdminProducts() {
    const { data: products, error } = await supabaseClient.from('products').select('*');
    const list = document.getElementById('admin-product-list');
    list.innerHTML = '';

    if (error) {
        console.error(error);
        return;
    }

    products.forEach(p => {
        const div = document.createElement('div');
        div.className = 'product-row';
        div.innerHTML = `
            <div style="display: flex; align-items: center;">
                <img src="${p.image_url}">
                <div>
                    <strong style="display:block; margin-bottom: 5px;">${p.name}</strong>
                    <span style="color: #bbb;">₱${p.price} | Stock: ${p.stock}</span>
                </div>
            </div>
            <button onclick="deleteProduct(${p.id})" style="width: auto; background: #e74c3c; padding: 10px 20px; margin: 0;">Delete</button>
        `;
        list.appendChild(div);
    });
}

async function deleteProduct(id) {
    if(confirm("Are you sure you want to permanently delete this product?")) {
        const { error } = await supabaseClient.from('products').delete().eq('id', id);
        if(!error) { 
            alert("Deleted!"); 
            loadAdminProducts(); 
        } else { 
            alert("Error: " + error.message); 
        }
    }
}

// Trigger passcode check on load
checkPasscode();
