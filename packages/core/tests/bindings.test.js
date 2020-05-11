import { compile } from '../src/compiler';

describe('Class bindings', function () {
  it('should add observable membrane for basic bindings', function () {
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

    expect(compile('something.js', source)).toBe(
      `
import ObservableMembrane from "observable-membrane";
import React from "react";
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
    this.template = React.createRef();
    this.__s.a = 1;
  }

  setA() {
    this.__s.a++;
  }

  render() {
    return _tmpl(Object.assign(this, this.__s, this.props));
  }

  componentDidMount() {
    this.mounted = true;
    this.stylesheets = [];

    _tmpl.stylesheets.forEach(stylesheet => {
      const sheet = document.createElement("style");
      sheet.type = "text/css";

      sheet.textContent = stylesheet(
        "[" + _tmpl.stylesheetTokens.hostAttribute + "]",
        "[" + _tmpl.stylesheetTokens.shadowAttribute + "]",
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

  it('should add observable membrane for assignments', function () {
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

    expect(compile('something.js', source)).toBe(
      `
import ObservableMembrane from "observable-membrane";
import React from "react";
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
    this.template = React.createRef();
    this.__s.a = 1;
  }

  setA() {
    this.__s.a = this.__s.a + 1;
  }

  render() {
    return _tmpl(Object.assign(this, this.__s, this.props));
  }

  componentDidMount() {
    this.mounted = true;
    this.stylesheets = [];

    _tmpl.stylesheets.forEach(stylesheet => {
      const sheet = document.createElement("style");
      sheet.type = "text/css";

      sheet.textContent = stylesheet(
        "[" + _tmpl.stylesheetTokens.hostAttribute + "]",
        "[" + _tmpl.stylesheetTokens.shadowAttribute + "]",
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

  it('should compile method called from constructor', function () {
    const code = `
import { registerDecorators as _registerDecorators } from "lwc";
import _tmpl from "./app.html";
import { registerComponent as _registerComponent } from "lwc";
import { LightningElement } from 'lwc';

class App extends LightningElement {
  constructor() {
    super();
    this.wow = "hi2";
    this.other = 'hi3';
    this.doSomething();
  }

  doSomething() {
    this.wow = 'hi';
  }

}

_registerDecorators(App, {
  fields: ["wow"]
})

export default _registerComponent(App, {
  tmpl: _tmpl
});
      `.trim();

    expect(compile('sample.js', code)).toBe(
      `
import ObservableMembrane from "observable-membrane";
import React from "react";
import _tmpl from "./app.html";

class App extends React.Component {
  constructor() {
    super();

    const membrane = new ObservableMembrane({
      valueMutated: () => {
        if (this.mounted)
          this.forceUpdate();
      }
    });

    this.__s = membrane.getProxy({});
    this.template = React.createRef();
    this.__s.wow = "hi2";
    this.__s.other = "hi3";
    this.doSomething();
  }

  doSomething() {
    this.__s.wow = "hi";
  }

  render() {
    return _tmpl(Object.assign(this, this.__s, this.props));
  }

  componentDidMount() {
    this.mounted = true;
    this.stylesheets = [];

    _tmpl.stylesheets.forEach(stylesheet => {
      const sheet = document.createElement("style");
      sheet.type = "text/css";

      sheet.textContent = stylesheet(
        "[" + _tmpl.stylesheetTokens.hostAttribute + "]",
        "[" + _tmpl.stylesheetTokens.shadowAttribute + "]",
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

export default App;
        `.trim()
    );
  });

  it('should compile @api props', function () {
    const code = `
import { registerDecorators as _registerDecorators } from "lwc";
import _tmpl from "./app.html";
import { registerComponent as _registerComponent } from "lwc";
import { LightningElement } from 'lwc';

class App extends LightningElement {
  constructor(...args) {
    super(...args);
    this.publicProp = void 0;
  }

}

_registerDecorators(App, {
  publicProps: {
    publicProp: {
      config: 0
    }
  }
})

export default _registerComponent(App, {
  tmpl: _tmpl
});
  `;
    expect(compile('sample.js', code)).toBe(
      `
import ObservableMembrane from "observable-membrane";
import React from "react";
import _tmpl from "./app.html";

class App extends React.Component {
  constructor(...args) {
    super(...args);

    const membrane = new ObservableMembrane({
      valueMutated: () => {
        if (this.mounted)
          this.forceUpdate();
      }
    });

    this.__s = membrane.getProxy({});
    this.template = React.createRef();
    this.__s.publicProp = void 0;
  }

  render() {
    return _tmpl(Object.assign(this, this.__s, this.props));
  }

  componentDidMount() {
    this.mounted = true;
    this.stylesheets = [];

    _tmpl.stylesheets.forEach(stylesheet => {
      const sheet = document.createElement("style");
      sheet.type = "text/css";

      sheet.textContent = stylesheet(
        "[" + _tmpl.stylesheetTokens.hostAttribute + "]",
        "[" + _tmpl.stylesheetTokens.shadowAttribute + "]",
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

export default App;
    `.trim()
    );
  });

  it('should compile @api props with default values', function () {
    const code = `
import { registerDecorators as _registerDecorators } from "lwc";
import _tmpl from "./app.html";
import { registerComponent as _registerComponent } from "lwc";
import { LightningElement } from 'lwc';

class App extends LightningElement {
  constructor(...args) {
    super(...args);
    this.publicProp = "some default";
  }

}

_registerDecorators(App, {
  publicProps: {
    publicProp: {
      config: 0
    }
  }
})

export default _registerComponent(App, {
  tmpl: _tmpl
});
  `;
    expect(compile('sample.js', code)).toBe(
      `
import ObservableMembrane from "observable-membrane";
import React from "react";
import _tmpl from "./app.html";

class App extends React.Component {
  constructor(...args) {
    super(...args);

    const membrane = new ObservableMembrane({
      valueMutated: () => {
        if (this.mounted)
          this.forceUpdate();
      }
    });

    this.__s = membrane.getProxy({});
    this.template = React.createRef();
    this.__s.publicProp = "some default";
  }

  render() {
    return _tmpl(Object.assign(this, this.__s, this.props));
  }

  componentDidMount() {
    this.mounted = true;
    this.stylesheets = [];

    _tmpl.stylesheets.forEach(stylesheet => {
      const sheet = document.createElement("style");
      sheet.type = "text/css";

      sheet.textContent = stylesheet(
        "[" + _tmpl.stylesheetTokens.hostAttribute + "]",
        "[" + _tmpl.stylesheetTokens.shadowAttribute + "]",
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

export default App;
    `.trim()
    );
  });

  it('should compile @api with a getter and styles', function () {
    const code = `
import { registerDecorators as _registerDecorators } from "lwc";
import _tmpl from "./app.html";
import { registerComponent as _registerComponent } from "lwc";
import { LightningElement } from 'lwc';

class ProductImage extends LightningElement {
  constructor(...args) {
    super(...args);
    this.imageUrl = void 0;
    this.productName = "name";
  }

  get className() {
    return this.productName;
  }

  get url() {
    if (this.imageUrl) {
      return this.imageUrl;
    }

    return 'https://picsum.photos/200/300';
  }

}

_registerDecorators(ProductImage, {
  publicProps: {
    imageUrl: {
      config: 0
    },
    productName: {
      config: 0
    }
  }
})

export default _registerComponent(ProductImage, {
  tmpl: _tmpl
});
  `;
    expect(compile('sample.js', code)).toBe(
      `
import ObservableMembrane from "observable-membrane";
import React from "react";
import _tmpl from "./app.html";

class ProductImage extends React.Component {
  constructor(...args) {
    super(...args);

    const membrane = new ObservableMembrane({
      valueMutated: () => {
        if (this.mounted)
          this.forceUpdate();
      }
    });

    this.__s = membrane.getProxy({});
    this.template = React.createRef();
    this.__s.imageUrl = void 0;
    this.__s.productName = "name";
  }

  get className() {
    return this.__s.productName;
  }

  get url() {
    if (this.__s.imageUrl) {
      return this.__s.imageUrl;
    }

    return "https://picsum.photos/200/300";
  }

  render() {
    return _tmpl(Object.assign(this, this.__s, this.props));
  }

  componentDidMount() {
    this.mounted = true;
    this.stylesheets = [];

    _tmpl.stylesheets.forEach(stylesheet => {
      const sheet = document.createElement("style");
      sheet.type = "text/css";

      sheet.textContent = stylesheet(
        "[" + _tmpl.stylesheetTokens.hostAttribute + "]",
        "[" + _tmpl.stylesheetTokens.shadowAttribute + "]",
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

export default ProductImage;
      `.trim()
    );
  });
});
