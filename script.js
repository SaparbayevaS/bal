const tabs = document.querySelectorAll(".tab");
const pages = document.querySelectorAll(".page");
const backButton = document.querySelector("#backButton");
const pagesContainer = document.querySelector(".pages");
const tabIndicator = document.querySelector(".tab-indicator");

let currentPage = 0;
let startX = 0;
let startY = 0;
let dragX = 0;
let isDragging = false;
let isHorizontalSwipe = false;

function moveIndicator(index, offset = 0, animate = true) {
    const tabWidth = tabIndicator.offsetWidth;
    const gap = 4;
    const shift = index * (tabWidth + gap) + offset;

    tabIndicator.style.transition = animate
        ? "transform 0.22s ease"
        : "none";

    tabIndicator.style.transform = `translateX(${shift}px)`;
}

function showPage(index) {
    if (index < 0 || index >= pages.length) return;

    currentPage = index;

    tabs.forEach((tab, i) => {
        tab.classList.toggle("active", i === index);
    });

    pages.forEach((page, i) => {
        page.classList.toggle("active", i === index);
        page.style.transform = "";
        page.style.opacity = "";
        page.style.transition = "";
    });

    moveIndicator(index);
}

tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => showPage(index));
});

backButton.addEventListener("click", () => {
    showPage(Math.max(0, currentPage - 1));
});

/* Перетягивание страницы пальцем */
pagesContainer.addEventListener("touchstart", (event) => {
    if (!event.touches.length) return;

    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
    dragX = 0;
    isDragging = true;
    isHorizontalSwipe = false;
}, { passive: true });

pagesContainer.addEventListener("touchmove", (event) => {
    if (!isDragging || !event.touches.length) return;

    const currentX = event.touches[0].clientX;
    const currentY = event.touches[0].clientY;
    const diffX = currentX - startX;
    const diffY = currentY - startY;

    if (!isHorizontalSwipe) {
        if (Math.abs(diffX) < 8 && Math.abs(diffY) < 8) return;

        // Вертикальный жест оставляем прокрутке списка
        if (Math.abs(diffY) > Math.abs(diffX)) {
            isDragging = false;
            return;
        }

        isHorizontalSwipe = true;
    }

    event.preventDefault();

    const nextPage = diffX < 0
        ? currentPage + 1
        : currentPage - 1;

    // На первой и последней вкладке движение слегка сопротивляется
    if (nextPage < 0 || nextPage >= pages.length) {
        dragX = diffX * 0.25;
        pages[currentPage].style.transform = `translateX(${dragX}px)`;
        moveIndicator(currentPage, dragX / 2, false);
        return;
    }

    dragX = diffX;

    pages.forEach((page, index) => {
        page.style.transition = "none";

        if (index === currentPage) {
            page.style.opacity = "1";
            page.style.transform = `translateX(${diffX}px)`;
        } else if (index === nextPage) {
            const pageWidth = pagesContainer.clientWidth;
            const startOffset = diffX < 0 ? pageWidth : -pageWidth;

            page.style.opacity = "1";
            page.style.transform =
                `translateX(${diffX + startOffset}px)`;
        }
    });

    // Белая подложка двигается вслед за пальцем
    moveIndicator(currentPage, diffX / 2, false);
});

function finishSwipe() {
    if (!isDragging) return;

    isDragging = false;

    const threshold = pagesContainer.clientWidth * 0.25;

    if (isHorizontalSwipe && Math.abs(dragX) > threshold) {
        const nextPage = dragX < 0
            ? currentPage + 1
            : currentPage - 1;

        showPage(nextPage);
    } else {
        showPage(currentPage);
    }

    isHorizontalSwipe = false;
}

pagesContainer.addEventListener("touchend", finishSwipe);
pagesContainer.addEventListener("touchcancel", finishSwipe);

/* Значок квадратиков декоративный: копирование не выполняется */
moveIndicator(currentPage);