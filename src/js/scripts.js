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
    Round: 0,
    Result: 1,
    Status: 2
};

const g_oPhrases = {
    "ru": {
        misc: ["Раунд", "Итог раунда", "Статус"],
        statusShort: ["Н", "?", "П", "М", "И", "У", "В"],
        status: ["Надежн.", "?", "Подозр.", "Мирный", "Импостер", "Убит", "Выброшен"],
        statusFull: ["Надежный", "Неизвестный", "Подозреваемый", "", "", "", ""]
    },
    "en": {
        misc: ["Round", "Round result", "Status"],
        statusShort: ["T", "?", "S", "C", "I", "K", "E"],
        status: ["Trusted", "Unknown", "Suspect", "Crewmate", "Impostor", "Killed", "Ejected"],
        statusFull: ["", "", "", "", "", "", ""],
    }
};

const g_aCrewmateColor = ["#731B13", "#132ED1", "#3F474E", "#6B31BC", "#71491E", "#C51111", "#117F2D", "#ED54BA", "#EF7D0E", "#EC7578", "#708497", "#50EF39", "#928776", "#F6F658", "#38FEDB", "#ECC0D3", "#FFFDBE", "#D6E0F0"];
const g_sLang = window.navigator.language.slice(0, 2) === "ru" ? "ru" : "en";
const getCssOverlayClass = (aliveStatus) => "overlay-" + g_oPhrases.en.status[aliveStatus].toLowerCase();
const getFullPhrase = (aliveStatus) => g_oPhrases[g_sLang].statusFull[aliveStatus] ? g_oPhrases[g_sLang].statusFull[aliveStatus] : g_oPhrases[g_sLang].status[aliveStatus];
const hasOverlay = (card) => card.dataset.status > AliveStatus.Suspect;
/** @type {HTMLDivElement[]} */
const g_aCards = [];
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

btnRound.addEventListener("click", onRoundBtnClick);

const btnRestart = document.querySelector(".btn-restart");
btnRestart.addEventListener("click", onResetBtnClick);
/*
|--------------------------------------------------------------------------
| Create Cards
|--------------------------------------------------------------------------
*/
const cardContainter = document.querySelector(".card-containter");
const colorContainter = document.querySelector(".color-container");

for (const [cardNum, color] of g_aCrewmateColor.entries()) {
    // cards
    const card = document.createElement("div");
    card.classList.add("card");
    card.style.backgroundColor = color;
    card.dataset.status = AliveStatus.Unknown;
    card.dataset.round = 0;

    const text = document.createElement("h6");
    if (cardNum > 6)
        text.style.color = "#000";

    const statusContainer = document.createElement("div");
    statusContainer.classList.add("card-status-container", "card-container-indent");

    for (let i = 0; i < MAX_ROUND; i++) {
        const cardStatus = document.createElement("div");
        cardStatus.classList.add("card-status");
        statusContainer.append(cardStatus);
        cardStatus.addEventListener("mouseenter", onMouseEnterStatus.bind(text, cardStatus, i + 1));
        cardStatus.addEventListener("mouseout", onMouseOverStatus.bind(text));
        cardStatus.addEventListener("click", onClickStatus.bind(cardStatus, card, i));
        updateCardStatus(cardStatus, i ? AliveStatus.Empty : AliveStatus.Unknown);
    }
    statusContainer.firstChild.classList.add("card-status-active");

    const btnContainer = document.createElement("div");
    btnContainer.classList.add("btn-group", "card-container-indent");
    btnContainer.setAttribute("role", "group");
    btnContainer.setAttribute("aria-label", "Round status card " + cardNum);

    const verdictContainer = document.createElement("div");
    verdictContainer.classList.add("card-verdict-container", "card-container-indent");

    for (let status = AliveStatus.Defended; status <= AliveStatus.Ejected; status++) {
        let elem;
        const bStatus = status > AliveStatus.Suspect;
        if (bStatus) {
            elem = document.createElement("button");
            elem.classList.add("btn-verdict", "btn-" + getCssOverlayClass(status));
            verdictContainer.append(elem);
        }
        else {
            elem = document.createElement("input");
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
            elem.append(document.createTextNode(g_oPhrases[g_sLang].status[status]));
            // elem.dataset.status = status;
            btnContainer.append(elem);
        }
        elem.addEventListener("click", onStatusBtnClick.bind(card, cardNum, status, bStatus));
        elem.addEventListener("mouseenter", onMouseEnterBtn.bind(text, status, bStatus));
        elem.addEventListener("mouseout", onMouseOverBtn.bind(text));
    }

    const controlContainer = document.createElement("div");
    controlContainer.classList.add("card-control-container");

    controlContainer.append(text);

    // color control
    const colorClose = document.createElement("div");
    colorClose.classList.add("color-close");
    colorClose.style.backgroundColor = color;
    colorContainter.append(colorClose);
    const cardCloseCallback = onCardCloseBtnClick.bind(card, colorClose, cardNum);
    colorClose.addEventListener("click", cardCloseCallback);

    const btn = document.createElement("button");
    btn.classList.add("btn-close");
    btn.addEventListener("click", cardCloseCallback);
    controlContainer.append(btn);

    const content = document.createElement("div");
    content.classList.add("card-content-container", "card-container-indent");

    content.append(statusContainer);
    content.append(btnContainer);
    content.append(verdictContainer);

    card.append(controlContainer);
    card.append(content);

    cardContainter.append(card);
    g_aCards.push(card);
}

