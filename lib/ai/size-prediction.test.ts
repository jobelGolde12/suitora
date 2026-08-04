import { describe, it, expect } from "vitest";
import { predictSizes } from "./size-prediction";

describe("predictSizes", () => {
  it("predicts all sizes from complete measurements", () => {
    const result = predictSizes({
      chestCircumference: 95,
      waistCircumference: 80,
      hipCircumference: 100,
      footLength: 26,
    });

    expect(result.topSize.size).toBe("M");
    expect(result.bottomSize.size).toBe("M");
    expect(result.dressSize.size).toBe("M");
    expect(result.shoeSize.us).toBe("8.5");
    expect(result.shoeSize.eu).toBe("39");
    expect(result.shoeSize.uk).toBe("6");
    expect(result.measurementsUsed).toEqual(
      expect.arrayContaining([
        "chestCircumference",
        "waistCircumference",
        "footLength",
      ])
    );
  });

  it("drops to smallest size below the chart", () => {
    const result = predictSizes({ chestCircumference: 70 });
    expect(result.topSize.size).toBe("XS");
    expect(result.topSize.confidence).toBe(0.5);
  });

  it("clamps to largest size above the chart", () => {
    const result = predictSizes({ waistCircumference: 130 });
    expect(result.bottomSize.size).toBe("3XL");
    expect(result.bottomSize.confidence).toBe(0.5);
  });

  it("marks missing measurements", () => {
    const result = predictSizes({});
    expect(result.topSize.size).toBe("—");
    expect(result.bottomSize.size).toBe("—");
    expect(result.dressSize.size).toBe("—");
    expect(result.shoeSize.us).toBe("—");
    expect(result.missingMeasurements).toEqual(
      expect.arrayContaining(["chestCircumference", "waistCircumference"])
    );
  });

  it("reports unknown shoe size for out-of-range foot length", () => {
    const result = predictSizes({ footLength: 18 });
    expect(result.shoeSize.us).toBe("—");
    expect(result.shoeSize.confidence).toBe(0.3);
  });

  it("estimates sizes from shoulder width and hip circumference", () => {
    const result = predictSizes({
      shoulderWidth: 40,
      hipCircumference: 100,
    });
    expect(result.topSize.size).not.toBe("—");
    expect(result.bottomSize.size).not.toBe("—");
    expect(result.measurementsUsed).toEqual(
      expect.arrayContaining(["shoulderWidth", "hipCircumference"])
    );
  });
});
