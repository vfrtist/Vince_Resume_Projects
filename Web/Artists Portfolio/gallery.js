const main = document.querySelector('#gallery');

function make(item) { return document.createElement(item.toString()); }


for (let card of main.querySelectorAll('.card')) {
    card.addEventListener('click', (e) => {
        const modal = make('dialog');
        const image = card.querySelector('img').cloneNode('true');
        modal.classList.add('modal');
        modal.append(image);
        document.body.append(modal);
        modal.showModal();
        modal.addEventListener('click', () => { modal.remove(); })
    })
}