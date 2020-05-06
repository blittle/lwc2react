import { convert } from "../src/index";

xdescribe("Component composition", function () {
  it("should render nested component", function () {
    const code = `
function tmpl$1($api, $cmp, $slotset, $ctx) {
  const {
    c: api_custom_element
  } = $api;
  return [api_custom_element("my-comp", _myComp, {
    key: 0
  }, [])];
}

var _tmpl$1 = registerTemplate(tmpl$1);
tmpl$1.stylesheets = [];
tmpl$1.stylesheetTokens = {
  hostAttribute: "my-app_app-host",
  shadowAttribute: "my-app_app"
};

class App extends BaseLightningElement {}

var MyApp = registerComponent(App, {
  tmpl: _tmpl$1
});
        `.trim();

    expect(convert(code)).toBe(
      `
class App extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return React.createElement(_myComp, null, null);
    }
}
        `.trim()
    );
  });

  it("should render nested components with slots and properties", function () {
    const code = `
function tmpl$1($api, $cmp, $slotset, $ctx) {
  const {
    t: api_text,
    h: api_element,
    c: api_custom_element
  } = $api;
  return [api_custom_element("my-comp", _myComp, {
    props: {
      "wow": "there"
    },
    key: 1
  }, [api_element("div", {
    key: 0
  }, [api_text("hi")])])];
}

var _tmpl$1 = registerTemplate(tmpl$1);
tmpl$1.stylesheets = [];
tmpl$1.stylesheetTokens = {
  hostAttribute: "my-app_app-host",
  shadowAttribute: "my-app_app"
};

class App extends BaseLightningElement {}

var MyApp = registerComponent(App, {
  tmpl: _tmpl$1
});
        `.trim();

    expect(convert(code)).toBe(
      `
class App extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return React.createElement(_myComp, {
            "wow": "there"
        }, React.createElement("div", null, "hi"));
    }
}
        `.trim()
    );
  });
});