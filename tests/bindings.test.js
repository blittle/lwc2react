import { convert } from "../src/index";

describe("Class bindings", function () {
  it("should add observable membrane for basic bindings", function () {
    const source = `
import { registerDecorators as _registerDecorators } from "lwc";
import _tmpl from "./test.html";
import { registerComponent as _registerComponent } from "lwc";
import { LightningElement } from 'lwc';

class Test extends LightningElement {
  constructor(...args) {
    super(...args);
    this.a = 1;
  }

  setA() {
    this.a++;
  }

}

_registerDecorators(Test, {
  fields: ["a"]
})

export default _registerComponent(Test, {
  tmpl: _tmpl
});
    `;

    expect(convert("something.js", source)).toBe(
      `
import * as React from "react";
import _tmpl from "./test.html";

class Test extends React.Component {
  constructor(...args) {
    super(...args);

    const membrane = new ObservableMembrane({
      valueMutated: () => {
        if (this.mounted)
          this.forceUpdate();
      }
    });

    this.__s = membrane.getProxy({});
    this.__s.a = 1;
  }

  setA() {
    this.__s.a++;
  }

  render() {
    return _tmpl(this);
  }

  componentDidMount() {
    this.mounted = true;
    this.stylesheets = [];

    _tmpl.stylesheets.forEach(stylesheet => {
      const sheet = document.createElement("style");
      sheet.type = "text/css";

      sheet.textContent = stylesheet(
        "[scoped" + _tmpl.stylesheetTokens.hostAttribute + "]",
        "[scoped" + _tmpl.stylesheetTokens.shadowAttribute + "]",
        null
      );

      document.head.appendChild(sheet);
      this.stylesheets.push(sheet);
    });
  }

  componentWillUnmount() {
    this.mounted = false;

    this.stylesheets.forEach(sheet => {
      if (sheet.parentNode)
        sheet.parentNode.removeChild(sheet);
    });
  }
}

export default Test;
  `.trim()
    );
  });

  it("should add observable membrane for assignments", function () {
    const source = `
import { registerDecorators as _registerDecorators } from "lwc";
import _tmpl from "./test.html";
import { registerComponent as _registerComponent } from "lwc";
import { LightningElement } from 'lwc';

class Test extends LightningElement {
  constructor(...args) {
    super(...args);
    this.a = 1;
  }

  setA() {
    this.a = this.a + 1;
  }

}

_registerDecorators(Test, {
  fields: ["a"]
})

export default _registerComponent(Test, {
  tmpl: _tmpl
});
    `;

    expect(convert("something.js", source)).toBe(
      `
import * as React from "react";
import _tmpl from "./test.html";

class Test extends React.Component {
  constructor(...args) {
    super(...args);

    const membrane = new ObservableMembrane({
      valueMutated: () => {
        if (this.mounted)
          this.forceUpdate();
      }
    });

    this.__s = membrane.getProxy({});
    this.__s.a = 1;
  }

  setA() {
    this.__s.a = this.__s.a + 1;
  }

  render() {
    return _tmpl(this);
  }

  componentDidMount() {
    this.mounted = true;
    this.stylesheets = [];

    _tmpl.stylesheets.forEach(stylesheet => {
      const sheet = document.createElement("style");
      sheet.type = "text/css";

      sheet.textContent = stylesheet(
        "[scoped" + _tmpl.stylesheetTokens.hostAttribute + "]",
        "[scoped" + _tmpl.stylesheetTokens.shadowAttribute + "]",
        null
      );

      document.head.appendChild(sheet);
      this.stylesheets.push(sheet);
    });
  }

  componentWillUnmount() {
    this.mounted = false;

    this.stylesheets.forEach(sheet => {
      if (sheet.parentNode)
        sheet.parentNode.removeChild(sheet);
    });
  }
}

export default Test;
  `.trim()
    );
  });
});

