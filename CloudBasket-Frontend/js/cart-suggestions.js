document.addEventListener("DOMContentLoaded", () => {
    loadSuggestedProducts();
});

function loadSuggestedProducts() {
    const grid = document.getElementById('suggested-products-grid');
    if (!grid) return;

    // Use mock data matching the mockup
    const suggested = [
        {
            id: "CB-NET-PRO",
            title: "Network Nexus Pro",
            price: 3299.00,
            imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=500&q=80"
        },
        {
            id: "CB-DATA-MK2",
            title: "DataPulse Server Mk II",
            price: 4150.00,
            imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=500&q=80"
        },
        {
            id: "CB-QUANTUM",
            title: "Quantum Core Node",
            price: 2899.00,
            imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=500&q=80"
        },
        {
            id: "CB-AERO-SW",
            title: "AeroStream Switch",
            price: 1599.00,
            imageUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=500&q=80"
        }
    ];

    grid.innerHTML = '';

    suggested.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.textAlign = 'center';
        
        card.innerHTML = `
            <div class="card-img-container" style="background: white; padding: 15px; border-bottom: 1px solid #f1f5f9;">
                <img src="${product.imageUrl}" alt="${product.title}" style="max-height: 180px; object-fit: contain;">
            </div>
            <div class="card-body" style="padding: 20px;">
                <h3 class="card-title" style="margin-bottom: 15px; font-size: 16px; min-height: 40px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; color: #0f172a; text-align: left;">${product.title}</h3>
                <div style="font-size: 16px; font-weight: 700; color: #0f4a8a; margin-bottom: 15px; text-align: left;">₹${Number(product.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <button class="btn" style="width: 100%; background: white; border: 1px solid #cbd5e1; color: #0f4a8a; padding: 10px; border-radius: 6px; font-weight: 500; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc';" onmouseout="this.style.background='white';" onclick="window.location.href='product.html?id=${product.id}'">
                    View Details
                </button>
            </div>
        `;
        
        grid.appendChild(card);
    });
}
