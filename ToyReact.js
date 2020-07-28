class ElementWrapper {
  constructor(type) {
    this.root = document.createElement(type);
  }

  setAttribute(name, value) {
    if (name.match(/^on([\s\S]+)$/)) {
      // console.log(RegExp.$1);
      let eventName = RegExp.$1.replace(/[\s\S]/, (s) => s.toLowerCase());
      this.root.addEventListener(eventName, value);
    }

    if (name === 'className') name = 'class';

    this.root.setAttribute(name, value);
  }

  appendChild(vchild) {
    let range = document.createRange();
    if (this.root.children.length) {
      range.setStartAfter(this.root.lastChild);
      range.setEndAfter(this.root.lastChild);
    } else {
      range.setStart(this.root, 0);
      range.setEnd(this.root, 0);
    }

    vchild.mountTo(range);
  }

  mountTo(range) {
    range.deleteContents();
    range.insertNode(this.root);
  }
}

class TextWrapper {
  constructor(type) {
    this.root = document.createTextNode(type);
  }

  mountTo(range) {
    range.deleteContents();
    range.insertNode(this.root);
  }
}

export class Component {
  constructor() {
    this.children = [];
    this.props = Object.create(null);
  }

  setAttribute(name, value) {
    this.props[name] = value;
    this[name] = value;
  }

  mountTo(range) {
    this.range = range;
    this.update();
  }

  update() {
    // 站位符 （确保删除后 range 没有变化）
    let placholder = document.createComment('placholder');
    let range = document.createRange();
    range.setStart(this.range.endContainer, this.range.endOffset);
    range.setEnd(this.range.endContainer, this.range.endOffset);

    range.insertNode(placholder);

    this.range.deleteContents();
    let vdom = this.render();
    vdom.mountTo(this.range);

    // placholder.parentNode.removeChild(placholder)
  }

  appendChild(vchild) {
    this.children.push(vchild);
  }

  setState(state) {
    let merge = (oldState, newState) => {
      for (let p in newState) {
        if (typeof newState[p] === 'object') {
          if (typeof oldState[p] !== 'object') {
            oldState[p] = {};
          }
          merge(oldState[p], newState[p]);
        } else {
          oldState[p] = newState[p];
        }
      }
    };

    if (this.state && state) {
      this.state = {};
    }

    merge(this.state, state);

    this.update();
  }
}

export let ToyReact = {
  createElement(type, attrs, ...children) {
    let ele;
    if (typeof type === 'string') {
      ele = new ElementWrapper(type);
    } else {
      ele = new type();
    }

    for (let name in attrs) {
      ele.setAttribute(name, attrs[name]);
    }

    let appendChildren = (children) => {
      for (let child of children) {
        if (typeof child === 'object' && child instanceof Array) {
          appendChildren(child);
        } else {
          if (
            !(child instanceof Component) &&
            !(child instanceof ElementWrapper) &&
            !(child instanceof TextWrapper)
          ) {
            child = String(child);
          }
          if (typeof child === 'string') {
            child = new TextWrapper(child);
          }

          ele.appendChild(child);
        }
      }
    };

    appendChildren(children);

    return ele;
  },

  render(vdom, ele) {
    let range = document.createRange();
    if (ele.children.length) {
      range.setStartAfter(ele.lastChild);
      range.setEndAfter(ele.lastChild);
    } else {
      range.setStart(ele, 0);
      range.setEnd(ele, 0);
    }

    vdom.mountTo(range);
  },
};
