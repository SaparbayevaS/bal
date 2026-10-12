const tabs = document.querySelectorAll(".tab");
const pages = document.querySelectorAll(".page");
const backButton = document.querySelector("#backButton");
const pagesContainer = document.querySelector(".pages");
const tabSwitch = document.querySelector(".tab-switch");
const tabIndicator = document.querySelector(".tab-indicator");
const photo = document.querySelector("#photo1");
const photoHint = document.querySelector("#photoHint");
const photoFrame = document.querySelector("#photoFrame");

let currentPage = 0;

let startX = 0;
let startY = 0;
let dragX = 0;
let startWasInPages = false;
let canPullDown = true;
let canPullUp = true;

let isDragging = false;
let isHorizontalSwipe = false;
let isVerticalPull = false;

let photoScale = 1;
let pinchStartDistance = 0;
let pinchStartScale = 1;
let isPinching = false;
let lastPhotoTap = 0;

/* Положение белой подложки вкладки */
function positionIndicator(index, dragOffset = 0, animate = true) {
    const selectedTab = tabs[index];
    if (!selectedTab) return;

    const switchRect = tabSwitch.getBoundingClientRect();
    const tabRect = selectedTab.getBoundingClientRect();
    const x = tabRect.left - switchRect.left + dragOffset;

    tabIndicator.style.width = `${tabRect.width}px`;
    tabIndicator.style.transition = animate
        ? "transform 0.22s ease"
        : "none";
    tabIndicator.style.transform = `translateX(${x}px)`;
}

/* Переключение вкладки */
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

/*
 * Начало жеста.
 * Вертикальное вытягивание можно начать от шапки или от страницы.
 */
document.addEventListener("touchstart", (event) => {
    if (event.touches.length !== 1) return;

    const target = event.target;
    const startedInTabs = target.closest(".tabs");
    const startedInPages = target.closest(".pages");

    if (!startedInTabs && !startedInPages) return;

    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
    dragX = 0;

    startWasInPages = Boolean(startedInPages);
    isDragging = true;
    isHorizontalSwipe = false;
    isVerticalPull = false;

    const textList = target.closest(".text-list");

    if (textList) {
        canPullDown = textList.scrollTop <= 0;
        canPullUp =
            textList.scrollTop + textList.clientHeight >=
            textList.scrollHeight - 1;
    } else {
        canPullDown = true;
        canPullUp = true;
    }
}, { passive: true });

/* Движение за пальцем */
document.addEventListener("touchmove", (event) => {
    if (!isDragging || event.touches.length !== 1) return;

    const fingerX = event.touches[0].clientX;
    const fingerY = event.touches[0].clientY;
    const diffX = fingerX - startX;
    const diffY = fingerY - startY;

    if (!isHorizontalSwipe && !isVerticalPull) {
        if (Math.abs(diffX) < 8 && Math.abs(diffY) < 8) return;

        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Горизонтальный свайп работает только внутри области страниц
            if (!startWasInPages) {
                isDragging = false;
                return;
            }

            isHorizontalSwipe = true;
        } else {
            const pullingDown = diffY > 0;
            const canPullInThisDirection = pullingDown
                ? canPullDown
                : canPullUp;

            if (!canPullInThisDirection) {
                // Обычную прокрутку списка оставляем браузеру
                isDragging = false;
                return;
            }

            isVerticalPull = true;
        }
    }

    if (isVerticalPull) {
        event.preventDefault();

        // Вниз — от шапки; вверх — от нижнего блока
        const pullDistance = Math.max(
            -140,
            Math.min(diffY * 0.55, 140)
        );

        const page = pages[currentPage];
        page.style.transition = "none";
        page.style.transform = `translate3d(0, ${pullDistance}px, 0)`;
        return;
    }

    if (!isHorizontalSwipe) return;

    event.preventDefault();

    const nextPage = diffX < 0
        ? currentPage + 1
        : currentPage - 1;

    // Не растягиваем пустое пространство за первой и последней вкладками
    if (nextPage < 0 || nextPage >= pages.length) return;

    dragX = diffX;

    pages.forEach((page, index) => {
        page.style.transition = "none";

        if (index === currentPage) {
            page.style.opacity = "1";
            page.style.transform = `translateX(${diffX}px)`;
        } else if (index === nextPage) {
            const width = pagesContainer.clientWidth;
            const startOffset = diffX < 0 ? width : -width;

            page.style.opacity = "1";
            page.style.transform =
                `translateX(${diffX + startOffset}px)`;
        }
    });

    // Белая подложка проходит расстояние между вкладками
    const tabDistance = Math.abs(
        tabs[1].getBoundingClientRect().left -
        tabs[0].getBoundingClientRect().left
    );

    const pageWidth = pagesContainer.clientWidth || 1;
    const indicatorOffset = (-diffX / pageWidth) * tabDistance;

    positionIndicator(currentPage, indicatorOffset, false);
}, { passive: false });

