const title = document.querySelector('#title')
const pageButtons = document.querySelectorAll('nav li a')
const pageElements = document.querySelectorAll('.page')
const main = document.querySelector('main')
let currentPage = document.querySelector('.active')
let pages = [];

//=============== Functions ====================

function make(item) { return document.createElement(item.toString()); }

//=============== Scrolling ====================

class pageClass {
    constructor (button, page) {
        this.button = button
        this.page = page
        this.text = button.innerHTML
    }

    get top() {
        return this.page.getBoundingClientRect().y
    }

    makeActive() {
        title.innerHTML = this.text
        this.button.classList.add('active')
    }

    makeInactive() {
        this.button.classList.remove('active')
    }
}

for (let index = 0; index < pageButtons.length; index++) {
    pages.push(new pageClass(pageButtons[index], pageElements[index]))
}

main.addEventListener('scroll', (e) => {
    const height = e.target.clientHeight
    for(let page of pages) {
        if (0 < page.top  && page.top < height) {
            page.makeActive()
            break
        } else { page.makeInactive() }
    }
})

//=============== WebOpener ====================
const webLinks = document.querySelectorAll('.web')
const resizing = false

function isValidWidth() {
    return window.innerWidth > 850
}

class Popup {
    constructor (target) {
        this.isResizing = false

        this.container = make('dialog')
        this.title = target.closest('.line').querySelector('h4').innerHTML
        this.type = target.closest('a').getAttribute('value')
        this.href = target.closest('a').href
        this.close = make('span')
        this.dragBar;

        this.setup()
    }

    setup() {
        const frame = make('iframe')
        const newTitle = make('h4')

        this.close.innerHTML = 'X'
        this.container.classList.add(this.type)
        frame.src = this.href
        newTitle.innerHTML = this.title

        this.container.append(newTitle)
        this.container.append(frame)
        this.container.append(this.close)
        document.body.append(this.container)

        this.close.addEventListener('click', () => { 
            this.container.remove()
            delete this
        })

        if (this.type == 'dynamic') {this.makeDynamic()}

        this.container.showModal()

    }

    makeDynamic() {
        this.dragBar = make('div')
        this.dragBar.classList.add('draggable')
        this.container.append(this.dragBar)

        this.dragBar.addEventListener('mousedown', (e) => {
            e.preventDefault()
            this.startSize()
        })
        window.addEventListener('mouseup', () => {this.stopSize()})
        window.addEventListener('mousemove', (e) => {
            if (this.isResizing) {
                e.preventDefault()
                this.resize(e.clientX)
            }
        })
        
        this.dragBar.addEventListener('touchstart', (e) => {
            e.preventDefault()
            this.startSize()
        })        
        window.addEventListener('touchend', () => {this.stopSize()})
        window.addEventListener('touchmove', (e) => {
            if (this.isResizing) {
                e.preventDefault()
                this.resize(e.clientX)
            }
        })

    }

    startSize() {
        this.isResizing = true
    }

    stopSize() {
        this.isResizing = false
    }

    resize(val) {    this.container.style.width = `${window.innerWidth - 2*(window.innerWidth - val + 20)}px`    }
}

webLinks.forEach(button => {
    button.addEventListener('click', (e)=> {
        const button  = e.target.closest('a')
        if (!isValidWidth() && button.getAttribute('value') == 'desktop') {
            // do nothing because it should act normal
        } else {
        e.preventDefault()
        new Popup(e.target)
        }

    })
});