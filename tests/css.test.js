import { convert } from "../src/index";

describe("Scoped CSS", function () {
  it("should generate scoped css logic", function () {
    const code = `
function stylesheet(hostSelector, shadowSelector, nativeShadow) {
  return [".test", shadowSelector, " {color: red;}"].join('');
}
export default [stylesheet];
        `.trim();

    expect(convert('something.css', code)).toBe(code);
  });
});
