import { convert } from "../src/index";

describe("Component composition", function () {
  it("should generate scoped css logic", function () {
    const code = `
function stylesheet(hostSelector, shadowSelector, nativeShadow) {
  return [".box", shadowSelector, " {color: red;} .other", shadowSelector, " {background: orange;} "].join('');
}
var _implicitStylesheets = [stylesheet];

function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    t: api_text,
    h: api_element
  } = $api;
  return [api_element("div", {
    classMap: {
      "box": true
    },
    key: 0
  }, [api_text("hi")])];
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

class App extends BaseLightningElement {}

var MyApp = registerComponent(App, {
  tmpl: _tmpl
});
        `.trim();

    expect(convert(code)).toBe(
      `
function stylesheet(hostSelector, shadowSelector, nativeShadow) {
    return [
        ".box",
        shadowSelector,
        " {color: red;} .other",
        shadowSelector,
        " {background: orange;} "
    ].join("");
}

class App extends React.Component {
    constructor(props) {
        super(props);
        window.___cssUniqueCounter = window.___cssUniqueCounter || 0;
        window.___cssUniqueCounter++;
        this.___scopedSelector = window.___cssUniqueCounter;
    }

    render() {
        return React.createElement("div", {
            ["scoped"+this.___scopedSelector]: "true",
            className: "box"
        }, "hi");
    }

    componentDidMount() {
        const css = document.createElement("style");
        css.type = "text/css";
        css.textContent = stylesheet(null, "scoped" + this.___scopedSelector, null);
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

  it("should generate dynamic class css logic", function () {
    const code = `
function stylesheetABC(hostSelector, shadowSelector, nativeShadow) {
  return [".box", shadowSelector, " {color: red;}"].join('');
}
var _implicitStylesheets = [stylesheet];

function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    t: api_text,
    h: api_element
  } = $api;
  return [api_element("div", {
    className: $cmp.calculateClass,
    key: 1
  }, [api_element("span", {
    classMap: {
      ".box": true
    },
    key: 0
  }, [api_text("something else")])])];
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

class App extends BaseLightningElement {
  constructor(...args) {
    super(...args);
    this.calculateClass = ".box";
  }

}

registerDecorators(App, {
  fields: ["calculateClass"]
});

var MyApp = registerComponent(App, {
  tmpl: _tmpl
});
        `.trim();

    expect(convert(code)).toBe(
      `
function stylesheetABC(hostSelector, shadowSelector, nativeShadow) {
    return [".box", shadowSelector, " {color: red;}"].join("");
}

class App extends React.Component {
    constructor(props) {
        super(props);
        window.___cssUniqueCounter = window.___cssUniqueCounter || 0;
        window.___cssUniqueCounter++;
        this.___scopedSelector = window.___cssUniqueCounter;
        this.state = {};
        this.state.calculateClass = ".box";
    }

    render() {
        return React.createElement("div", {
            ["scoped"+this.___scopedSelector]: "true",
            className: this.state.calculateClass
        }, React.createElement("span", {
            ["scoped"+this.___scopedSelector]: "true",
            className: ".box"
        }, "something else"));
    }

    componentDidMount() {
        const css = document.createElement("style");
        css.type = "text/css";
        css.textContent = stylesheetABC(null, "scoped" + this.___scopedSelector, null);
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
