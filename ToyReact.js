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
    this.range = range;
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

  get vdom() {
    return this;
  }
}

class TextWrapper {
  constructor(type) {
    this.root = document.createTextNode(type);
    this.type = '#text';
    this.props = Object.create(null);
    this.children = [];
  }

  mountTo(range) {
    this.range = range;
    range.deleteContents();
    range.insertNode(this.root);
  }
}

export class Component {
  constructor() {
    this.children = [];
    this.props = Object.create(null);
  }

  get type() {
    return this.constructor.name;
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
    // let placholder = document.createComment('placholder');
    // let range = document.createRange();
    // range.setStart(this.range.endContainer, this.range.endOffset);
    // range.setEnd(this.range.endContainer, this.range.endOffset);

    // range.insertNode(placholder);

    // this.range.deleteContents();
    let vdom = this.render();

    // 比较 type props 和 children
    if (this.oldVdom) {
      let isSameNode = (node1, node2) => {
        if (node1.type !== node2.type) {
          return false;
        }

        for (let name in node1.props) {
          if (
            typeof node1.props[name] === 'object' &&
            typeof node2.props[name] === 'object' &&
            JSON.stringify(
              node1.props[name] === JSON.stringify(node2.props[name])
            )
          ) {
            continue;
          }
          if (node1.props[name] !== node2.props[name]) {
            return false;
          }
        }

        // 属性个数不一样
        if (
          Object.keys(node1.props).length !== Object.keys(node2.props).length
        ) {
          return false;
        }

        return true;
      };

      let isSameTree = (node1, node2) => {
        if (!isSameNode(node1, node2)) {
          return false;
        }

        if (node1.children.length !== node2.children.length) {
          return false;
        }

        for (let i = 0; i < node1.children.length; i++) {
          // 不对，需要key去比较，万一children 的顺序不一致
          if (!isSameTree(node1.children[i], node2.children[i])) {
            return false;
          }

          return true;
        }
      };

      let replace = (newTree, oldTree) => {
        if (isSameTree(newTree, oldTree)) {
          return;
        }

        // 根节点不相同
        if (!isSameNode(newTree, oldTree)) {
          newTree.mountTo(oldTree.range);
        } else {
          // 比较 children
          for (let i = 0; i < newTree.children.length; i++) {
            replace(newTree.children[i], oldTree.children[i]);
          }
        }
      };

      console.log('old', this.oldVdom);
      console.log('new', vdom);

      replace(vdom, this.oldVdom);
    } else {
      vdom.mountTo(this.range);
    }

    this.oldVdom = vdom;
    // vdom.mountTo(this.range);

    // placholder.parentNode.removeChild(placholder)
  }

  get vdom() {
    return this.render().vdom;
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
