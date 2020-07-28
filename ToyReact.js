class ElementWrapper {
  constructor(type) {
    this.type = type;
    this.props = Object.create(null);
    this.children = [];
  }

  setAttribute(name, value) {
    // if (name.match(/^on([\s\S]+)$/)) {
    //   // console.log(RegExp.$1);
    //   let eventName = RegExp.$1.replace(/[\s\S]/, (s) => s.toLowerCase());
    //   this.root.addEventListener(eventName, value);
    // }
    // if (name === 'className') name = 'class';
    // this.root.setAttribute(name, value);

    this.props[name] = value;
  }

  appendChild(vchild) {
    // let range = document.createRange();
    // if (this.root.children.length) {
    //   range.setStartAfter(this.root.lastChild);
    //   range.setEndAfter(this.root.lastChild);
    // } else {
    //   range.setStart(this.root, 0);
    //   range.setEnd(this.root, 0);
    // }
    // vchild.mountTo(range);
    this.children.push(vchild);
  }

  mountTo(range) {
    range.deleteContents();
    let element = document.createElement(this.type);

    for (let name in this.props) {
      let value = this.props[name];

      if (name.match(/^on([\s\S]+)$/)) {
        let eventName = RegExp.$1.replace(/[\s\S]/, (s) => s.toLowerCase());
        element.addEventListener(eventName, value);
      }

      if (name === 'className') name = 'class';

      element.setAttribute(name, value);
    }

    for (let child of this.children) {
      let range = document.createRange();
      if (element.children.length) {
        range.setStartAfter(element.lastChild);
        range.setEndAfter(element.lastChild);
      } else {
        range.setStart(element, 0);
        range.setEnd(element, 0);
      }
      child.mountTo(range);
    }

    range.insertNode(element);
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
        if (typeof newState[p] === 'object' && newState[p] !== null) {
          if (typeof oldState[p] !== 'object') {
            if (newState[p] instanceof Array) {
              oldState[p] = [];
            } else {
              oldState[p] = {};
            }
          }
          merge(oldState[p], newState[p]);
        } else {
          oldState[p] = newState[p];
        }
      }
    };

    if (!this.state && state) {
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
          if (child === null || child === void 0) {
            child = '';
          }
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
