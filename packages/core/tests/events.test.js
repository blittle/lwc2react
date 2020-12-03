import { compile } from '../src/compiler';

describe('Events', function () {
  it('bound events in template', function () {
    const source = `
import _implicitStylesheets from "./app.css";

import { registerTemplate } from "lwc";

function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    d: api_dynamic,
    h: api_element,
    t: api_text,
    b: api_bind
  } = $api;
  const {
    _m0
  } = $ctx;
  return [api_element("div", {
    key: 2
  }, [api_element("span", {
    key: 0
  }, [api_dynamic($cmp.something)]), api_element("button", {
    key: 1,
    on: {
      "click": _m0 || ($ctx._m0 = api_bind($cmp.increment))
    }
  }, [api_text("increment")])])];
}

export default registerTemplate(tmpl);
tmpl.stylesheets = [];

if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets)
}
tmpl.stylesheetTokens = {
  hostAttribute: "my-app_app-host",
  shadowAttribute: "my-app_app"
};
    `;

    expect(compile('something.html', source)).toMatchSnapshot();
  });

  it('should render input form events and attributes', function () {
    const source = `
import _implicitStylesheets from "./searchBar.css";
import { registerTemplate } from "lwc";
function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    h: api_element,
    b: api_bind
  } = $api;
  const {
    _m0,
    _m1,
    _m2
  } = $ctx;
  return [api_element("div", {
    classMap: {
      "site-search": true
    },
    key: 3
  }, [api_element("span", {
    classMap: {
      "fa": true,
      "fa-search": true
    },
    key: 0
  }, []), api_element("input", {
    classMap: {
      "form-control": true,
      "search-field": true
    },
    attrs: {
      "placeholder": "Search (keywords, brands, etc)",
      "type": "search"
    },
    props: {
      "value": $cmp.query,
      "autofocus": true
    },
    key: 1,
    on: {
      "input": _m0 || ($ctx._m0 = api_bind($cmp.searchInputHandler)),
      "keyup": _m1 || ($ctx._m1 = api_bind($cmp.searchKeyUpHandler))
    }
  }, []), api_element("i", {
    classMap: {
      "fa": true,
      "fa-search": true
    },
    key: 2,
    on: {
      "click": _m2 || ($ctx._m2 = api_bind($cmp.handleIconClick))
    }
  }, [])])];
}
export default registerTemplate(tmpl);
tmpl.stylesheets = [];
if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets)
}
tmpl.stylesheetTokens = {
  hostAttribute: "my-searchBar_searchBar-host",
  shadowAttribute: "my-searchBar_searchBar"
};`;

    expect(compile('some.html', source)).toMatchSnapshot();
  });

  it('should dispatch custom events from the template', function () {
    const source = `
import { registerDecorators as _registerDecorators } from "lwc";
import _tmpl from "./searchBar.html";
import { registerComponent as _registerComponent } from "lwc";
import { LightningElement } from 'lwc';
/**
 * Search Bar where visitors can search for stuff
 */
class SearchBar extends LightningElement {
  constructor(...args) {
    super(...args);
    this.query = '';
  }

  performSearch() {
    this.template.dispatchEvent(new CustomEvent('someevent', {
      detail: this.query
    }));
  }
}
_registerDecorators(SearchBar, {
  publicProps: {
    query: {
      config: 0
    }
  }
})
export default _registerComponent(SearchBar, {
  tmpl: _tmpl
});
    `;
    expect(compile('something.js', source)).toMatchSnapshot();
  });

  it('should dispatch custom events from the component ref', function () {
    const source = `
import { registerDecorators as _registerDecorators } from "lwc";
import _tmpl from "./searchBar.html";
import { registerComponent as _registerComponent } from "lwc";
import { LightningElement } from 'lwc';
/**
 * Search Bar where visitors can search for stuff
 */
class SearchBar extends LightningElement {
  constructor(...args) {
    super(...args);
    this.query = '';
  }

  performSearch() {
    this.dispatchEvent(new CustomEvent('someevent', {
      detail: this.query
    }));
  }
}
_registerDecorators(SearchBar, {
  publicProps: {
    query: {
      config: 0
    }
  }
})
export default _registerComponent(SearchBar, {
  tmpl: _tmpl
});
    `;
    expect(compile('something.js', source)).toMatchSnapshot();
  });

  it('should add event listeners to ref', function () {
    const source = `
import { registerDecorators as _registerDecorators } from "lwc";
import _tmpl from "./searchBar.html";
import { registerComponent as _registerComponent } from "lwc";
import { LightningElement } from 'lwc';
/**
 * Search Bar where visitors can search for stuff
 */
class SearchBar extends LightningElement {
  constructor(...args) {
    super(...args);
    this.query = '';
    this.template.addEventListener('something', this.performSearch);
    this.addEventListener('something', this.performSearch);
  }

  performSearch() {}
}
_registerDecorators(SearchBar, {
  publicProps: {
    query: {
      config: 0
    }
  }
})
export default _registerComponent(SearchBar, {
  tmpl: _tmpl
});
    `;
    expect(compile('something.js', source)).toMatchSnapshot();
  });

  it('should convert custom events on templates', function () {
    const source = `
import _implicitStylesheets from "./header.css";
import _mySearchBar from "my/searchBar";
import { registerTemplate } from "lwc";
function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    b: api_bind,
    c: api_custom_element
  } = $api;
  const {
    _m0
  } = $ctx;
  return [api_custom_element("my-search-bar", _mySearchBar, {
    props: {
      "query": $cmp.query
    },
    key: 0,
    on: {
      "search": _m0 || ($ctx._m0 = api_bind($cmp.updateQuery))
    }
  }, [])];
}
export default registerTemplate(tmpl);
tmpl.stylesheets = [];
if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets)
}
tmpl.stylesheetTokens = {
  hostAttribute: "my-header_header-host",
  shadowAttribute: "my-header_header"
};
    `;

    expect(compile('something.html', source)).toMatchSnapshot();
  });
});
