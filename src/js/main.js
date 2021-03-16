/*
|--------------------------------------------------------------------------
| Defines
|--------------------------------------------------------------------------
*/
const UPDATE_OVERLAYED_CARD_STATUS = true;

// indexes in phrases[lang].statusFull & phrases[lang].statusShort
const AliveStatus = {
    Unknown: 0,
    Defended: 1,
    Suspect: 2,
    Crewmate: 3,
    Imposter: 4,
    Killed: 5,
    Ejected: 6
};
// indexes in phrases[lang].misc
const Misc = {
    Round: 0
};

const g_oPhrases = {
    "ru": {
        misc: ["Раунд"],
        statusShort: ["?", "К", "Ч", "М", "И", "У", "В"],
        statusFull: ["Неизвестный", "Красный", "Черный", "Мирный", "Импостер", "Убит", "Выброшен"]
    },
    "en": {
        misc: ["Round"],
        statusShort: ["?", "D", "S", "C", "I", "K", "E"],
        statusFull: ["Unknown", "Defended", "Suspect", "Crewmate", "Impostor", "Killed", "Ejected"]
    }
};

const g_aCrewmateColor = ["#C51111", "#132ED1", "#117F2D", "#ED54BA", "#EF7D0E", "#F6F658", "#3F474E", "#D6E0F0", "#6B31BC", "#71491E", "#38FEDB", "#50EF39"];
const g_sLang = window.navigator.language.slice(0, 2) === "ru" ? "ru" : "en";
const getCssOverlayClass = (aliveStatus) => "overlay-" + g_oPhrases.en.statusFull[aliveStatus].toLowerCase();
/*
|--------------------------------------------------------------------------
| Round Control
|--------------------------------------------------------------------------
*/
let g_iRound = 1;

const btnRound = document.querySelector(".btn-round");
const btnText = document.querySelector(".btn-round-num");
const btnRoundText = document.querySelector(".btn-round-text");
btnRoundText.textContent = g_oPhrases[g_sLang].misc[Misc.Round];

btnRound.addEventListener("click", function () {
    btnText.textContent = ++g_iRound;
    onRoundBtnClick();
});

const btnRestart = document.querySelector(".btn-restart");
btnRestart.addEventListener("click", function () {
    document.location.reload();
});

/*
|--------------------------------------------------------------------------
| Create Cards
|--------------------------------------------------------------------------
*/
createCards();

function createCards() {
    const cardContainter = document.querySelector(".card-containter");

    for (const [i, color] of g_aCrewmateColor.entries()) {
        const statusContainer = document.createElement("div");
        statusContainer.classList.add("card-status-container");
        createCardStatus(statusContainer, AliveStatus.Unknown);

        const btnContainer = document.createElement("div");
        btnContainer.classList.add("card-btn-container");

        for (let aliveStatus = 0; aliveStatus < g_oPhrases[g_sLang].statusFull.length; aliveStatus++) {
            const btn = document.createElement("button");
            btn.classList.add("btn-status");
            btn.append(document.createTextNode(g_oPhrases[g_sLang].statusFull[aliveStatus]));
            btnContainer.append(btn);
            btn.addEventListener("click", onStatusBtnClick.bind(btn, i, aliveStatus));
        }

        const card = document.createElement("div");
        card.classList.add("card");
        card.style.backgroundColor = color;

        const controlContainer = document.createElement("div");
        controlContainer.classList.add("card-control-container");

        const btn = document.createElement("button");
        btn.classList.add("btn-close");
        btn.addEventListener("click", closeCard);
        controlContainer.append(btn);

        card.append(controlContainer);
        card.append(statusContainer);
        card.append(btnContainer);

        cardContainter.append(card);
    }
}

function closeCard() {
    console.log("close card", this.parentElement.parentElement);
    this.parentElement.parentElement.classList.add("hidden");
}
/*
|--------------------------------------------------------------------------
| Card Logic
|--------------------------------------------------------------------------
*/
/** @this {HTMLButtonElement} */
function onStatusBtnClick(cardNum, aliveStatus) {
    /** @type {HTMLDivElement} */
    const card = this.parentElement.parentElement;
    /** @type {HTMLDivElement} */
    const statusContainer = card.querySelector(".card-status-container");
    const statusNums = statusContainer.querySelectorAll("*").length;

    console.log(`onStatusBtnClick > Card: ${cardNum}, status: ${aliveStatus}, statusNums: ${statusNums}`);

    if (statusNums < g_iRound)
        createCardStatus(statusContainer, aliveStatus);
    else
        updateCardStatus(statusContainer.lastElementChild, aliveStatus);

    if (aliveStatus > AliveStatus.Suspect) {
        console.log(`onStatusBtnClick > Card: ${cardNum} add overlay`);
        card.classList.add(getCssOverlayClass(aliveStatus));
        card.querySelector(".btn-close").classList.add("btn-close-white");

        setTimeout(() => {
            card.addEventListener("click", () => {
                console.log(`onStatusBtnClick > Card: ${cardNum} Remove overlay`);
                card.classList.remove(getCssOverlayClass(aliveStatus));
                card.querySelector(".btn-close").classList.remove("btn-close-white");
                setStatusContainerChildsVis(statusContainer, false);
                updateStatusContainer(statusContainer);
            }, { once: true });
        }, 200);
    }
}

/** @param {HTMLDivElement} rootElem */
function createCardStatus(rootElem, aliveStatus, invis = false) {
    const cardStatus = document.createElement("div");
    cardStatus.classList.add("card-status");
    cardStatus.dataset.status = aliveStatus;
    updateCardStatus(cardStatus, aliveStatus);
    rootElem.append(cardStatus);

    if (invis)
        cardStatus.classList.add("invisible");
}

/** @param {HTMLDivElement} cardStatus */
function updateCardStatus(cardStatus, aliveStatus) {
    cardStatus.innerHTML = g_oPhrases[g_sLang].statusShort[aliveStatus];
    cardStatus.dataset.status = aliveStatus;
    console.log("updateCardStatus >", cardStatus);
}

function onRoundBtnClick() {
    /** @type {HTMLDivElement[]} */
    const statusContainers = document.querySelectorAll(".card-status-container");
    let hasOverlay;

    for (const cardStatus of statusContainers) {
        hasOverlay = cardStatus.lastElementChild.dataset.status > AliveStatus.Suspect || cardStatus.lastElementChild.classList.contains("invisible");

        if (!UPDATE_OVERLAYED_CARD_STATUS && hasOverlay)
            continue;

        if (cardStatus.querySelectorAll("*").length < g_iRound)
            createCardStatus(cardStatus, AliveStatus.Unknown, UPDATE_OVERLAYED_CARD_STATUS && hasOverlay);
    }
}

/** @param {HTMLDivElement} statusContainer */
function updateStatusContainer(statusContainer) {
    let nums = statusContainer.querySelectorAll("*").length;

    while (nums++ < g_iRound)
        createCardStatus(statusContainer, AliveStatus.Unknown);
}

/** @param {HTMLDivElement} statusContainer */
function setStatusContainerChildsVis(statusContainer, hide) {
    const cardStatuses = statusContainer.querySelectorAll("*");

    for (const cardStatus of cardStatuses) {
        if (hide)
            cardStatus.classList.add("invisible");
        else
            cardStatus.classList.remove("invisible");
    }
}