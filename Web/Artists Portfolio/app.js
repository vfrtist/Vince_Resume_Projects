const headerButtons = document.querySelectorAll('.headerButton');
const bubble = document.querySelector('#pointer');
const header = document.querySelector('header');

function make(item) { return document.createElement(item.toString()); }

for (let btn of headerButtons) {
    btn.addEventListener('mouseenter', () => {
        const dif = (btn.offsetWidth - bubble.offsetWidth) / 2
        bubble.style.left = `${btn.offsetLeft + dif}px`;
        bubble.classList.add('move');
        btn.append(bubble);
    })

    btn.addEventListener('mouseleave', () => {
        bubble.classList.remove('move')
    })
}