function onRoundBtnClick() {
    if (g_iRound >= MAX_ROUND) return;

    for (const card of g_aCards) {
        card.dataset.round = g_iRound;
        updateCardRound(card, hasOverlay(card) ? card.dataset.status : AliveStatus.Unknown);
        resetCardRadio(card);
    }
    btnText.textContent = ++g_iRound;
}

/** @this {HTMLDivElement} */
function onCardCloseBtnClick(colorClose) {
    // show
    if (colorClose.classList.contains("color-closed")) {
        colorClose.classList.remove("color-closed", "hidden", "opacity-0");
        this.classList.remove("hidden", "opacity-0");
        this.removeEventListener("transitionend", onHide);
    }
    // hide
    else {
        colorClose.classList.add("color-closed");
        this.classList.add("opacity-0");
        this.addEventListener("transitionend", onHide);
    }

}

function onHide() {
    this.classList.add("hidden");
}

function onResetBtnClick() {
    g_iRound = 1;
    btnText.textContent = g_iRound;
    // document.location.reload();
    for (const card of g_aCards) {
        // remove overlay
        const content = card.querySelector(".card-content-container");
        content.classList.remove(getCssOverlayClass(card.dataset.status));

        // reset data/btns
        card.dataset.round = 0;
        card.dataset.status = AliveStatus.Unknown;
        updateCardRound(card, AliveStatus.Unknown);
        resetCardRadio(card);

        // reset statuses
        const cardStatuses = card.querySelectorAll(".card-status");

        for (const [i, cardStatus] of cardStatuses.entries()) {
            updateCardStatus(cardStatus, i ? AliveStatus.Empty : AliveStatus.Unknown);
        }
    }
}
/*
|--------------------------------------------------------------------------
| Card Logic
|--------------------------------------------------------------------------
*/
/** @this {HTMLButtonElement} */
function onStatusBtnClick(cardNum, aliveStatus, bStatus = false) {
    /** @type {HTMLDivElement[]} */
    const statuses = this.querySelectorAll(".card-status");

    console.log(`onStatusBtnClick > Card: ${cardNum}, status: ${aliveStatus}, statusNums: ${statuses.length}`);

    updateCardRound(this);
    updateCardStatus(statuses[this.dataset.round], aliveStatus);

    if (bStatus) {
        uncheckedCardRadio(this);
        const content = this.querySelector(".card-content-container");
        content.classList.add(getCssOverlayClass(aliveStatus));

        setTimeout(() => {
            content.addEventListener("click", () => {
                console.log(`onStatusBtnClick > Card: ${cardNum} Remove overlay`);
                content.classList.remove(getCssOverlayClass(aliveStatus));
                this.dataset.status = AliveStatus.Unknown;
                resetCardRadio(this);
                updateCardRound(this, AliveStatus.Unknown);
            }, { once: true });
        }, 200);
    }
    this.dataset.status = aliveStatus;
}

