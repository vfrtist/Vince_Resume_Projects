// The event is a scroll listener
// As the Y value reaches some sort of point, update the matching nav styling.
// That's it.
// Since the scroll event with the menu will trigger the scroll event the class visuals accordingly

const title = document.querySelector('#title')
const pageButtons = document.querySelectorAll('nav li a')
const pageElements = document.querySelectorAll('.page')
const main = document.querySelector('main')
let currentPage = document.querySelector('.active')

let pages = [];

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
    console.log(height)
    console.log('scroll\n')
    for(let page of pages) {
        if (0 < page.top  && page.top < height) {
            page.makeActive()
            break
        } else { page.makeInactive() }
    }
})