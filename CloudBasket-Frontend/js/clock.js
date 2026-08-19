// ==========================================================
// Live Clock
// ==========================================================

export function initializeClock() {

    const dateElement =
        document.getElementById("current-date");

    const timeElement =
        document.getElementById("current-time");

    function updateClock() {

        const now = new Date();

        // -----------------------------
        // Date
        // -----------------------------

        const dateOptions = {

            weekday: "long",

            day: "numeric",

            month: "long",

            year: "numeric"

        };

        dateElement.textContent =
            now.toLocaleDateString(
                "en-IN",
                dateOptions
            );

        // -----------------------------
        // Time
        // -----------------------------

        const timeOptions = {

            hour: "2-digit",

            minute: "2-digit",

            second: "2-digit",

            hour12: true

        };

        timeElement.textContent =
            now.toLocaleTimeString(
                "en-IN",
                timeOptions
            );

    }

    updateClock();

    setInterval(updateClock,1000);

}
