const playerGrid = document.querySelector('#playerGrid')
const total = document.querySelector('#total')
const scoreForm = document.querySelector('#score')
const currentPlayer = document.querySelector('#currentPlayer')
const playerCount = document.querySelector('#playerCount')
const up = document.querySelector('#playerUp')
const down = document.querySelector('#playerDown')
const half = document.querySelector('#half')

function make(item) { return document.createElement(item.toString()) }

class Player {
    constructor(name) {
        this.name = name
        this.score = 0
        this.display = make('span')
        this.percent = make('span')
        this.setup()
    }

    setup() {
        const name = make('span')

        name.classList.add('player')
        this.display.classList.add('cabin')
        this.percent.classList.add('cabin')
        name.contentEditable = true;

        name.innerText = this.name
        this.display.innerText = this.score
        this.percent.innerText = '0%'

        playerGrid.insertBefore(name, total)
        playerGrid.insertBefore(this.display, total)
        playerGrid.insertBefore(this.percent, total)

        name.addEventListener('focusout', (e) => {
            this.name = e.target.innerText
            if (this == board.player) {
                currentPlayer.innerText = 'Add points to ' + board.player.name
            }
        })
    }

    update_score(value) {
        this.score += parseFloat(value)
        this.display.innerText = this.score
        this.percent.innerText = Math.round(100 * this.score / board.gameTotal) + "%"
    }
}

class ScoreBoard {
    constructor() {
        this.players = []
        this.currentPlayer = 0;
        this.gameTotal = 0;
        this.add_player()
    }

    add_player() {
        this.players.push(new Player('P' + (this.players.length + 1)))
        document.querySelector(':root').style.setProperty('--playerCount', this.players.length)
        this.move_indicator()
    }

    remove_player() {
        const player = this.players.pop()
        player.display.previousElementSibling.remove()
        player.display.remove()
        player.percent.remove()
        document.querySelector(':root').style.setProperty('--playerCount', this.players.length)
        this.move_indicator()
    }

    add_score(value) {
        this.round_total()
        this.player.update_score(value)
        this.currentPlayer = (this.currentPlayer + 1) % this.players.length
        currentPlayer.innerText = 'Add points to ' + this.player.name
        this.move_indicator()
    }

    get player() {
        return this.players[this.currentPlayer]
    }

    round_total() {
        if (this.currentPlayer == 0) {
            const score = total.nextElementSibling
            const max = scoreForm.lastElementChild.value
            this.gameTotal += parseFloat(max)
            score.innerText = this.gameTotal
        }
    }

    move_indicator() {
        this.players.forEach(player => {
            player.display.previousElementSibling.classList.remove('active')
        });
        this.player.display.previousElementSibling.classList.add('active');
    }
}

const board = new ScoreBoard()

board.move_indicator()

scoreForm.addEventListener('submit', (e) => {
    e.preventDefault()
    let score = e.submitter.value
    board.add_score(score)
})

playerCount.addEventListener('change', (e) => {
    const changeTo = e.target.value
    if (0 < changeTo && changeTo < 6) {
        while (board.players.length != e.target.value) {
            board.players.length > e.target.value ? board.remove_player() : board.add_player()
        }
    }
})

up.addEventListener('click', (e) => {
    playerCount.value = parseInt(playerCount.value) + 1
    board.add_player()
})

down.addEventListener('click', (e) => {
    playerCount.value = parseInt(playerCount.value) - 1
    board.remove_player()
})

half.addEventListener('click', (e) => {
    const halfButton = score.querySelector('.half')
    e.target.checked ? halfButton.classList.remove('hidden') : halfButton.classList.add('hidden')
})