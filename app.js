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

function isValidWidth() {
    return window.innerWidth > 850
}

webLinks.forEach(button => {
    button.addEventListener('click', (e)=> {
        const button  = e.target.closest('a')
        if (!isValidWidth() && button.getAttribute('value') == 'desktop') {
        } else {
        e.preventDefault()
        const title = e.target.closest('.line').querySelector('h4').innerHTML
        const modal = make('dialog')
        const frame = make('iframe')
        const newTitle = make('h4')

        modal.classList.add(button.getAttribute('value'))
        frame.src = button.href
        newTitle.innerHTML = title
        
        modal.append(newTitle)
        modal.append(frame)
        document.body.append(modal)
        modal.showModal()
        modal.addEventListener('click', () => { modal.remove()})
        }
    })
});