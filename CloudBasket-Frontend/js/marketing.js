import { initializeLogout } from "./logout.js";
import { initializeProfileCard } from "./profile.js";
import { initializeSidebar } from "./sidebar.js";
import { API } from "./config.js";
import { apiFetch } from "./api/apiClient.js";

document.addEventListener("DOMContentLoaded", () => {
    initializeLogout();
    initializeProfileCard();
    initializeSidebar();

    // Dynamic Slider Logic
    let slides = [];
    const dotsContainer = document.querySelector('.slider-dots');
    let currentSlide = 0;
    const slideInterval = 5000;
    let sliderTimer;

    function buildDots() {
        if (!dotsContainer) return;
        dotsContainer.innerHTML = '';
        slides.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = 'dot' + (i === currentSlide ? ' active' : '');
            dotsContainer.appendChild(dot);
        });
    }

    function initSlider() {
        if (slides.length === 0) return;
        buildDots();
        const dots = document.querySelectorAll('.dot');

        slides.forEach((s, i) => {
            if (i === currentSlide) s.classList.add('active');
            else s.classList.remove('active');
        });

        function goToSlide(n) {
            slides[currentSlide].classList.remove('active');
            dots[currentSlide].classList.remove('active');
            
            currentSlide = (n + slides.length) % slides.length;
            
            slides[currentSlide].classList.add('active');
            dots[currentSlide].classList.add('active');
        }

        function nextSlide() {
            goToSlide(currentSlide + 1);
        }

        if (sliderTimer) clearInterval(sliderTimer);
        sliderTimer = setInterval(nextSlide, slideInterval);

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                clearInterval(sliderTimer);
                goToSlide(index);
                sliderTimer = setInterval(nextSlide, slideInterval);
            });
        });
    }

    function updateSliderVisibility() {
        const festivalsTable = document.getElementById('festivals-table');
        const couponsTable = document.getElementById('coupons-table');
        
        const festivalsCount = festivalsTable ? festivalsTable.querySelectorAll('tbody tr').length : 0;
        const couponsCount = couponsTable ? couponsTable.querySelectorAll('tbody tr').length : 0;

        document.querySelectorAll('.slide').forEach(slide => {
            const type = slide.getAttribute('data-type');
            if (type === 'empty-festival') {
                slide.style.display = festivalsCount > 0 ? 'none' : 'block';
            } else if (type === 'festival') {
                slide.style.display = festivalsCount === 0 ? 'none' : 'block';
            } else if (type === 'empty-coupon') {
                slide.style.display = couponsCount > 0 ? 'none' : 'block';
            } else if (type === 'coupon') {
                slide.style.display = couponsCount === 0 ? 'none' : 'block';
            }
        });

        // Re-initialize slider with visible slides
        slides = Array.from(document.querySelectorAll('.slide')).filter(s => s.style.display !== 'none');
        if (currentSlide >= slides.length) currentSlide = 0;
        initSlider();
    }
    async function fetchMarketingData() {
        try {
            const [festivalsRes, couponsRes] = await Promise.all([
                fetch(`${API.marketingService}/api/v1/marketing/festival-sales`),
                fetch(`${API.marketingService}/api/v1/marketing/coupons`)
            ]);

            const festivalsData = await festivalsRes.json();
            const couponsData = await couponsRes.json();
            
            const festivals = festivalsData.data || [];
            const coupons = couponsData.data || [];

            updateStats(festivals, coupons);
            updateSliderContent(festivals, coupons);
            renderFestivals(festivals);
            renderCoupons(coupons);

            updateSliderVisibility();
        } catch (error) {
            console.error("Error fetching marketing data:", error);
        }
    }

    function updateSliderContent(festivals, coupons) {
        const activeFestival = festivals.find(f => f.status === 'ACTIVE');
        if (activeFestival) {
            const slide = document.getElementById('slider-festival');
            if (slide) {
                // If it's a private S3 URL that doesn't require auth on GET (via CloudFront/etc), it works.
                // If the user's issue was just that we weren't setting it, this fixes it.
                slide.style.backgroundImage = `url('${activeFestival.bannerImageUrl}')`;
                
                const title = document.getElementById('slider-festival-title');
                const desc = document.getElementById('slider-festival-desc');
                const discount = document.getElementById('slider-festival-discount');
                
                if (title) title.textContent = activeFestival.title || "Festival Sale";
                if (desc) desc.textContent = activeFestival.subtitle || "Enjoy the latest discounts!";
                if (discount) {
                    const discountText = activeFestival.discountType === 'PERCENTAGE' ? `FLAT ${activeFestival.discountValue}%` : `FLAT ₹${activeFestival.discountValue}`;
                    discount.textContent = discountText;
                }
            }
        }

        const activeCoupon = coupons.find(c => c.status === 'ACTIVE');
        if (activeCoupon) {
            const slide = document.getElementById('slider-coupon');
            if (slide) {
                const title = document.getElementById('slider-coupon-title');
                const desc = document.getElementById('slider-coupon-desc');
                const discount = document.getElementById('slider-coupon-discount');
                
                if (title) title.textContent = activeCoupon.title || activeCoupon.couponCode;
                if (desc) desc.textContent = activeCoupon.description || "Grab this limited time coupon!";
                if (discount) {
                    const discountText = activeCoupon.discountType === 'PERCENTAGE' ? `FLAT ${activeCoupon.discountValue}%` : `FLAT ₹${activeCoupon.discountValue}`;
                    discount.textContent = discountText;
                }
            }
        }
    }

    function updateStats(festivals, coupons) {
        const activeFestivalsCount = festivals.filter(f => f.status === 'ACTIVE').length;
        const totalFestivalsCount = festivals.length;
        
        const activeCouponsCount = coupons.filter(c => c.status === 'ACTIVE').length;
        const totalCouponsCount = coupons.length;

        const statActiveFestivals = document.getElementById('stat-active-festivals');
        const statActiveCoupons = document.getElementById('stat-active-coupons');
        const statTotalFestivals = document.getElementById('stat-total-festivals');
        const statTotalCoupons = document.getElementById('stat-total-coupons');

        if (statActiveFestivals) statActiveFestivals.textContent = activeFestivalsCount;
        if (statActiveCoupons) statActiveCoupons.textContent = activeCouponsCount;
        if (statTotalFestivals) statTotalFestivals.textContent = totalFestivalsCount;
        if (statTotalCoupons) statTotalCoupons.textContent = totalCouponsCount;
    }

    function renderFestivals(festivals) {
        const tbody = document.getElementById('festivals-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        festivals.forEach(fest => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #e2e8f0';
            
            const discountText = fest.discountType === 'PERCENTAGE' ? `${fest.discountValue}%` : `₹${fest.discountValue}`;
            
            const startDate = new Date(fest.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const endDate = new Date(fest.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            
            const statusClass = fest.status === 'ACTIVE' ? 'background: #dcfce7; color: #166534;' : 'background: #e0f2fe; color: #0369a1;';
            const statusText = fest.status === 'ACTIVE' ? '• Active' : 'Scheduled';
            
            tr.innerHTML = `
                <td style="padding: 14px;"><img src="${fest.bannerImageUrl || 'https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=1200&q=80'}" style="width: 80px; height: 30px; object-fit: cover; border-radius: 4px;"></td>
                <td style="padding: 14px; font-weight: 600; color: #003366;">${fest.title}</td>
                <td style="padding: 14px; font-weight: 700;">${discountText}</td>
                <td style="padding: 14px;">${startDate}</td>
                <td style="padding: 14px;">${endDate}</td>
                <td style="padding: 14px;"><span style="${statusClass} padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">${statusText}</span></td>
                <td style="padding: 14px; display: flex; gap: 8px;">
                    <button class="delete-btn" data-id="${fest.festivalSaleId}" data-type="festival" style="background: #fee2e2; border: none; padding: 8px; border-radius: 50%; cursor: pointer; color: #b91c1c;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    function renderCoupons(coupons) {
        const tbody = document.getElementById('coupons-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        coupons.forEach(coupon => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #e2e8f0';
            
            const discountText = coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% Off` : `₹${coupon.discountValue} Off`;
            
            const expiryDate = new Date(coupon.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            
            tr.innerHTML = `
                <td style="padding: 14px;"><span style="background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 4px; font-weight: 600; font-family: monospace;">${coupon.couponCode}</span></td>
                <td style="padding: 14px; font-weight: 700; color: #b45309;">${discountText}</td>
                <td style="padding: 14px;">₹${coupon.minimumOrderAmount || 0}</td>
                <td style="padding: 14px;">${coupon.usedCount || 0} / ${coupon.usageLimit || 'Unlimited'}</td>
                <td style="padding: 14px;">${expiryDate}</td>
                <td style="padding: 14px;"><span style="background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">Active</span></td>
                <td style="padding: 14px; display: flex; gap: 8px;">
                    <button class="delete-btn" data-id="${coupon.couponId}" data-type="coupon" style="background: #fee2e2; border: none; padding: 8px; border-radius: 50%; cursor: pointer; color: #b91c1c;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Event Delegation for Delete Buttons
    document.addEventListener('click', async (e) => {
        const deleteBtn = e.target.closest('.delete-btn');
        if (!deleteBtn) return;
        
        const id = deleteBtn.getAttribute('data-id');
        const type = deleteBtn.getAttribute('data-type');
        
        if (confirm("Are you sure you want to delete this?")) {
            try {
                const endpoint = type === 'festival' ? '/api/v1/marketing/festival-sales/' : '/api/v1/marketing/coupons/';
                const response = await apiFetch(API.marketingService + endpoint + id, { method: 'DELETE' });
                
                if (!response.ok) {
                    throw new Error(`Failed to delete. Status: ${response.status}`);
                }

                // Re-fetch data and update slider
                await fetchMarketingData();
            } catch (error) {
                console.error("Failed to delete", error);
                alert("Failed to delete. Please ensure you have permission and try again.");
            }
        }
    });

    // Initial Fetch
    fetchMarketingData();
});
