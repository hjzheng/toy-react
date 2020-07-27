class ElementWrapper {
  constructor(type) {
    this.root = document.createElement(type);
  }

  setAttribute(name, value) {
    this.root.setAttribute(name, value);
  }

  appendChild(vchild) {
    vchild.mountTo(this.root);
  }

  mountTo(parent) {
    parent.appendChild(this.root);
  }
}

class TextWrapper {
  constructor(type) {
    this.root = document.createTextNode(type);
  }

  mountTo(parent) {
    parent.appendChild(this.root);
  }
}

export class Component {
  constructor() {
    this.children = [];
  }

  setAttribute(name, value) {
    this[name] = value;
  }

  mountTo(parent) {
    let vdom = this.render();
    vdom.mountTo(parent);
  }

  appendChild(vchild) {
    this.children.push(vchild);
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
    vdom.mountTo(ele);
  },
};
