const fs = require('fs');

const path = 'C:/Users/dharineesh.v/OneDrive - IDP Education Ltd/Documents/E-Commerce App/CloudBasket-Frontend/pages/orders/orders.html';
let content = fs.readFileSync(path, 'utf8');

// Remove timeline
const timelineStart = content.indexOf('<div class="order-timeline-card">');
if(timelineStart !== -1) {
    const timelineEnd = content.indexOf('</div>', content.indexOf('</div>', content.indexOf('</div>', timelineStart) + 1) + 1) + 6;
    // Let's just use regex for safety:
}

content = content.replace(/<div class="order-timeline-card">[\s\S]*?<!-- Quick Actions -->/, '<!-- Quick Actions -->');

// Remove Assign Shipment button
content = content.replace(/<button class="action-btn dark-btn" id="btn-assign-shipment">[\s\S]*?<\/button>\s*/, '');

fs.writeFileSync(path, content);
console.log('Removed timeline and assign shipment button');