xdescribe("Bindings conversion", function () {
  it("should convert method called from constructor", function () {
    const code = `
function tmpl($api, $cmp, $slotset, $ctx) {
const {
  d: api_dynamic,
  h: api_element
} = $api;
return [api_element("div", {
  key: 0
}, [api_dynamic($cmp.wow)])];
}

var _tmpl = registerTemplate(tmpl);
tmpl.stylesheets = [];
tmpl.stylesheetTokens = {
hostAttribute: "my-app_app-host",
shadowAttribute: "my-app_app"
};

class App extends BaseLightningElement {
constructor() {
  super();
  this.wow = "hi2";
  this.other = "hi3";
  this.doSomething();
}

doSomething() {
  this.wow = 'hi';
}

}

registerDecorators(App, {
fields: ["wow"]
});

var MyApp = registerComponent(App, {
tmpl: _tmpl
});
      `.trim();

    expect(convert(code)).toBe(
      `
class App extends React.Component {
  constructor(props) {
      super(props);
      this.state = {};
      this.state.wow = "hi2";
      this.state.other = "hi3";
      this.doSomething();
  }

  render() {
      return React.createElement("div", null, this.state.wow);
  }

  doSomething() {
      this.setState({
          wow: "hi"
      });
  }
}
        `.trim()
    );
  });

  it("should convert @api props", function () {
    const code = `
function tmpl($api, $cmp, $slotset, $ctx) {
const {
  h: api_element
} = $api;
return [api_element("img", {
  attrs: {
    "src": $cmp.url
  },
  key: 0
}, [])];
}

var _tmpl = registerTemplate(tmpl);
tmpl.stylesheets = [];
tmpl.stylesheetTokens = {
hostAttribute: "my-app_app-host",
shadowAttribute: "my-app_app"
};

class App extends BaseLightningElement {
constructor(...args) {
  super(...args);
  this.url = void 0;
}

}

registerDecorators(App, {
publicProps: {
  url: {
    config: 0
  }
}
});

var MyApp = registerComponent(App, {
tmpl: _tmpl
});
  `;
    expect(convert(code)).toBe(
      `
class App extends React.Component {
  constructor(props) {
      super(props);
      this.state = {};
  }

  render() {
      return React.createElement("img", {
          "src": this.props.url
      }, null);
  }
}
    `.trim()
    );
  });

  it("should convert @api with a getter and styles", function () {
    const code = `
function stylesheet(hostSelector, shadowSelector, nativeShadow) {
return [".product-image", shadowSelector, " {max-height: 6.5rem;}"].join('');
}
var _implicitStylesheets = [stylesheet];

function tmpl($api, $cmp, $slotset, $ctx) {
const {
  h: api_element
} = $api;
return [api_element("div", {
  classMap: {
    "item-image": true
  },
  key: 1
}, [api_element("img", {
  classMap: {
    "product-image": true
  },
  attrs: {
    "src": $cmp.imageURL,
    "alt": $cmp.productName,
    "title": $cmp.productName
  },
  key: 0
}, [])])];
}

var _tmpl = registerTemplate(tmpl);
tmpl.stylesheets = [];

if (_implicitStylesheets) {
tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets);
}
tmpl.stylesheetTokens = {
hostAttribute: "my-app_app-host",
shadowAttribute: "my-app_app"
};

class ProductImage extends BaseLightningElement {
constructor(...args) {
  super(...args);
  this.imageUrl = void 0;
  this.productName = void 0;
}

/**
 * Gets the product image
 */
get imageURL() {
  if (this.imageUrl) {
    return this.imageUrl;
  }

  return '/assets/images/noimagesmall.png';
}

}

registerDecorators(ProductImage, {
publicProps: {
  imageUrl: {
    config: 0
  },
  productName: {
    config: 0
  }
}
});

var MyApp = registerComponent(ProductImage, {
tmpl: _tmpl
});
  `;
    expect(convert(code)).toBe(
      `
function stylesheet(hostSelector, shadowSelector, nativeShadow) {
  return [".product-image", shadowSelector, " {max-height: 6.5rem;}"].join("");
}

class ProductImage extends React.Component {
  constructor(props) {
      super(props);
      window.___cssUniqueCounter = window.___cssUniqueCounter || 0;
      window.___cssUniqueCounter++;
      this.___scopedSelector = window.___cssUniqueCounter;
      this.state = {};
  }

  render() {
      return React.createElement("div", {
          ["scoped"+this.___scopedSelector]: "true",
          className: "item-image"
      }, React.createElement("img", {
          ["scoped"+this.___scopedSelector]: "true",
          "src": this.imageURL,
          "alt": this.props.productName,
          "title": this.props.productName,
          className: "product-image"
      }, null));
  }

  get imageURL() {
      if (this.props.imageUrl) {
          return this.props.imageUrl;
      }

      return "/assets/images/noimagesmall.png";
  }

  componentDidMount() {
      const css = document.createElement("style");
      css.type = "text/css";
      css.textContent = stylesheet(null, "[scoped" + this.___scopedSelector + "]", null);
      document.head.appendChild(css);
      this.___css = css;
  }

  componentWillUnmount() {
      this.___css.parentNode.removeChild(this.___css);
  }
}
      `.trim()
    );
  });
});
