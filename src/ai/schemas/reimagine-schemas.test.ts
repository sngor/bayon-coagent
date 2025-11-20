import { describe, it, expect } from "@jest/globals";
import {
  EditTypeSchema,
  VirtualStagingParamsSchema,
  DayToDuskParamsSchema,
  EnhanceParamsSchema,
  ItemRemovalParamsSchema,
  VirtualRenovationParamsSchema,
  EditSuggestionSchema,
  ImageMetadataSchema,
  EditRecordSchema,
  EditHistoryItemSchema,
  ProcessingStatusSchema,
  validateFileUpload,
  validateEditParams,
  MAX_FILE_SIZE,
  SUPPORTED_IMAGE_FORMATS,
} from "./reimagine-schemas";

describe("Reimagine Schemas", () => {
  describe("EditTypeSchema", () => {
    it("should validate valid edit types", () => {
      expect(() => EditTypeSchema.parse("virtual-staging")).not.toThrow();
      expect(() => EditTypeSchema.parse("day-to-dusk")).not.toThrow();
      expect(() => EditTypeSchema.parse("enhance")).not.toThrow();
      expect(() => EditTypeSchema.parse("item-removal")).not.toThrow();
      expect(() => EditTypeSchema.parse("virtual-renovation")).not.toThrow();
    });

    it("should reject invalid edit types", () => {
      expect(() => EditTypeSchema.parse("invalid-type")).toThrow();
    });
  });

  describe("VirtualStagingParamsSchema", () => {
    it("should validate valid virtual staging params", () => {
      const validParams = {
        roomType: "living-room",
        style: "modern",
      };
      expect(() =>
        VirtualStagingParamsSchema.parse(validParams)
      ).not.toThrow();
    });

    it("should reject invalid room types", () => {
      const invalidParams = {
        roomType: "invalid-room",
        style: "modern",
      };
      expect(() => VirtualStagingParamsSchema.parse(invalidParams)).toThrow();
    });

    it("should reject invalid styles", () => {
      const invalidParams = {
        roomType: "living-room",
        style: "invalid-style",
      };
      expect(() => VirtualStagingParamsSchema.parse(invalidParams)).toThrow();
    });
  });

  describe("DayToDuskParamsSchema", () => {
    it("should validate valid day-to-dusk params", () => {
      expect(() =>
        DayToDuskParamsSchema.parse({ intensity: "subtle" })
      ).not.toThrow();
      expect(() =>
        DayToDuskParamsSchema.parse({ intensity: "moderate" })
      ).not.toThrow();
      expect(() =>
        DayToDuskParamsSchema.parse({ intensity: "dramatic" })
      ).not.toThrow();
    });

    it("should reject invalid intensity values", () => {
      expect(() =>
        DayToDuskParamsSchema.parse({ intensity: "extreme" })
      ).toThrow();
    });
  });

  describe("EnhanceParamsSchema", () => {
    it("should validate valid enhance params with auto adjust", () => {
      const validParams = {
        autoAdjust: true,
      };
      expect(() => EnhanceParamsSchema.parse(validParams)).not.toThrow();
    });

    it("should validate valid enhance params with manual adjustments", () => {
      const validParams = {
        autoAdjust: false,
        brightness: 50,
        contrast: -20,
        saturation: 30,
      };
      expect(() => EnhanceParamsSchema.parse(validParams)).not.toThrow();
    });

    it("should reject brightness values outside range", () => {
      const invalidParams = {
        autoAdjust: false,
        brightness: 150,
      };
      expect(() => EnhanceParamsSchema.parse(invalidParams)).toThrow();
    });

    it("should reject contrast values outside range", () => {
      const invalidParams = {
        autoAdjust: false,
        contrast: -150,
      };
      expect(() => EnhanceParamsSchema.parse(invalidParams)).toThrow();
    });
  });

  describe("ItemRemovalParamsSchema", () => {
    it("should validate valid item removal params", () => {
      const validParams = {
        maskData: "base64encodedstring==",
        objects: ["trash can", "power lines"],
      };
      expect(() => ItemRemovalParamsSchema.parse(validParams)).not.toThrow();
    });

    it("should reject params without mask data", () => {
      const invalidParams = {
        objects: ["trash can"],
      };
      expect(() => ItemRemovalParamsSchema.parse(invalidParams)).toThrow();
    });
  });

  describe("VirtualRenovationParamsSchema", () => {
    it("should validate valid renovation params", () => {
      const validParams = {
        description: "Replace old carpet with hardwood flooring",
        style: "modern",
      };
      expect(() =>
        VirtualRenovationParamsSchema.parse(validParams)
      ).not.toThrow();
    });

    it("should validate renovation params without style", () => {
      const validParams = {
        description: "Paint walls white and add crown molding",
      };
      expect(() =>
        VirtualRenovationParamsSchema.parse(validParams)
      ).not.toThrow();
    });

    it("should reject descriptions that are too short", () => {
      const invalidParams = {
        description: "Paint",
      };
      expect(() =>
        VirtualRenovationParamsSchema.parse(invalidParams)
      ).toThrow();
    });

    it("should reject descriptions that are too long", () => {
      const invalidParams = {
        description: "a".repeat(1001),
      };
      expect(() =>
        VirtualRenovationParamsSchema.parse(invalidParams)
      ).toThrow();
    });
  });

  describe("EditSuggestionSchema", () => {
    it("should validate valid edit suggestion", () => {
      const validSuggestion = {
        editType: "virtual-staging",
        priority: "high",
        reason: "Empty room would benefit from furniture visualization",
        suggestedParams: {
          roomType: "living-room",
          style: "modern",
        },
        confidence: 0.95,
      };
      expect(() => EditSuggestionSchema.parse(validSuggestion)).not.toThrow();
    });

    it("should validate suggestion without suggested params", () => {
      const validSuggestion = {
        editType: "enhance",
        priority: "medium",
        reason: "Image quality could be improved",
        confidence: 0.75,
      };
      expect(() => EditSuggestionSchema.parse(validSuggestion)).not.toThrow();
    });

    it("should reject confidence values outside 0-1 range", () => {
      const invalidSuggestion = {
        editType: "enhance",
        priority: "medium",
        reason: "Test",
        confidence: 1.5,
      };
      expect(() => EditSuggestionSchema.parse(invalidSuggestion)).toThrow();
    });
  });

  describe("ImageMetadataSchema", () => {
    it("should validate valid image metadata", () => {
      const validMetadata = {
        PK: "USER#user123",
        SK: "IMAGE#img456",
        imageId: "img456",
        userId: "user123",
        originalKey: "users/user123/images/img456.jpg",
        fileName: "property-photo.jpg",
        fileSize: 2048000,
        contentType: "image/jpeg",
        width: 1920,
        height: 1080,
        uploadedAt: new Date().toISOString(),
        suggestions: [
          {
            editType: "virtual-staging",
            priority: "high",
            reason: "Empty room",
            confidence: 0.9,
          },
        ],
      };
      expect(() => ImageMetadataSchema.parse(validMetadata)).not.toThrow();
    });
  });

  describe("EditRecordSchema", () => {
    it("should validate valid edit record", () => {
      const validRecord = {
        PK: "USER#user123",
        SK: "EDIT#edit789",
        editId: "edit789",
        userId: "user123",
        imageId: "img456",
        editType: "virtual-staging",
        params: {
          roomType: "living-room",
          style: "modern",
        },
        sourceKey: "users/user123/images/img456.jpg",
        resultKey: "users/user123/edits/edit789.jpg",
        status: "completed",
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        modelId: "amazon.titan-image-generator-v1",
        processingTime: 15000,
      };
      expect(() => EditRecordSchema.parse(validRecord)).not.toThrow();
    });

    it("should validate edit record with chained edit", () => {
      const validRecord = {
        PK: "USER#user123",
        SK: "EDIT#edit790",
        editId: "edit790",
        userId: "user123",
        imageId: "img456",
        editType: "enhance",
        params: {
          autoAdjust: true,
        },
        sourceKey: "users/user123/edits/edit789.jpg",
        resultKey: "users/user123/edits/edit790.jpg",
        status: "completed",
        createdAt: new Date().toISOString(),
        parentEditId: "edit789",
      };
      expect(() => EditRecordSchema.parse(validRecord)).not.toThrow();
    });
  });

  describe("validateFileUpload", () => {
    it("should accept valid JPEG file under 10MB", () => {
      const file = new File(["x".repeat(5000000)], "test.jpg", {
        type: "image/jpeg",
      });
      const result = validateFileUpload(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should accept valid PNG file under 10MB", () => {
      const file = new File(["x".repeat(5000000)], "test.png", {
        type: "image/png",
      });
      const result = validateFileUpload(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should accept valid WebP file under 10MB", () => {
      const file = new File(["x".repeat(5000000)], "test.webp", {
        type: "image/webp",
      });
      const result = validateFileUpload(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject file over 10MB", () => {
      const file = new File(["x".repeat(11000000)], "test.jpg", {
        type: "image/jpeg",
      });
      const result = validateFileUpload(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("10MB limit");
    });

    it("should reject unsupported file format", () => {
      const file = new File(["x".repeat(5000000)], "test.gif", {
        type: "image/gif",
      });
      const result = validateFileUpload(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("JPEG, PNG, or WebP");
    });
  });

  describe("validateEditParams", () => {
    it("should validate virtual staging params", () => {
      const params = {
        roomType: "living-room",
        style: "modern",
      };
      const result = validateEditParams("virtual-staging", params);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(params);
    });

    it("should validate day-to-dusk params", () => {
      const params = {
        intensity: "moderate",
      };
      const result = validateEditParams("day-to-dusk", params);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(params);
    });

    it("should validate enhance params", () => {
      const params = {
        autoAdjust: false,
        brightness: 50,
      };
      const result = validateEditParams("enhance", params);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(params);
    });

    it("should reject invalid params for edit type", () => {
      const params = {
        roomType: "invalid-room",
        style: "modern",
      };
      const result = validateEditParams("virtual-staging", params);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should reject mismatched params for edit type", () => {
      const params = {
        intensity: "moderate",
      };
      const result = validateEditParams("virtual-staging", params);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
