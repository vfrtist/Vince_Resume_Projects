// The event is a scroll listener
// As the Y value reaches some sort of point, update the matching nav styling.
// That's it.
// Since the scroll event with the menu will trigger the scroll event the class visuals accordingly

const title = document.querySelector('#title')
const pages = document.querySelectorAll('nav li a')
const main = document.querySelector('main')
let currentPage = document.querySelector('.active')

pages.forEach(nav => {
    nav.addEventListener('click', () => {
        if (currentPage) {
            currentPage.classList.remove('active')
        }
        nav.classList.add('active')
        title.innerHTML = nav.innerHTML
        currentPage = nav
    })
})