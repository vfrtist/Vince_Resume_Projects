//=============== Variables ====================

const lower = document.querySelector('.lower');
const openMenuButton = document.querySelector('#up');
const upper = document.querySelector('.upper');
const toggleUnits = document.querySelector('#units');
const toggleTheme = document.querySelector('#theme');
const themes = ['orange', 'blue', 'pink', 'purple', 'earth']
const frame = document.querySelector('#frame');
const rest = document.querySelector('#rest');
const reRest = document.querySelector('#reRest');
const calculate = document.querySelector('#calculate');
const pages = document.querySelectorAll('.page');
const timeForm = document.querySelector('#timeForm');
const weightForm = document.querySelector('#weightForm');
const findWeightInput = document.querySelector('#findWeight');
const assignments = ['a', 'b', 'c', 'd', 'e', 'f'];
const cancelTimer = document.querySelector('.cancel');
let screenLock = null;
let currentTheme = localStorage.getItem('theme') ? localStorage.getItem('theme') : null;
let currentBase = localStorage.getItem('base') ? localStorage.getItem('base') : 'light';
let currentUnits = localStorage.getItem('units') ? localStorage.getItem('units') : 'lbs';
let currentPage = 2;
let edges = [];
let controller, signal;
const system = {
    lbs: {
        weights: [2.5, 5, 10, 25, 35, 45],
        barWeight: 45,
        conversion: .453592,
        switchTo: 'kg'
    },
    kg: {
        weights: [1, 2, 5, 10, 15, 20],
        barWeight: 20,
        conversion: 2.204624,
        switchTo: 'lbs'
    },
};

//=============== Functions ====================

function make(item) { return document.createElement(item.toString()); }
function makeArray(list) { return Object.values(list.children).slice(1) }
function setAttribute(attribute, value) {
    document.documentElement.setAttribute(`data-${attribute}`, value);
    localStorage.setItem(attribute, value);
}
function nextTheme() {
    currentTheme = themes[themes.indexOf(currentTheme) + 1];
    if (!currentTheme) { currentTheme = themes[0] }
    setAttribute('theme', currentTheme);
}

//=============== Screen Awake for Timing ====================

function isScreenLockSupported() { return ('wakeLock' in navigator); }

async function keepScreenAwake() {
    if (isScreenLockSupported()) {
        try {
            screenLock = await navigator.wakeLock.request('screen');
        } catch (err) {
            console.log(err.name, err.message);
        }
        return screenLock;
    }
}

function releaseScreen() {
    if (screenLock) { screenLock.release().then(() => { screenLock = null; }); }
}

document.addEventListener("visibilitychange", async () => {
    if (screenLock !== null && document.visibilityState === "visible") {
        screenLock = await navigator.wakeLock.request("screen");
    }
});

//=============== Bar Class ====================

class barClass {
    constructor() {
        this.total = document.querySelector('.main');
        this.subtotal = document.querySelector('.subheading');
        this.converted = document.querySelector('.superheading');
        this.unit = currentUnits;
        this.ends = document.querySelectorAll('.end');
    }

    addWeight(weight) {
        for (let end of this.ends) {
            let addedWeight = make('div');
            addedWeight.classList.add(assignments[+this.weights.indexOf(+weight)], 'plate');
            addedWeight.dataset.weight = weight;
            end.append(addedWeight);
            addedWeight.addEventListener('click', () => { this.removeWeight(addedWeight); })
        }
        this.updateWeight();
    }

    get plateList() { return makeArray(this.ends[0]); }

    removeWeight(weight) {
        let end = weight.parentElement;
        let leftPlates = makeArray(this.ends[0]);
        let rightPlates = makeArray(this.ends[1]);
        let pos = makeArray(end).indexOf(weight);
        for (pos; pos < leftPlates.length; pos++) {
            let left = leftPlates[pos];
            let right = rightPlates[pos];
            left.remove();
            right.remove();
        }
        this.updateWeight();
    }

    updateWeight() {
        this.total.innerText = `${this.currentWeight} ${this.unit}`
        this.subtotal.innerText = this.subWeight;
        this.converted.innerText = `${(this.currentWeight * this.currentSystem.conversion).toFixed(1)} ${this.currentSystem.switchTo}`
    }

    get subWeight() {
        let subtotal = []
        for (let plate of this.plateList) { subtotal.push(plate.dataset.weight) }
        return subtotal.join(' / ');
    }

    get currentWeight() {
        let total = this.plateList.reduce((total, currentValue) => +total + (2 * +currentValue.dataset.weight), this.barWeight,);
        return total;
    }

    get barWeight() { return system[this.unit].barWeight; }
    get weights() { return system[this.unit].weights; }
    get currentSystem() { return system[this.unit]; }

