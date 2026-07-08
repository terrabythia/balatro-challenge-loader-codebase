import { describe, test, expect } from "bun:test";
import { flattenConfig, parseLine } from "@/lib/description-parser";

describe("flattenConfig", () => {
  test("extracts scalar values", () => {
    expect(flattenConfig({ a: 1, b: "hello", c: 3 })).toEqual([1, "hello", 3]);
  });

  test("recurses into nested objects", () => {
    expect(flattenConfig({ outer: { inner: 42 } })).toEqual([42]);
  });

  test("recurses into arrays", () => {
    expect(flattenConfig({ arr: [1, 2, 3] })).toEqual([1, 2, 3]);
  });

  test("skips null/undefined values", () => {
    expect(flattenConfig({ a: null, b: undefined, c: 5 })).toEqual([5]);
  });

  test("deeply nested mix", () => {
    expect(
      flattenConfig({ config: { extra: 4, mult: 2, odds: [1, 2] } }),
    ).toEqual([4, 2, 1, 2]);
  });
});

describe("parseLine", () => {
  test("plain text without tags", () => {
    const result = parseLine("Simple text", []);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ type: "text", value: "Simple text" });
  });

  test("red color tag applies to text between tags", () => {
    const result = parseLine("{C:red}+4{} Mult", []);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ type: "text", value: "+4", color: "red" });
    expect(result[1]).toEqual({ type: "text", value: " Mult" });
  });

  test("closing tag resets color", () => {
    const result = parseLine("{C:red}Red{} normal", []);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ type: "text", value: "Red", color: "red" });
    expect(result[1].color).toBeUndefined();
  });

  test("resolves raw #N# variables from config", () => {
    const result = parseLine("+#1# Mult", [4]);
    expect(result).toEqual([
      { type: "text", value: "+" },
      { type: "var", value: "4" },
      { type: "text", value: " Mult" },
    ]);
  });

  test("keeps #N# as placeholder when config missing", () => {
    const result = parseLine("#1# bonus", []);
    expect(result).toEqual([
      { type: "var", value: "#1#" },
      { type: "text", value: " bonus" },
    ]);
  });

  test("X:mult with C:blue tag", () => {
    const result = parseLine("{X:mult,C:blue}X#1#{} Mult", [2]);
    expect(result[0].color).toBe("blue");
  });

  test("multiple variables in one line", () => {
    const result = parseLine("#1# in #2# chance", [1, 4]);
    expect(result).toEqual([
      { type: "var", value: "1" },
      { type: "text", value: " in " },
      { type: "var", value: "4" },
      { type: "text", value: " chance" },
    ]);
  });

  test("raw variable inside color span inherits color", () => {
    const result = parseLine("{C:green}+#1#{} chips", [5]);
    expect(result).toEqual([
      { type: "text", value: "+", color: "green" },
      { type: "var", value: "5", color: "green" },
      { type: "text", value: " chips", color: undefined },
    ]);
  });

  test("strips unmatched closing braces", () => {
    const result = parseLine("{}text after", []);
    expect(result).toEqual([{ type: "text", value: "text after" }]);
  });

  test("handles empty line", () => {
    const result = parseLine("", []);
    expect(result).toHaveLength(0);
  });
});
