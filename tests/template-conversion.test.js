import { convert } from "../src/index";

describe("templates", function() {
  it("should convert an empty component", function () {
    const source = `
import _implicitStylesheets from "./test.css";

import { registerTemplate } from "lwc";

function tmpl($api, $cmp, $slotset, $ctx) {
  const {} = $api;
  return [];
}

export default registerTemplate(tmpl);
tmpl.stylesheets = [];

if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets)
}
tmpl.stylesheetTokens = {
  hostAttribute: "my-test_test-host",
  shadowAttribute: "my-test_test"
};
        `.trim();

    expect(convert('something.html', source)).toBe(
      `
import _implicitStylesheets from "./test.css";
import * as React from "react";

function tmpl($cmp) {
  return null;
}

export default tmpl;
tmpl.stylesheets = [];

if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets);
}

tmpl.stylesheetTokens = {
  hostAttribute: "my-test_test-host",
  shadowAttribute: "my-test_test"
};
        `.trim()
    );
  });

  it("should convert div with text", function () {
    const source = `
import _implicitStylesheets from "./test.css";
import { registerTemplate } from "lwc";

function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    t: api_text,
    h: api_element
  } = $api;
  return [api_element("div", {
    key: 0
  }, [api_text("hi")])];
}

export default registerTemplate(tmpl);
tmpl.stylesheets = [];

if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets);
}

tmpl.stylesheetTokens = {
  hostAttribute: "my-test_test-host",
  shadowAttribute: "my-test_test"
};
        `.trim();

    expect(convert('something.html', source)).toBe(
      `
import _implicitStylesheets from "./test.css";
import * as React from "react";

function tmpl($cmp) {
  return React.createElement("div", {
    [tmpl.stylesheetTokens.shadowAttribute]: "true"
  }, "hi");
}

export default tmpl;
tmpl.stylesheets = [];

if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets);
}

tmpl.stylesheetTokens = {
  hostAttribute: "my-test_test-host",
  shadowAttribute: "my-test_test"
};
        `.trim()
    );
  });

  it("should convert multiple nested divs with text", function () {
    const source = `
import _implicitStylesheets from "./test.css";
import { registerTemplate } from "lwc";

function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    t: api_text,
    h: api_element
  } = $api;
  return [api_element("div", {
    key: 2
  }, [api_element("div", {
    key: 0
  }, [api_text("hi 1")]), api_element("div", {
    key: 1
  }, [api_text("hi 2")])])];
}

export default registerTemplate(tmpl);
tmpl.stylesheets = [];

if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets);
}

tmpl.stylesheetTokens = {
  hostAttribute: "my-test_test-host",
  shadowAttribute: "my-test_test"
};
        `.trim();

    expect(convert('something.html', source)).toBe(
      `
import _implicitStylesheets from "./test.css";
import * as React from "react";

function tmpl($cmp) {
  return React.createElement("div", {
    [tmpl.stylesheetTokens.shadowAttribute]: "true"
  }, [React.createElement("div", {
    [tmpl.stylesheetTokens.shadowAttribute]: "true"
  }, "hi 1"), React.createElement("div", {
    [tmpl.stylesheetTokens.shadowAttribute]: "true"
  }, "hi 2")]);
}

export default tmpl;
tmpl.stylesheets = [];

if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets);
}

tmpl.stylesheetTokens = {
  hostAttribute: "my-test_test-host",
  shadowAttribute: "my-test_test"
};
        `.trim()
    );
  });

  it("should convert class attributes", function () {
    const source = `
import _implicitStylesheets from "./test.css";

import { registerTemplate } from "lwc";

function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    t: api_text,
    h: api_element
  } = $api;
  return [api_element("div", {
    classMap: {
      "hello": true
    },
    key: 0
  }, [api_text("text")])];
}

export default registerTemplate(tmpl);
tmpl.stylesheets = [];

if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets)
}
tmpl.stylesheetTokens = {
  hostAttribute: "my-test_test-host",
  shadowAttribute: "my-test_test"
};
        `.trim();

    expect(convert('something.html', source)).toBe(
      `
import _implicitStylesheets from "./test.css";
import * as React from "react";

function tmpl($cmp) {
  return React.createElement("div", {
    [tmpl.stylesheetTokens.shadowAttribute]: "true",
    className: "hello"
  }, "text");
}

export default tmpl;
tmpl.stylesheets = [];

if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets);
}

tmpl.stylesheetTokens = {
  hostAttribute: "my-test_test-host",
  shadowAttribute: "my-test_test"
};
        `.trim()
    );
  });

  it("should convert style attributes", function () {
    const source = `
import _implicitStylesheets from "./test.css";
import { registerTemplate } from "lwc";

function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    t: api_text,
    h: api_element
  } = $api;
  return [api_element("div", {
    styleMap: {
      "color": "red"
    },
    key: 0
  }, [api_text("text")])];
}

export default registerTemplate(tmpl);
tmpl.stylesheets = [];

if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets)
}
tmpl.stylesheetTokens = {
  hostAttribute: "my-test_test-host",
  shadowAttribute: "my-test_test"
};
        `.trim();

    expect(convert("something.html", source)).toBe(
      `
import _implicitStylesheets from "./test.css";
import * as React from "react";

function tmpl($cmp) {
  return React.createElement("div", {
    [tmpl.stylesheetTokens.shadowAttribute]: "true",

    style: {
      "color": "red"
    }
  }, "text");
}

export default tmpl;
tmpl.stylesheets = [];

if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets);
}

tmpl.stylesheetTokens = {
  hostAttribute: "my-test_test-host",
  shadowAttribute: "my-test_test"
};
        `.trim()
    );
  });

  it("should convert generic attributes", function () {
    const source = `
import _implicitStylesheets from "./test.css";

import { registerTemplate } from "lwc";

function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    t: api_text,
    h: api_element
  } = $api;
  return [api_element("div", {
    attrs: {
      "title": "wow"
    },
    key: 0
  }, [api_text("text")])];
}

export default registerTemplate(tmpl);
tmpl.stylesheets = [];

if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets)
}
tmpl.stylesheetTokens = {
  hostAttribute: "my-test_test-host",
  shadowAttribute: "my-test_test"
};
        `.trim();

    expect(convert('something.html', source)).toBe(
      `
import _implicitStylesheets from "./test.css";
import * as React from "react";

function tmpl($cmp) {
  return React.createElement("div", {
    [tmpl.stylesheetTokens.shadowAttribute]: "true",
    "title": "wow"
  }, "text");
}

export default tmpl;
tmpl.stylesheets = [];

if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets);
}

tmpl.stylesheetTokens = {
  hostAttribute: "my-test_test-host",
  shadowAttribute: "my-test_test"
};
        `.trim()
    );
  });

  it("should convert complex heirarchy with attributes", function () {
    const code = `
import _implicitStylesheets from "./test.css";

import { registerTemplate } from "lwc";

function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    h: api_element,
    t: api_text,
    gid: api_scoped_id
  } = $api;
  return [api_element("figure", {
    attrs: {
      "role": "group"
    },
    key: 3
  }, [api_element("img", {
    styleMap: {
      "border": "1px",
      "borderColor": "red"
    },
    attrs: {
      "src": "operahousesteps.jpg",
      "alt": "The Sydney Opera House"
    },
    key: 0
  }, []), api_element("figcaption", {
    classMap: {
      "something": true,
      "else": true
    },
    key: 2
  }, [api_text("We saw the opera "), api_element("cite", {
    key: 1
  }, [api_text("Barber of Seville")]), api_text(" here!")])])];
}

export default registerTemplate(tmpl);
tmpl.stylesheets = [];

if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets)
}
tmpl.stylesheetTokens = {
  hostAttribute: "my-test_test-host",
  shadowAttribute: "my-test_test"
};
        `.trim();

        expect(convert('something.html', code)).toBe(`
import _implicitStylesheets from "./test.css";
import * as React from "react";

function tmpl($cmp) {
  return React.createElement("figure", {
    [tmpl.stylesheetTokens.shadowAttribute]: "true",
    "role": "group"
  }, [React.createElement("img", {
    [tmpl.stylesheetTokens.shadowAttribute]: "true",
    "src": "operahousesteps.jpg",
    "alt": "The Sydney Opera House",

    style: {
      "border": "1px",
      "borderColor": "red"
    }
  }, null), React.createElement("figcaption", {
    [tmpl.stylesheetTokens.shadowAttribute]: "true",
    className: "something else"
  }, ["We saw the opera ", React.createElement("cite", {
    [tmpl.stylesheetTokens.shadowAttribute]: "true"
  }, "Barber of Seville"), " here!"])]);
}

export default tmpl;
tmpl.stylesheets = [];

if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets);
}

tmpl.stylesheetTokens = {
  hostAttribute: "my-test_test-host",
  shadowAttribute: "my-test_test"
};
        `.trim())
  });

  it('should convert the lwc class into a react class that renders the template', function() {
    const source = `
import _tmpl from "./test.html";
import { registerComponent as _registerComponent } from "lwc";
import { LightningElement } from 'lwc';

class Test extends LightningElement {}

export default _registerComponent(Test, {
  tmpl: _tmpl
});
    `

    expect(convert('something.js', source)).toBe(`
import _tmpl from "./test.html";
import * as React from "react";

class Test extends React.Component {
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
    `.trim());
  });

  it('should generate the proper template with api bound props', function() {
    const source = `
import _implicitStylesheets from "./product.css";

import { registerTemplate } from "lwc";

function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    t: api_text,
    d: api_dynamic,
    h: api_element
  } = $api;
  return [api_element("h1", {
    key: 0
  }, [api_text("Product: "), api_dynamic($cmp.params.productId)])];
}

export default registerTemplate(tmpl);
tmpl.stylesheets = [];

if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets)
}
tmpl.stylesheetTokens = {
  hostAttribute: "my-product_product-host",
  shadowAttribute: "my-product_product"
};
`
expect(convert('something.html', source)).toBe(`
import _implicitStylesheets from "./product.css";
import * as React from "react";

function tmpl($cmp) {
  return React.createElement("h1", {
    [tmpl.stylesheetTokens.shadowAttribute]: "true"
  }, ["Product: ", $cmp.productId]);
}

export default tmpl;
tmpl.stylesheets = [];

if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets);
}

tmpl.stylesheetTokens = {
  hostAttribute: "my-product_product-host",
  shadowAttribute: "my-product_product"
};
`.trim())

  })
});