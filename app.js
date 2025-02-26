const title = document.querySelector("#title");
const pageButtons = document.querySelectorAll("nav li a");
const pageElements = document.querySelectorAll(".page");
const main = document.querySelector("main");
const body = document.querySelector("body");
let currentPage = document.querySelector(".active");
let pages = new Map();

//=============== Functions ====================

function make(item) {
  return document.createElement(item.toString());
}

//=============== Scrolling ====================

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        pages.get(entry.target).makeActive();
      } else {
        pages.get(entry.target).makeInactive();
      }
    });
  },
  { threshold: 0.15 }
);

class pageClass {
  constructor(button, page) {
    this.button = button;
    this.page = page;
    this.text = button.innerHTML;
  }

  get top() {
    return this.page.getBoundingClientRect().y;
  }

  makeActive() {
    title.innerHTML = this.text;
    this.button.classList.add("active");
  }

  makeInactive() {
    this.button.classList.remove("active");
  }
}

for (let index = 0; index < pageButtons.length; index++) {
  const page = new pageClass(pageButtons[index], pageElements[index]);
  pages.set(page.page, page);
  observer.observe(page.page);
}

main.addEventListener("scroll", (e) => {
  const topHeight = document.documentElement;
  if (e.target.scrollTop < 380) {
    topHeight.style.setProperty("--top", `${10 - e.target.scrollTop / 38}dvh`);
  } else {
    topHeight.style.setProperty("--top", "0dvh");
  }
});

//=============== WebOpener ====================
const webLinks = document.querySelectorAll(".web");
const resizing = false;

function isValidWidth() {
  return window.innerWidth > 850;
}

class Popup {
  constructor(target) {
    this.isResizing = false;

    this.container = make("dialog");
    this.title = target.closest(".line").querySelector("h4").innerHTML;
    this.type = target.closest("a").getAttribute("value");
    this.href = target.closest("a").href;
    this.close = make("span");
    this.dragBar;
    this.width;

    this.setup();
  }

  setup() {
    const frame = make("iframe");
    const newTitle = make("h4");

    this.close.innerHTML = "X";
    this.container.classList.add(this.type);
    frame.src = this.href;
    newTitle.innerHTML = this.title;

    this.container.append(newTitle, frame, this.close);
    document.body.append(this.container);

    this.close.addEventListener("click", () => {
      this.container.remove();
      delete this;
    });

    if (this.type == "dynamic") {
      this.makeDynamic();
    }

    this.container.showModal();
  }

  makeDynamic() {
    this.dragBar = make("div");
    this.dragBar.classList.add("draggable", "container", "horizontal");
    const l = make("div");
    const c = make("div");
    const r = make("div");
    l.classList.add("l");
    c.classList.add("c");
    r.classList.add("r");

    this.dragBar.append(l, c, r);

    this.container.append(this.dragBar);

    this.dragBar.addEventListener("mousedown", (e) => {
      e.preventDefault();
      this.startSize();
    });
    window.addEventListener("mouseup", () => {
      this.stopSize();
    });
    window.addEventListener("mousemove", (e) => {
      if (this.isResizing) {
        e.preventDefault();
        this.resize(e);
      }
    });
  }

  startSize() {
    this.isResizing = true;
    this.width = this.container.offsetWidth;
  }

  stopSize() {
    this.isResizing = false;
  }

  resize(target) {
    this.width += target.movementX * 2;
    this.container.style.width = `${this.width}px`;
  }
}

webLinks.forEach((button) => {
  button.addEventListener("click", (e) => {
    const button = e.target.closest("a");
    if (!isValidWidth() && button.getAttribute("value") == "desktop") {
      // do nothing because it should act normal
    } else {
      e.preventDefault();
      new Popup(e.target);
    }
  });
});
