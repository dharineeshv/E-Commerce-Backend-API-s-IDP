// ==========================================================
// Dashboard Card Counter Animation
// ==========================================================

export function animateCounter(elementId, targetValue) {

    const element = document.getElementById(elementId);

    if (!element) return;

    const intTarget = Math.round(Number(targetValue) || 0);

    if (intTarget === 0) {
        element.textContent = "0";
        return;
    }

    let current = 0;

    const duration = 1000;

    const interval = 20;

    const increment =
        Math.max(1, Math.ceil(intTarget / (duration / interval)));

    const timer = setInterval(() => {

        current += increment;

        if (current >= intTarget) {

            current = intTarget;

            clearInterval(timer);

        }

        element.textContent = Math.round(current);

    }, interval);

}
