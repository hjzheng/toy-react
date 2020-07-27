import { ToyReact, Component } from './ToyReact.js';

class MyComponent extends Component {
  render() {
    return (
      <div>
        {this.children}
        {true}
      </div>
    );
  }
}

let a = (
  <div className='hello'>
    <span>Hello</span>
    <span>World</span>
    <span>!</span>
    <MyComponent>
      Hello
      <div>123</div>
    </MyComponent>
  </div>
);

ToyReact.render(a, document.body);
