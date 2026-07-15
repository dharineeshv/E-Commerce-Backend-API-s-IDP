// ==========================================================
// Dashboard Card Counter Animation
// ==========================================================

export function animateCounter(elementId, targetValue) {

    const element = document.getElementById(elementId);

    if (!element) return;

    let current = 0;

    const duration = 1000;

    const interval = 20;

    const increment =
        Math.ceil(targetValue / (duration / interval));

    const timer = setInterval(() => {

        current += increment;

        if (current >= targetValue) {

            current = targetValue;

            clearInterval(timer);

        }

        element.textContent = current;

    }, interval);

}