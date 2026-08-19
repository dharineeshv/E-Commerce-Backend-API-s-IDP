const fs = require('fs');

const path = 'C:/Users/dharineesh.v/OneDrive - IDP Education Ltd/Documents/E-Commerce App/CloudBasket-Frontend/js/order-details.js';
let content = fs.readFileSync(path, 'utf8');

// Fix the image URL
content = content.replace(
    /const imgUrl = `https:\/\/source\.unsplash\.com\/150x150\/\?product,\$\{encodedName\}`;/g,
    "const imgUrl = item.imageUrl || item.image || `https://source.unsplash.com/150x150/?product,${encodedName}`;"
);

// Fix the shipping address
const oldAddressBlock = `<span class="address-name">\${addr.name || 'N/A'}</span>
            \${addr.street || ''}<br>
            \${addr.city || ''} \${addr.zipCode || ''}<br>
            \${addr.country || ''}`;

const newAddressBlock = `<span class="address-name">\${addr.fullName || addr.name || 'N/A'}</span><br>
            \${addr.addressLine1 || addr.street || ''}<br>
            \${addr.city || ''} \${addr.state || ''} \${addr.postalCode || addr.zipCode || ''}<br>
            \${addr.country || ''}`;

content = content.replace(oldAddressBlock, newAddressBlock);

// Remove existing downloadInvoice listener if it exists (it doesn't, but just in case)

// Append the download logic at the end of renderOrderDetails
const downloadCode = `

    // Setup Download Invoice
    const btnDownload = document.getElementById('btn-download-invoice');
    if (btnDownload) {
        btnDownload.onclick = () => {
            if (typeof window.jspdf === 'undefined') {
                alert("PDF library is loading. Please try again in a moment.");
                return;
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Header
            doc.setFontSize(22);
            doc.text("CloudBasket", 105, 20, { align: "center" });
            
            doc.setFontSize(16);
            doc.text("Order Invoice / Receipt", 105, 30, { align: "center" });
            
            // Order details
            doc.setFontSize(12);
            doc.text(\`Order ID: \${orderId}\`, 20, 45);
            doc.text(\`Date: \${dateObj.toLocaleDateString()}\`, 20, 52);
            doc.text(\`Status: \${status}\`, 20, 59);
            
            // Customer Info
            const custName = (order.shippingAddress && (order.shippingAddress.fullName || order.shippingAddress.name)) || order.customerName || "CloudBasket Customer";
            const custEmail = (order.shippingAddress && order.shippingAddress.email) || order.customerEmail || "N/A";
            
            doc.text("Customer Details:", 20, 70);
            doc.text(\`Name: \${custName}\`, 20, 77);
            doc.text(\`Email: \${custEmail}\`, 20, 84);
            
            // Items
            doc.text("Order Items:", 20, 95);
            let y = 105;
            items.forEach((item, idx) => {
                const itemName = item.name || item.productId || 'Unknown Item';
                const itemQty = item.quantity || 1;
                const itemPrice = item.price || 0;
                doc.text(\`\${idx + 1}. \${itemName} (Qty: \${itemQty}) - Rs. \${(itemQty * itemPrice).toFixed(2)}\`, 25, y);
                y += 7;
            });
            
            y += 10;
            doc.setFontSize(14);
            doc.text(\`Total Amount: Rs. \${totalAmount.toFixed(2)}\`, 20, y);
            
            y += 15;
            doc.setFontSize(12);
            const paymentMethod = order.paymentMethod || "UPI / Cash On Delivery";
            doc.text(\`Payment Success through \${paymentMethod}\`, 20, y);
            
            // Seal of approval
            y += 20;
            doc.setTextColor(0, 150, 0); // Green color for seal
            doc.setFontSize(16);
            doc.text("SEAL APPROVED FROM CLOUDBASKET", 105, y, { align: "center" });
            
            // Download
            doc.save(\`CloudBasket_Invoice_\${orderId}.pdf\`);
        };
    }
`;

// Insert it right before the end of the renderOrderDetails function
content = content.replace(/}\s*$/g, downloadCode + "\n}");

fs.writeFileSync(path, content);
console.log("Updated order-details.js successfully");