    switchUnits() {
        let plates = document.querySelectorAll('.plate');
        const { weights, barWeight, conversion, switchTo } = this.currentSystem
        for (let plate of plates) {
            let amount = system[switchTo].weights[weights.indexOf(+plate.dataset.weight)];
            let caption = plate.nextElementSibling;
            if (caption && caption.classList.contains('caption')) { caption.innerText = amount; };
            plate.dataset.weight = amount;
        }
        this.unit = switchTo;
        localStorage.setItem('units', switchTo);
        this.updateWeight();
        updatePlaceholderText();
    }

    clearBar() {
        for (let end of this.ends) {
            for (let item of end.querySelectorAll(':not(.cap)')) { item.remove() }
        }
    }
}

//=============== Initial Page Building Section ====================

let bar = new barClass;
let weights = system[bar.unit].weights;
for (const [index, weight] of weights.entries()) {
    let button = make('div');
    let plate = make('div');
    let caption = make('div');

    button.classList.add('weight');
    plate.classList.add(assignments[index], 'plate');
    plate.dataset.weight = weight;
    caption.classList.add('caption');
    caption.innerText = weight;

    button.append(plate, caption);
    lower.append(button);
    button.addEventListener('click', () => { bar.addWeight(button.querySelector('.plate').dataset.weight); })
}

for (let page of pages) { edges.push(page.offsetLeft); }

if (currentTheme) { setAttribute('theme', currentTheme); }
if (currentBase) { setAttribute('base', currentBase); }

scrollPage(currentPage);

openMenuButton.addEventListener('click', () => {
    scrollPage(2);
    upper.classList.toggle('open');
})

toggleUnits.addEventListener('click', () => { bar.switchUnits() })
toggleTheme.addEventListener('click', nextTheme)

//=============== Weight Function ====================

function compareWeight(solvingWeight) {
    const weights = bar.currentSystem.weights;
    if (solvingWeight >= weights.slice(- 1)) {
        return weights.slice(-1);
    } else {
        for (let step = 0; step < weights.length; step++) {
            if (solvingWeight < weights[step]) { return weights[step - 1]; }
        }
    }
}

function findWeight(totalWeight) {
    bar.clearBar();
    scrollPage(2);
    findWeightInput.blur();
    solvingWeight = (totalWeight - bar.barWeight) / 2
    while (solvingWeight > 0) {
        let plate = compareWeight(solvingWeight);
        solvingWeight = solvingWeight - plate;
        bar.addWeight(plate);
    };
}

function updatePlaceholderText() { findWeightInput.placeholder = `> ${bar.barWeight + bar.currentSystem.weights[0] * 2} ${bar.unit}`; }

weightForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let total = e.target['findWeight'];
    let minimum = bar.currentSystem.weights[0] * 2;
    if (total.value % minimum > 0) { window.alert(`Number must be divisible by ${minimum}`) }
    else {
        total.value >= bar.barWeight + minimum ? findWeight(total.value) : window.alert(`Please input more than ${bar.barWeight + minimum} ${bar.unit}`);
        total.value = '';
    }
})

// =============== Page Moving ====================

function scrollPage(page, focus = '') {
    if (page != 2) { upper.classList.remove('open'); }
    if (currentPage === page) { page = 2 }
    frame.scrollTo(edges[page - 1], 0);
    currentPage = page;
    if (focus && page !== 2) { focus.focus(); }
}

rest.addEventListener('click', () => { scrollPage(1); })
calculate.addEventListener('click', () => {
    updatePlaceholderText();
    scrollPage(3, findWeightInput);
})

//=============== Timer Function ====================

timeForm.addEventListener('submit', (e) => {
    e.preventDefault()
    reRest.value = e.submitter.value;
    reRest.querySelector('span').innerHTML = e.submitter.innerHTML
    countdown(e.submitter.value);
}, { signal })

reRest.addEventListener('click', () => { countdown(reRest.value); }, { signal })

cancelTimer.addEventListener('click', () => {
    cancelTimer.classList.add('hidden');
    endTimer();
})

const delay = (operation, delay) => new Promise(resolve => setTimeout(resolve, delay));

async function countdown(time) {
    controller = new AbortController();
    signal = controller.signal;
    bar.total.classList.add('clock');
    bar.total.closest('.heading').classList.add('clock');
    keepScreenAwake();
    scrollPage(2);
    do {
        await delay(postTime(time), 1000);
        time--
        if (signal.aborted) { return }
    } while (time > 0)
    endTimer();
};

async function endTimer() {
    controller.abort();
    bar.total.classList.remove('clock');
    await delay((bar.total.innerText = 'Get it!'), 2000);
    bar.total.closest('.heading').classList.remove('clock');
    await delay(bar.updateWeight(), 1000);
    releaseScreen();
    cancelTimer.classList.remove('hidden');
    reRest.classList.remove('hidden');
}

function postTime(time) {
    let minutes = Math.floor(time / 60);
    let seconds = time % 60;
    if (seconds < 10) { seconds = '0' + seconds };
    bar.total.innerText = `${minutes}:${seconds}`;
}