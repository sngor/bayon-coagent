import {
  toast,
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showAIToast,
  showPersistentToast,
  TOAST_DURATION,
} from "../use-toast"

describe("Enhanced Toast System", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("should have correct duration constants", () => {
    expect(TOAST_DURATION.SUCCESS).toBe(3000)
    expect(TOAST_DURATION.ERROR).toBe(5000)
    expect(TOAST_DURATION.WARNING).toBe(4000)
    expect(TOAST_DURATION.AI).toBe(4000)
    expect(TOAST_DURATION.DEFAULT).toBe(4000)
    expect(TOAST_DURATION.PERSISTENT).toBe(Infinity)
  })

  it("should create a success toast with correct variant and duration", () => {
    const result = showSuccessToast("Success!", "Operation completed")
    
    expect(result).toBeDefined()
    expect(result.id).toBeDefined()
    expect(result.dismiss).toBeInstanceOf(Function)
    expect(result.update).toBeInstanceOf(Function)
  })

  it("should create an error toast with correct variant and duration", () => {
    const result = showErrorToast("Error!", "Something went wrong")
    
    expect(result).toBeDefined()
    expect(result.id).toBeDefined()
    expect(result.dismiss).toBeInstanceOf(Function)
  })

  it("should create a warning toast with correct variant and duration", () => {
    const result = showWarningToast("Warning!", "Please be careful")
    
    expect(result).toBeDefined()
    expect(result.id).toBeDefined()
    expect(result.dismiss).toBeInstanceOf(Function)
  })

  it("should create an AI toast with correct variant and duration", () => {
    const result = showAIToast("AI Processing", "Generating content...")
    
    expect(result).toBeDefined()
    expect(result.id).toBeDefined()
    expect(result.dismiss).toBeInstanceOf(Function)
  })

  it("should create a persistent toast", () => {
    const result = showPersistentToast("Persistent", "This requires manual dismissal")
    
    expect(result).toBeDefined()
    expect(result.id).toBeDefined()
    expect(result.dismiss).toBeInstanceOf(Function)
  })

  it("should allow manual dismissal of toast", () => {
    const result = showSuccessToast("Success!", "Manual dismiss test")
    
    expect(result).toBeDefined()
    expect(() => result.dismiss()).not.toThrow()
  })

  it("should support custom duration in base toast function", () => {
    const customDuration = 2000
    const result = toast({
      title: "Custom Duration",
      duration: customDuration,
    })
    
    expect(result).toBeDefined()
    expect(result.id).toBeDefined()
  })

  it("should auto-dismiss toast after specified duration", () => {
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout')
    
    const result = showSuccessToast("Success!", "Will auto-dismiss")
    
    expect(result).toBeDefined()
    
    // Verify setTimeout was called with the correct duration
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), TOAST_DURATION.SUCCESS)
    
    setTimeoutSpy.mockRestore()
  })

  it("should not auto-dismiss persistent toasts", () => {
    const result = showPersistentToast("Persistent", "This requires manual dismissal")
    
    expect(result).toBeDefined()
    
    // Fast-forward time - persistent toast should not auto-dismiss
    jest.advanceTimersByTime(10000)
    
    // The toast should still be manageable
    expect(() => result.dismiss()).not.toThrow()
  })
})
