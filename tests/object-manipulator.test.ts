import { describe, it, expect } from "vitest";
import { ObjectManipulator } from "../src";

describe("ObjectManipulator", () => {
  describe("setPropertyValue", () => {
    it("should set simple property", () => {
      const obj: Record<string, unknown> = {};
      ObjectManipulator.setPropertyValue(obj, "name", "John");
      expect(obj.name).toBe("John");
    });

    it("should set nested property", () => {
      const obj: Record<string, unknown> = {};
      ObjectManipulator.setPropertyValue(obj, "user.profile.name", "John");
      expect(obj).toEqual({ user: { profile: { name: "John" } } });
    });

    it("should set array element", () => {
      const obj = { items: ["a", "b", "c"] };
      ObjectManipulator.setPropertyValue(obj, "items[1]", "x");
      expect(obj.items[1]).toBe("x");
    });

    it("should create intermediate arrays when needed", () => {
      const obj: Record<string, unknown> = {};
      ObjectManipulator.setPropertyValue(obj, "items.0.name", "first");
      expect(obj).toEqual({ items: [{ name: "first" }] });
    });
  });

  describe("getPropertyValue", () => {
    it("should get simple property", () => {
      const obj = { name: "John" };
      expect(ObjectManipulator.getPropertyValue(obj, "name")).toBe("John");
    });

    it("should get nested property", () => {
      const obj = { user: { profile: { name: "John" } } };
      expect(ObjectManipulator.getPropertyValue(obj, "user.profile.name")).toBe(
        "John",
      );
    });

    it("should return default for missing property", () => {
      const obj = {};
      expect(
        ObjectManipulator.getPropertyValue(obj, "missing", "default"),
      ).toBe("default");
    });

    it("should get array element", () => {
      const obj = { items: ["a", "b", "c"] };
      expect(ObjectManipulator.getPropertyValue(obj, "items[1]")).toBe("b");
    });
  });

  describe("deleteProperty", () => {
    it("should delete simple property", () => {
      const obj = { name: "John", age: 25 };
      ObjectManipulator.deleteProperty(obj, "age");
      expect(obj).toEqual({ name: "John" });
    });

    it("should delete nested property", () => {
      const obj = { user: { name: "John", age: 25 } };
      ObjectManipulator.deleteProperty(obj, "user.age");
      expect(obj).toEqual({ user: { name: "John" } });
    });

    it("should handle non-existent path gracefully", () => {
      const obj = { name: "John" };
      ObjectManipulator.deleteProperty(obj, "missing.path");
      expect(obj).toEqual({ name: "John" });
    });
  });

  describe("insertAtIndex", () => {
    it("should insert at beginning", () => {
      const obj = { items: ["b", "c"] };
      ObjectManipulator.insertAtIndex(obj, "items@0", "a");
      expect(obj.items).toEqual(["a", "b", "c"]);
    });

    it("should insert in middle", () => {
      const obj = { items: ["a", "c"] };
      ObjectManipulator.insertAtIndex(obj, "items@1", "b");
      expect(obj.items).toEqual(["a", "b", "c"]);
    });

    it("should append when index is -1", () => {
      const obj = { items: ["a", "b"] };
      ObjectManipulator.insertAtIndex(obj, "items@-1", "c");
      expect(obj.items).toEqual(["a", "b", "c"]);
    });

    it("should work with nested arrays", () => {
      const obj = { user: { items: ["a"] } };
      ObjectManipulator.insertAtIndex(obj, "user.items@0", "x");
      expect(obj.user.items).toEqual(["x", "a"]);
    });
  });

  describe("removeAtIndex", () => {
    it("should remove at beginning", () => {
      const obj = { items: ["a", "b", "c"] };
      ObjectManipulator.removeAtIndex(obj, "items@0");
      expect(obj.items).toEqual(["b", "c"]);
    });

    it("should remove in middle", () => {
      const obj = { items: ["a", "b", "c"] };
      ObjectManipulator.removeAtIndex(obj, "items@1");
      expect(obj.items).toEqual(["a", "c"]);
    });

    it("should remove at end", () => {
      const obj = { items: ["a", "b", "c"] };
      ObjectManipulator.removeAtIndex(obj, "items@2");
      expect(obj.items).toEqual(["a", "b"]);
    });
  });

  describe("setValueAtIndex", () => {
    it("should set value at index", () => {
      const obj = { items: ["a", "b", "c"] };
      ObjectManipulator.setValueAtIndex(obj, "items@1", "x");
      expect(obj.items).toEqual(["a", "x", "c"]);
    });

    it("should work with objects in array", () => {
      const obj = { items: [{ id: 1 }, { id: 2 }] };
      ObjectManipulator.setValueAtIndex(obj, "items@0", { id: 99 });
      expect(obj.items[0]).toEqual({ id: 99 });
    });
  });
});
