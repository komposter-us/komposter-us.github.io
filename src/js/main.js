/*
|--------------------------------------------------------------------------
| Round Counter
|--------------------------------------------------------------------------
*/
let round = 1;

const btnRound = document.querySelector(".btn-round");
const btnText = document.querySelector(".round-text");

btnRound.addEventListener("click", function () {
    btnText.textContent = ++round;
    updateRoundCards();
});
/*
|--------------------------------------------------------------------------
| Defines
|--------------------------------------------------------------------------
*/
const AliveStatus = {
    Unknown: 0,
    Defended: 1,
    Suspect: 2,
    Crewmate: 3,
    Imposter: 4
};

const statusName = ["?", "К", "Ч", "М", "И", "У"];
const statusText = ["Неизвестный", "Красный", "Черный", "Мирный", "Импостер", "Убит"];
const crewmateColor = ["#C51111", "#132ED1", "#117F2D", "#ED54BA", "#EF7D0E", "#F6F658", "#3F474E", "#D6E0F0", "#6B31BC", "#71491E", "#38FEDB", "#50EF39"];
/*
|--------------------------------------------------------------------------
| Create Cards
|--------------------------------------------------------------------------
*/
const cardContainter = document.querySelector(".card-containter");

for (const [i, color] of crewmateColor.entries()) {
    const cardRounds = document.createElement("div");
    cardRounds.classList.add("card-rounds");
    createRoundCard(cardRounds, AliveStatus.Unknown);

    const cardStatus = document.createElement("div");
    cardStatus.classList.add("card-status");

    for (let j = 1; j < statusText.length; j++) {
        const btn = document.createElement("button");
        btn.classList.add("btn-status");
        btn.dataset.status = j;
        btn.append(document.createTextNode(statusText[j]));
        cardStatus.append(btn);
        btn.addEventListener("click", btnStatusCallback);
    }

    const card = document.createElement("div");
    card.classList.add("card");
    card.dataset.card = i;
    card.style.backgroundColor = color;
    card.append(cardRounds);
    card.append(cardStatus);

    cardContainter.append(card);
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
    const cardRounds = card.firstElementChild;
    const statusCount = cardRounds.querySelectorAll("*").length;

    console.log(`Card: ${card.dataset.card}, status: ${this.dataset.status}, statusCount: ${statusCount}`);

    if (statusCount < round) {
        createRoundCard(cardRounds, this.dataset.status);
    }
    else {
        cardRounds.lastElementChild.innerHTML = statusName[this.dataset.status];
    }
}

function createRoundCard(rootElem, status) {
    console.log(statusName[status]);
    const elem = document.createElement("div");
    elem.classList.add("card-round");
    //  elem.append(document.createTextNode(round.toString()));
    elem.innerHTML = statusName[status];
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