/* Возвращаем страницу или завершаем переход */
function finishGesture() {
    if (!isDragging) return;

    isDragging = false;

    if (isVerticalPull) {
        const page = pages[currentPage];

        // После отпускания страница возвращается на место
        page.style.transition = "";
        page.style.transform = "";

        isVerticalPull = false;
        return;
    }

    if (isHorizontalSwipe) {
        const threshold = pagesContainer.clientWidth * 0.25;

        if (Math.abs(dragX) > threshold) {
            const nextPage = dragX < 0
                ? currentPage + 1
                : currentPage - 1;

            showPage(nextPage);
        } else {
            showPage(currentPage);
        }
    }

    isHorizontalSwipe = false;
}

document.addEventListener("touchend", finishGesture);
document.addEventListener("touchcancel", finishGesture);

/* Показываем фото, если файл найден */
function showPhoto() {
    if (photo.complete && photo.naturalWidth > 0) {
        photo.classList.add("visible");
        photoHint.hidden = true;
    } else {
        photo.classList.remove("visible");
        photoHint.hidden = false;
    }
}

photo.addEventListener("load", showPhoto);
photo.addEventListener("error", showPhoto);
showPhoto();

/* Увеличение фото двумя пальцами */
function touchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;

    return Math.hypot(dx, dy);
}

photoFrame.addEventListener("touchstart", (event) => {
    if (event.touches.length !== 2) return;

    isPinching = true;
    isDragging = false;
    pinchStartDistance = touchDistance(event.touches);
    pinchStartScale = photoScale;

    event.preventDefault();
    event.stopPropagation();
}, { passive: false, capture: true });

photoFrame.addEventListener("touchmove", (event) => {
    if (!isPinching || event.touches.length !== 2) return;

    event.preventDefault();
    event.stopPropagation();

    const distance = touchDistance(event.touches);

    photoScale = Math.min(
        4,
        Math.max(1, pinchStartScale * (distance / pinchStartDistance))
    );

    photo.style.transform = `scale(${photoScale})`;
}, { passive: false, capture: true });

function finishPinch(event) {
    if (!isPinching) return;

    event.preventDefault();
    event.stopPropagation();

    if (event.touches.length < 2) {
        isPinching = false;
    }
}

photoFrame.addEventListener("touchend", finishPinch, {
    passive: false,
    capture: true
});

photoFrame.addEventListener("touchcancel", finishPinch, {
    passive: false,
    capture: true
});

/* Двойное нажатие увеличивает фото или возвращает его к обычному размеру */
photoFrame.addEventListener("click", () => {
    if (!photo.classList.contains("visible")) return;

    const now = Date.now();

    if (now - lastPhotoTap < 300) {
        photoScale = photoScale > 1 ? 1 : 2;
        photo.style.transform = `scale(${photoScale})`;
    }

    lastPhotoTap = now;
});

/* Подгоняем подложку при изменении размера окна */
window.addEventListener("resize", () => {
    positionIndicator(currentPage);
});

positionIndicator(currentPage);