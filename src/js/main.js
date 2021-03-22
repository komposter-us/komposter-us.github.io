/*
|--------------------------------------------------------------------------
| Defines
|--------------------------------------------------------------------------
*/
// indexes in phrases[lang].statusFull & phrases[lang].statusShort
const AliveStatus = {
    Empty: -1,
    Defended: 0,
    Unknown: 1,
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
        statusShort: ["К", "?", "Ч", "М", "И", "У", "В"],
        statusFull: ["Красный", "?", "Черный", "Мирный", "Импостер", "Убит", "Выброшен"]
    },
    "en": {
        misc: ["Round"],
        statusShort: ["D", "?", "S", "C", "I", "K", "E"],
        statusFull: ["Defended", "Unknown", "Suspect", "Crewmate", "Impostor", "Killed", "Ejected"]
    }
};

const g_aCrewmateColor = ["#132ED1", "#3F474E", "#6B31BC", "#71491E", "#C51111", "#117F2D", "#ED54BA", "#EF7D0E", "#50EF39", "#F6F658", "#38FEDB", "#D6E0F0"];
const g_sLang = window.navigator.language.slice(0, 2) === "ru" ? "ru" : "en";
const getCssOverlayClass = (aliveStatus) => "overlay-" + g_oPhrases.en.statusFull[aliveStatus].toLowerCase();
const hasOverlay = (card) => card.dataset.status > AliveStatus.Suspect;
/*
|--------------------------------------------------------------------------
| Round Control
|--------------------------------------------------------------------------
*/
let g_iRound = 1;
const MAX_ROUND = 8;
const btnRound = document.querySelector(".btn-round");
const btnText = document.querySelector(".btn-round-num");
const btnRoundText = document.querySelector(".btn-round-text");
btnRoundText.textContent = g_oPhrases[g_sLang].misc[Misc.Round];

