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
});
