import { convert } from "../src/index";

describe("Lifecycles", function () {
  it("connectedCallback", function () {
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

  connectedCallback() {
    this.a++;
    this.a++;
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
    this.__s.a = 1;
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

    this.__s.a++;
    this.__s.a++;
    this.__s.a++;
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

  it("disconnectedCallback", function () {
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

  disconnectedCallback() {
    this.a++;
    this.a++;
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
    this.__s.a = 1;
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

    this.__s.a++;
    this.__s.a++;
    this.__s.a++;
  }
}

export default Test;
  `.trim()
    );
  });

  it("renderedCallback", function () {
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

  renderedCallback() {
    this.a++;
    this.a++;
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
    this.__s.a = 1;
  }

  componentDidUpdate() {
    this.__s.a++;
    this.__s.a++;
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

  it("errorCallback", function () {
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

  errorCallback(error, stack) {
    this.a++;
    this.a++;
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
    this.__s.a = 1;
  }

  componentDidCatch(error, stack) {
    this.__s.a++;
    this.__s.a++;
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
});
