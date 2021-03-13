/*
|--------------------------------------------------------------------------
| Defines
|--------------------------------------------------------------------------
*/
// indexes in phrases[lang].statusFull & phrases[lang].statusShort
const AliveStatus = {
    Unknown: 0,
    Defended: 1,
    Suspect: 2,
    Crewmate: 3,
    Imposter: 4
};
// indexes in phrases[lang].misc
const Misc = {
    Round: 0
};

const phrases = {
    "ru": {
        misc: ["Раунд"],
        statusShort: ["?", "К", "Ч", "М", "И", "У"],
        statusFull: ["Неизвестный", "Красный", "Черный", "Мирный", "Импостер", "Убит"]
    },
    "en": {
        misc: ["Round"],
        statusShort: ["?", "D", "S", "C", "I", "D"],
        statusFull: ["Unknown", "Defended", "Suspect", "Crewmate", "Imposter", "Dead"]
    }
};

const crewmateColor = ["#C51111", "#132ED1", "#117F2D", "#ED54BA", "#EF7D0E", "#F6F658", "#3F474E", "#D6E0F0", "#6B31BC", "#71491E", "#38FEDB", "#50EF39"];
const lang = window.navigator.language.slice(0, 2) === "ru" ? "ru" : "en";
/*
|--------------------------------------------------------------------------
| Round Control
|--------------------------------------------------------------------------
*/
let round = 1;

const btnRound = document.querySelector(".btn-round");
const btnText = document.querySelector(".btn-round-num");
const btnRoundText = document.querySelector(".btn-round-text");
btnRoundText.textContent = phrases[lang].misc[Misc.Round];

btnRound.addEventListener("click", function () {
    btnText.textContent = ++round;
    updateRoundCards();
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

    for (const [i, color] of crewmateColor.entries()) {
        const cardRounds = document.createElement("div");
        cardRounds.classList.add("card-rounds");
        createRoundCard(cardRounds, AliveStatus.Unknown);

        const cardStatus = document.createElement("div");
        cardStatus.classList.add("card-status");

        for (let j = 0; j < phrases[lang].statusFull.length; j++) {
            const btn = document.createElement("button");
            btn.classList.add("btn-status");
            btn.dataset.status = j;
            btn.append(document.createTextNode(phrases[lang].statusFull[j]));
            cardStatus.append(btn);
            btn.addEventListener("click", btnStatusCallback);
        }

        const card = document.createElement("div");
        card.classList.add("card");
        card.dataset.card = i;
        card.style.backgroundColor = color;

        const btn = document.createElement("button");
        btn.classList.add("btn-close");
        btn.addEventListener("click", closeCard);

        card.append(btn);
        card.append(cardRounds);
        card.append(cardStatus);

        cardContainter.append(card);
    }
}

function closeCard() {
    console.log("close card", this.parentElement);
    this.parentElement.classList.add("hidden");
}
/*
|--------------------------------------------------------------------------
| Round Card Logic
|--------------------------------------------------------------------------
*/
/** @this {HTMLButtonElement} */
function btnStatusCallback() {
    /** @type {HTMLDivElement} */
    const card = this.parentElement.parentElement;
    /** @type {HTMLDivElement} */
    const cardRounds = card.querySelector(".card-rounds");
    const statusCount = cardRounds.querySelectorAll("*").length;

    console.log(`Card: ${card.dataset.card}, status: ${this.dataset.status}, statusCount: ${statusCount}`);

    if (statusCount < round) {
        createRoundCard(cardRounds, this.dataset.status);
    }
    else {
        cardRounds.lastElementChild.innerHTML = phrases[lang].statusShort[this.dataset.status];
    }
}

function createRoundCard(rootElem, aliveStatus) {
    const elem = document.createElement("div");
    elem.classList.add("card-round");
    //  elem.append(document.createTextNode(round.toString()));
    elem.innerHTML = phrases[lang].statusShort[aliveStatus];
    rootElem.append(elem);
}

function updateRoundCards() {
    const cards = document.querySelectorAll(".card-rounds");
    console.log(cards);
    for (const card of cards) {
        if (card.querySelectorAll("*").length < round)
            createRoundCard(card, AliveStatus.Unknown);
    }
}
