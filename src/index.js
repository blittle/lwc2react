import { parse, print } from "recast";

export function convert(input) {
    return print(parse(input)).code;
}