
const tabs = document.querySelectorAll(".tab");
const pages = document.querySelectorAll(".page");

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

// Переключение нажатием на вкладки
tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
        showPage(index);
    });
});

// Переключение свайпом
let startX = 0;
let startY = 0;

document.addEventListener("touchstart", (event) => {
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
}, { passive: true });

document.addEventListener("touchend", (event) => {
    const endX = event.changedTouches[0].clientX;
    const endY = event.changedTouches[0].clientY;

    const diffX = endX - startX;
    const diffY = endY - startY;

    if (Math.abs(diffX) < 60) return;
    if (Math.abs(diffX) < Math.abs(diffY)) return;

    if (diffX < 0) {
        showPage(currentPage + 1);
    } else {
        showPage(currentPage - 1);
    }
}, { passive: true });