/** @this {HTMLTextElement} */
function onMouseEnterBtn(aliveStatus, bStatus = false) {
    this.innerHTML = g_oPhrases[g_sLang].misc[bStatus ? Misc.Status : Misc.Result] + ": " + getFullPhrase(aliveStatus);
    this.classList.add("opacity-1");
}

/** @this {HTMLButtonElement} */
function onMouseOverBtn() {
    this.classList.remove("opacity-1");
}

/** @this {HTMLTextElement} */
function onMouseEnterStatus(cardStatus, round) {
    let phrase = getFullPhrase(cardStatus.dataset.status);
    phrase = phrase ? (": " + phrase) : "";
    this.innerHTML = g_oPhrases[g_sLang].misc[Misc.Round] + " " + round + phrase;
    this.classList.add("opacity-1");
}

/** @this {HTMLTextElement} */
function onMouseOverStatus() {
    this.classList.remove("opacity-1");
}

/** 
 * @param {HTMLDivElement} card
 * @this {HTMLDivElement} 
 */
function onClickStatus(card, round) {
    if (this.dataset.status == AliveStatus.Empty)
        return;

    if (hasOverlay(this))
        uncheckedCardRadio(card);
    else
        checkedCardRadioByStatus(card, this.dataset.status);

    card.dataset.round = round;
    updateCardRound(card, undefined, false);
}

/** @param {HTMLDivElement} card */
function uncheckedCardRadio(card) {
    const elems = card.querySelectorAll(".btn-check");
    for (const e of elems) {
        e.checked = false;
    }
}
/** @param {HTMLDivElement} card */
function checkedCardRadioByStatus(card, aliveStatus) {
    const elems = card.querySelectorAll(".btn-check");

    for (const e of elems) {
        if (e.dataset.status == aliveStatus)
            e.checked = true;
    }
}

/** @param {HTMLDivElement} card */
function updateCardRound(card, aliveStatus = AliveStatus.Empty, updateStatus = true) {
    const statuses = card.querySelectorAll(".card-status");

    for (const [i, status] of statuses.entries()) {
        status.classList.remove("card-status-active");

        if (i == card.dataset.round) {
            status.classList.add("card-status-active");

            if (updateStatus)
                updateCardStatus(status, aliveStatus);
        }
    }
}

/** @param {HTMLDivElement} cardStatus */
function updateCardStatus(cardStatus, aliveStatus) {
    if (aliveStatus != AliveStatus.Empty)
        cardStatus.innerHTML = g_oPhrases[g_sLang].statusShort[aliveStatus];
    else
        cardStatus.innerHTML = "";

    cardStatus.dataset.status = aliveStatus;
}

/** @param {HTMLDivElement} card */
function resetCardRadio(card) {
    if (hasOverlay(card))
        return;

    const elems = card.querySelectorAll(".btn-check");

    for (const e of elems) {
        if (e.dataset.status == AliveStatus.Unknown)
            e.click();
    }
}
/*
|--------------------------------------------------------------------------
| Sotrable
|--------------------------------------------------------------------------
*/
/* const { Sortable } = require("@shopify/draggable");

new Sortable(document.querySelector(".card-containter"), {
    draggable: ".card",
    delay: { mouse: 1000, drag: 1000, touch: 1000 }
}); */