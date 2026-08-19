// ==========================================================
// Hero Banner
// ==========================================================

export function initializeHero() {

    const greeting =
        document.getElementById("hero-greeting");

    const quote =
        document.getElementById("hero-quote");

    const heroImage =
        document.getElementById("hero-banner-image");

    const heroBanner =
        document.querySelector(".hero-banner");

    const hour =
        new Date().getHours();

    // Morning
    if (hour >= 5 && hour < 12) {

        greeting.textContent =
            "Good Morning, Dharineesh 👋";

        quote.textContent =
            "Every sunrise is a new opportunity to grow.";

       heroBanner.style.backgroundImage =
    "url('../../assets/images/morning.png')";

        heroBanner.style.background =
            "linear-gradient(135deg,#4F8EF7,#87CEFA)";

    }

    // Afternoon
    else if (hour >= 12 && hour < 17) {

        greeting.textContent =
            "Good Afternoon, Dharineesh ☀️";

        quote.textContent =
            "Stay focused. Your goals are closer than you think.";

        heroBanner.style.backgroundImage =
    "url('../../assets/images/afternoon.png')";

        heroBanner.style.background =
            "linear-gradient(135deg,#FFB347,#FFD580)";

    }

    // Evening
    else if (hour >= 17 && hour < 20) {

        greeting.textContent =
            "Good Evening, Dharineesh 🌇";

        quote.textContent =
            "Celebrate today's progress and prepare for tomorrow.";
heroBanner.style.backgroundImage =
    "url('../../assets/images/evening.png')";

        heroBanner.style.background =
            "linear-gradient(135deg,#7F5AF0,#C084FC)";

    }

    // Night
    else {

        greeting.textContent =
            "Good Night, Dharineesh 🌙";

        quote.textContent =
            "Rest well. Great businesses are built one day at a time.";

        heroBanner.style.backgroundImage =
            "url('../../assets/images/night.png')";

        heroBanner.style.background =
            "linear-gradient(135deg,#0F172A,#1E3A8A)";

    }

}
