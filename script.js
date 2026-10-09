const tabs = document.querySelectorAll(".tab");
const pages = document.querySelectorAll(".page");
const backButton = document.querySelector("#backButton");
const pagesContainer = document.querySelector(".pages");
const tabSwitch = document.querySelector(".tab-switch");
const tabIndicator = document.querySelector(".tab-indicator");

const photoInput = document.querySelector("#photoInput");
const photo = document.querySelector("#photo1");
const photoHint = document.querySelector("#photoHint");
const photoFrame = document.querySelector("#photoFrame");

let currentPage = 0;
let startX = 0;
let startY = 0;
let dragX = 0;
let isDragging = false;
let isHorizontalSwipe = false;

let photoScale = 1;
let pinchStartDistance = 0;
let pinchStartScale = 1;
let isPinching = false;
let lastPhotoTap = 0;

function positionIndicator(index, dragOffset = 0, animate = true) {
    const selectedTab = tabs[index];

    if (!selectedTab || !tabIndicator) return;

    // Берём настоящие размеры вкладок, чтобы индикатор совпадал с ними
    tabIndicator.style.width = `${selectedTab.offsetWidth}px`;

    const x = selectedTab.offsetLeft + dragOffset;

    tabIndicator.style.transition = animate
        ? "transform 0.22s ease"
        : "none";

    tabIndicator.style.transform = `translateX(${x}px)`;
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

    positionIndicator(index);
}

tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => showPage(index));
});

backButton.addEventListener("click", () => {
    showPage(Math.max(0, currentPage - 1));
});

/* Перетягивание страниц пальцем */
pagesContainer.addEventListener("touchstart", (event) => {
    if (event.touches.length > 1) return;

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

        // Вертикальное движение оставляем прокрутке списка
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

    // На первой или последней странице есть лёгкое сопротивление
    if (nextPage < 0 || nextPage >= pages.length) {
        dragX = diffX * 0.25;

        pages[currentPage].style.transition = "none";
        pages[currentPage].style.transform = `translateX(${dragX}px)`;

        positionIndicator(currentPage, 0, false);
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

    // Подложка проходит расстояние между вкладками пропорционально жесту
    const nextTabIndex = diffX < 0
        ? currentPage + 1
        : currentPage - 1;

    const tabDistance = Math.abs(
        tabs[nextTabIndex].offsetLeft - tabs[currentPage].offsetLeft
    );

    const pageWidth = pagesContainer.clientWidth || 1;
    const indicatorOffset = Math.sign(diffX) *
        (Math.abs(diffX) / pageWidth) *
        tabDistance;

    positionIndicator(currentPage, indicatorOffset, false);
}, { passive: false });

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

/* Выбор фотографии из галереи */
photoInput.addEventListener("change", () => {
    const file = photoInput.files && photoInput.files[0];

    if (!file) return;

    photo.src = URL.createObjectURL(file);
    photo.classList.add("visible");
    photoHint.hidden = true;
    photoScale = 1;
    photo.style.transform = "scale(1)";
});

/* Расстояние между двумя пальцами */
function getTouchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;

    return Math.hypot(dx, dy);
}

/* Увеличение фото двумя пальцами */
photoFrame.addEventListener("touchstart", (event) => {
    if (event.touches.length === 2) {
        isPinching = true;
        isDragging = false;
        pinchStartDistance = getTouchDistance(event.touches);
        pinchStartScale = photoScale;
        event.preventDefault();
        event.stopPropagation();
    }
}, { passive: false, capture: true });

photoFrame.addEventListener("touchmove", (event) => {
    if (!isPinching || event.touches.length !== 2) return;

    event.preventDefault();
    event.stopPropagation();

    const distance = getTouchDistance(event.touches);
    photoScale = Math.min(
        4,
        Math.max(1, pinchStartScale * (distance / pinchStartDistance))
    );

    photo.style.transform = `scale(${photoScale})`;
}, { passive: false, capture: true });

function endPinch(event) {
    if (!isPinching) return;

    event.preventDefault();
    event.stopPropagation();

    if (event.touches.length < 2) {
        isPinching = false;
    }
}

photoFrame.addEventListener("touchend", endPinch, {
    passive: false,
    capture: true
});

photoFrame.addEventListener("touchcancel", endPinch, {
    passive: false,
    capture: true
});

/* Двойное нажатие увеличивает или возвращает исходный размер */
photoFrame.addEventListener("click", () => {
    if (!photo.classList.contains("visible")) return;

    const now = Date.now();

    if (now - lastPhotoTap < 300) {
        photoScale = photoScale > 1 ? 1 : 2;
        photo.style.transform = `scale(${photoScale})`;
    }

    lastPhotoTap = now;
});

/* Подгоняем белую подложку при загрузке и изменении размера */
window.addEventListener("resize", () => {
    positionIndicator(currentPage);
});

positionIndicator(currentPage);