btnRound.addEventListener("click", function () {
    if (g_iRound >= MAX_ROUND) return;
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

    for (const [cardNum, color] of g_aCrewmateColor.entries()) {
        const card = document.createElement("div");
        card.classList.add("card");
        card.style.backgroundColor = color;
        card.dataset.status = AliveStatus.Unknown;

        const statusContainer = document.createElement("div");
        statusContainer.classList.add("card-status-container", "card-container-indent");

        for (let i = 0; i < MAX_ROUND; i++) {
            createCardStatus(statusContainer, i ? AliveStatus.Empty : AliveStatus.Unknown);
        }
        statusContainer.firstChild.classList.add("card-status-active");

        const btnContainer = document.createElement("div");
        btnContainer.classList.add("btn-group", "card-container-indent");
        btnContainer.setAttribute("role", "group");
        btnContainer.setAttribute("aria-label", "Round status card " + cardNum);

        const verdictContainer = document.createElement("div");
        verdictContainer.classList.add("card-verdict-container", "card-container-indent");

        for (let status = AliveStatus.Defended; status <= AliveStatus.Ejected; status++) {
            if (status < AliveStatus.Crewmate) {
                let elem = document.createElement("input");
                elem.classList.add("btn-check");
                elem.setAttribute("type", "radio");
                elem.setAttribute("name", `btnradio-${cardNum}`);
                elem.setAttribute("id", `radio-${cardNum}-${status}`);
                elem.setAttribute("autocomplete", "off");
                elem.dataset.status = status;
                if (status === AliveStatus.Unknown)
                    elem.setAttribute("checked", "");
                btnContainer.append(elem);

                elem = document.createElement("label");
                elem.classList.add("btn", "btn-status");
                elem.setAttribute("for", `radio-${cardNum}-${status}`);
                elem.append(document.createTextNode(g_oPhrases[g_sLang].statusFull[status]));
                // elem.dataset.status = status;
                btnContainer.append(elem);
                elem.addEventListener("click", onStatusBtnClick.bind(card, cardNum, status));
            }
            else {
                const btn = document.createElement("button");
                btn.classList.add("btn-verdict", "btn-" + getCssOverlayClass(status));
                btn.addEventListener("click", onStatusBtnClick.bind(card, cardNum, status, true));
                verdictContainer.append(btn);
            }
        }

        const controlContainer = document.createElement("div");
        controlContainer.classList.add("card-control-container");

        const btn = document.createElement("button");
        btn.classList.add("btn-close");
        btn.addEventListener("click", closeCard);
        controlContainer.append(btn);

        const content = document.createElement("div");
        content.classList.add("card-content-container", "card-container-indent");
        //content.dataset.status = AliveStatus.Empty;

        content.append(statusContainer);
        content.append(btnContainer);
        content.append(verdictContainer);

        card.append(controlContainer);
        card.append(content);

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
function onStatusBtnClick(cardNum, aliveStatus, overlay = false) {
    /** @type {HTMLDivElement} */
    const statusContainer = this.querySelector(".card-status-container");
    /** @type {HTMLDivElement[]} */
    const statuses = statusContainer.querySelectorAll("*");

    console.log(`onStatusBtnClick > Card: ${cardNum}, status: ${aliveStatus}, statusNums: ${statuses.length}`);

    updateCardRound(statusContainer);
    updateCardStatus(statuses[g_iRound - 1], aliveStatus);

    if (overlay) {
        resetCardBtn(this);
        const content = this.querySelector(".card-content-container");
        content.classList.add(getCssOverlayClass(aliveStatus));

        setTimeout(() => {
            content.addEventListener("click", () => {
                console.log(`onStatusBtnClick > Card: ${cardNum} Remove overlay`);
                content.classList.remove(getCssOverlayClass(aliveStatus));
                this.dataset.status = AliveStatus.Unknown;
                //setStatusContainerChildsVis(statusContainer, false);
                // updateStatusContainer(statusContainer);
            }, { once: true });
        }, 200);
    }
    this.dataset.status = aliveStatus;
}

function updateCardsRound() {
    /** @type {HTMLDivElement[]} */
    const statusContainers = document.querySelector(".card-status-container");
    statusContainers.forEach(updateCardRound);
}

/** @param {HTMLDivElement} statusContainer */
function updateCardRound(statusContainer, aliveStatus = AliveStatus.Empty) {
    const statuses = statusContainer.querySelectorAll("*");

    for (const [i, status] of statuses.entries()) {
        status.classList.remove("card-status-active");

        if (i === g_iRound - 1) {
            status.classList.add("card-status-active");
            updateCardStatus(status, aliveStatus);
        }
    }
}

/** @param {HTMLDivElement} rootElem */
function createCardStatus(rootElem, aliveStatus) {
    const cardStatus = document.createElement("div");
    cardStatus.classList.add("card-status");
    // cardStatus.dataset.status = aliveStatus;
    updateCardStatus(cardStatus, aliveStatus);
    rootElem.append(cardStatus);
}

/** @param {HTMLDivElement} cardStatus */
function updateCardStatus(cardStatus, aliveStatus) {
    if (aliveStatus != AliveStatus.Empty)
        cardStatus.innerHTML = g_oPhrases[g_sLang].statusShort[aliveStatus];
    //cardStatus.dataset.status = aliveStatus;
    //console.log("updateCardStatus >", cardStatus);
}

function onRoundBtnClick() {
    /** @type {HTMLDivElement[]} */
    const cards = document.querySelectorAll(".card");

    for (const card of cards) {
        /** @type {HTMLDivElement[]} */
        const statusContainer = card.querySelector(".card-status-container");
        updateCardRound(statusContainer, hasOverlay(card) ? card.dataset.status : AliveStatus.Unknown);
    }

    resetCardsBtn();
}

/** @param {HTMLDivElement} child */
function getCardOfChild(child) {
    while (child && child.parentElement) {
        if (child.parentElement.classList.contains("card"))
            return child.parentElement;
        child = child.parentElement;
    }
}

function resetCardsBtn() {
    /** @type {HTMLDivElement[]} */
    const cards = document.querySelectorAll(".card");
    cards.forEach(resetCardBtn);
}

/** @param {HTMLDivElement} card */
function resetCardBtn(card) {
    if (hasOverlay(card))
        return;

    const btnsCheck = card.querySelectorAll(".btn-check");

    for (const btnCheck of btnsCheck)
        if (btnCheck.dataset.status == AliveStatus.Unknown)
            btnCheck.click();
}
