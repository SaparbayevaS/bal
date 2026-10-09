const tabs = document.querySelectorAll(".tab");
const pages = document.querySelectorAll(".page");
const backButton = document.querySelector("#backButton");

let currentPage = 0;

function showPage(index) {
    if (index < 0 || index >= pages.length) return;

    currentPage = index;

    tabs.forEach((tab, i) => {
        tab.classList.toggle("active", i === index);
    });

    pages.forEach((page, i) => {
        page.classList.toggle("active", i === index);
    });
}

tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => showPage(index));
});

backButton.addEventListener("click", () => {
    showPage(Math.max(0, currentPage - 1));
});

// Свайпы между вкладками
let startX = 0;
let startY = 0;

document.addEventListener("touchstart", (event) => {
    if (!event.touches.length) return;

    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
}, { passive: true });

document.addEventListener("touchend", (event) => {
    if (!event.changedTouches.length) return;

    const diffX = event.changedTouches[0].clientX - startX;
    const diffY = event.changedTouches[0].clientY - startY;

    if (Math.abs(diffX) < 60) return;
    if (Math.abs(diffX) < Math.abs(diffY)) return;

    showPage(diffX < 0 ? currentPage + 1 : currentPage - 1);
}, { passive: true });

// Копирование чёрного текста
document.querySelectorAll(".copy-button").forEach((button) => {
    button.addEventListener("click", async () => {
        const text = button
            .closest(".black-row")
            .querySelector(".black-text")
            .textContent.trim();

        try {
            await navigator.clipboard.writeText(text);
            button.textContent = "✓";
        } catch {
            const field = document.createElement("textarea");
            field.value = text;
            field.style.position = "fixed";
            field.style.opacity = "0";
            document.body.appendChild(field);
            field.select();

            try {
                document.execCommand("copy");
                button.textContent = "✓";
            } catch {
                button.textContent = "!";
            }

            field.remove();
        }

        setTimeout(() => {
            button.textContent = "▢";
        }, 1200);
    });
});