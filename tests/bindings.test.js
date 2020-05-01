import { convert } from "../src/index";

describe("Bindings conversion", function () {
  it("should convert basic binding", function () {
    const code = `
function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    d: api_dynamic,
    h: api_element
  } = $api;
  return [api_element("div", {
    key: 0
  }, [api_dynamic($cmp.someValue)])];
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
    this.someValue = "hi";
  }

}

registerDecorators(App, {
  fields: ["someValue"]
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
        this.state.someValue = "hi";
    }

    render() {
        return React.createElement("div", null, this.state.someValue);
    }
}
        `.trim()
    );
  });

  it("should convert methods", function () {
    const code = `
function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    d: api_dynamic,
    h: api_element
  } = $api;
  return [api_element("div", {
    key: 0
  }, [api_dynamic($cmp.someValue)])];
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
    this.someValue = 1;
  }

  change() {
    const someValue = this.someValue;

    if (this.someValue) {
      this.someValue = this.someValue + 1;
    } else {
      this.someValue = someValue + 1;
    }
  }

}

registerDecorators(App, {
  fields: ["someValue"]
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
        this.state.someValue = 1;
    }

    render() {
        return React.createElement("div", null, this.state.someValue);
    }

    change() {
        const someValue = this.state.someValue;

        if (this.state.someValue) {
            this.setState({
                someValue: this.state.someValue + 1
            });
        } else {
            this.setState({
                someValue: someValue + 1
            });
        }
    }
}
         `.trim()
    );
  });

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

  it("should convert @api props", function() {
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
    `
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
        }, []);
    }
}
      `.trim()
    );

  })

  it("should convert @api with a getter and styles", function() {
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
    `
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
            "src": this.props.imageURL,
            "alt": this.props.productName,
            "title": this.props.productName,
            className: "product-image"
        }, []));
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

  })
});
