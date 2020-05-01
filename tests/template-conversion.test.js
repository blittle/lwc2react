import { convert } from "../src/index";

describe("Template conversion", function () {
  it("should convert an empty component", function () {
    const code = `
            function tmpl($api, $cmp, $slotset, $ctx) {
            return [];
            }

            var _tmpl = registerTemplate(tmpl);
            tmpl.stylesheets = [];
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
class App extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return null;
    }
}
        `.trim()
    );
  });
  it("should convert div with text", function () {
    const code = `
            function tmpl($api, $cmp, $slotset, $ctx) {
            const {
                t: api_text,
                h: api_element
            } = $api;
            return [api_element("div", {
                key: 0
            }, [api_text("hi")])];
            }

            var _tmpl = registerTemplate(tmpl);
            tmpl.stylesheets = [];
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
class App extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return React.createElement("div", null, "hi");
    }
}
        `.trim()
    );
  });

  it("should convert multiple nested divs with text", function () {
    const code = `
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

var _tmpl = registerTemplate(tmpl);
tmpl.stylesheets = [];
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
class App extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return React.createElement("div", null, [
            React.createElement("div", null, "hi 1"),
            React.createElement("div", null, "hi 2")
        ]);
    }
}
        `.trim()
    );
  });

  it("should convert class attributes", function () {
    const code = `
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

var _tmpl = registerTemplate(tmpl);
tmpl.stylesheets = [];
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
class App extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return React.createElement("div", {
            className: "hello"
        }, "text");
    }
}
        `.trim()
    );
  });

  it("should convert style attributes", function () {
    const code = `
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

var _tmpl = registerTemplate(tmpl);
tmpl.stylesheets = [];
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
class App extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return React.createElement("div", {
            style: {
                "color": "red"
            }
        }, "text");
    }
}
        `.trim()
    );
  });

  it("should convert generic attributes", function () {
    const code = `
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

var _tmpl = registerTemplate(tmpl);
tmpl.stylesheets = [];
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
class App extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return React.createElement("div", {
            "title": "wow"
        }, "text");
    }
}
        `.trim()
    );
  });

  it("should convert complex heirarchy with attributes", function () {
    const code = `
function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    t: api_text,
    h: api_element
  } = $api;
  return [api_element("div", {
    classMap: {
      "some-class": true
    },
    attrs: {
      "title": "wow"
    },
    key: 6
  }, [api_element("section", {
    key: 2
  }, [api_element("h1", {
    key: 0
  }, [api_text("WWF")]), api_element("p", {
    key: 1
  }, [api_text("The World Wide Fund for Nature (WWF) is....")])]), api_element("section", {
    attrs: {
      "aria-current": "true"
    },
    key: 5
  }, [api_element("ul", {
    classMap: {
      "list": true
    },
    key: 4
  }, [api_element("li", {
    styleMap: {
      "color": "red",
      "background": "blue"
    },
    key: 3
  }, [api_text("Some list element")])])])])];
}

var _tmpl = registerTemplate(tmpl);
tmpl.stylesheets = [];
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
class App extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return React.createElement("div", {
            "title": "wow",
            className: "some-class"
        }, [React.createElement("section", null, [
            React.createElement("h1", null, "WWF"),
            React.createElement("p", null, "The World Wide Fund for Nature (WWF) is....")
        ]), React.createElement("section", {
            "aria-current": "true"
        }, React.createElement("ul", {
            className: "list"
        }, React.createElement("li", {
            style: {
                "color": "red",
                "background": "blue"
            }
        }, "Some list element")))]);
    }
}
        `.trim()
    );
  });
});
