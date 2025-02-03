const deleteButton = document.querySelector('#trash')

// Drag and Drop Section ***************************************************************************************************
let dragItem, siblings, parents, newZone, sorting, controller, signal, target, dragGhost;

// Define all areas and what sorts of information they can take. 
//This is represented by "data-itemtype" in html for a lightweight way of making zones.
const dropZonePairs = {
    pieces: 'piece',
    materials: 'material',
    content: ['bundle', 'section'],
    details: ['detail'],
    detail: ['piece', 'material']
}

document.addEventListener('dragstart', (ev) => {
    // Set all variables
    sorting = false;
    newZone = ""
    controller = new AbortController();
    signal = controller.signal
    dragItem = ev.target;

    startHistory(dragItem, dragItem.nextElementSibling);

    if (dragItem.classList.contains('inTray')) {
        dragItem = ev.target.cloneNode('true');
        startHistory(dragItem, 'tray', 'create');
    };

    //image menu hiding 
    hover.hide();
    if (dragItem.querySelector('.float')) { dragItem.querySelector('.float').remove(); }

    dragGhost = dragItem.cloneNode('true');
    dragGhost.classList.add('ghost', 'inTray');
    document.body.append(dragGhost);
    ev.dataTransfer.setDragImage(dragGhost, 0, 0);
    dragItem.classList.add('dragging');

    // identify all like objects and install listening
    siblings = mainContent.querySelectorAll(`*[data-itemtype='${dragItem.dataset.itemtype}']:not(.dragging)`);
    siblings.forEach(sibling => {
        sibling.addEventListener('dragover', dragOverItem, { signal });
    })

    // identify all proper zones and install listening
    let zones = getObjectKey(dropZonePairs, dragItem.dataset.itemtype);
    let correctZone = zones.map((area) => `[data-itemtype='${area}']`).toString()

    try {
        parents = (zones.toString() === 'content') ? [mainContent] : mainContent.querySelectorAll(correctZone)
        parents.forEach(parent => {
            if (!parent.dataset.dropzone) {
                parent.addEventListener('dragenter', dragEnter, { signal });
                parent.addEventListener('dragover', dragOverZone, { signal });
                parent.addEventListener('dragleave', dragLeave, { signal });
                parent.classList.add('available');
            }
        })
    } catch (error) {
        console.log('no parents')
    }
})

document.addEventListener('drop', (e) => {
    if (e.target.name != 'uploadPiece') {
        controller.abort();
        stopHighlight();
    }
})

document.addEventListener('dragend', (e) => {
    if (e.target.name != 'uploadPiece') {
        controller.abort();
        dragItem.classList.remove('dragging');
        if (dragItem.parentElement !== pieceTray) {
            dragItem.classList.remove('inTray');
            makeEditable(dragItem);
            let materials = dragItem.querySelectorAll('.material')
            if (materials) { for (let material of materials) material.draggable = true }
            if (dragItem.dataset.itemtype === 'piece') { dragItem.querySelector('input').classList.add('hidden') };
        }
        stopHighlight();
        dragGhost.remove();
        stopHistory(dragItem, dragItem.nextElementSibling);
    }
})

function stopHighlight() { parents.forEach(parent => { parent.classList.remove('available', 'target'); }) }

function dragEnter(e) {
    target = e.target;
    this.classList.add('target');
    e.preventDefault();
    e.stopPropagation();
    return false;
}

function dragLeave(e) { if (target == e.target) { this.classList.remove('target'); } }

function dragOverZone(e) {
    e.preventDefault()
    if (newZone !== this) {
        newZone = this;
        sorting = false;
        if (newZone.dataset.itemtype === 'detail') {
            treasureDrop(this);
            return;
        }
    }
    if (!sorting && newZone.dataset.itemtype != 'detail') { this.insertBefore(dragItem, this.firstChild); }
}

function dragOverItem(e) {
    e.preventDefault()
    sorting = true;
    this.parentElement.insertBefore(dragItem, this);
}

function treasureDrop(detail) {
    detail = detail.querySelector('.treasure')
    detail.appendChild(dragItem)
}

// Trash Button
function wakeUp(item) { item.classList.toggle('awake') }

deleteButton.addEventListener('drop', () => {
    stopHistory(dragItem, 'delete', 'delete');
    dragItem.remove();
    deleteButton.classList.remove('awake');
})

deleteButton.addEventListener('dragenter', (ev) => {
    ev.preventDefault();
    wakeUp(deleteButton);
})
deleteButton.addEventListener('dragover', (ev) => { ev.preventDefault(); })

deleteButton.addEventListener('dragleave', () => { wakeUp(deleteButton); })

