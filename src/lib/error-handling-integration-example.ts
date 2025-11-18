/**
 * Error Handling Integration Examples
 * 
 * This file demonstrates how to integrate the smart error handling system
 * with various parts of the application.
 */

import {
  handleError,
  handleAIError,
  handleNetworkError,
  handleAuthError,
  handleDatabaseError,
  retryWithBackoff,
  type ErrorHandlingOptions,
} from "@/lib/error-handling";

// ============================================================================
// Example 1: Server Action with Error Handling
// ============================================================================

/**
 * Example of wrapping a server action with error handling
 */
export async function exampleServerAction(input: any) {
  "use server";

  try {
    // Perform operation
    const result = await someOperation(input);
    return { success: true, data: result };
  } catch (error) {
    // Handle error with context
    const pattern = handleError(error, {
      showToast: false, // Server-side, no toast
      logError: true,
      context: {
        operation: "example_server_action",
        timestamp: new Date(),
        metadata: { input },
      },
    });

    // Return error information to client
    return {
      success: false,
      error: {
        message: pattern.userMessage,
        category: pattern.category,
        suggestedActions: pattern.suggestedActions,
      },
    };
  }
}

// ============================================================================
// Example 2: AI Operation with Retry
// ============================================================================

/**
 * Example of AI operation with automatic retry
 */
export async function generateContentWithRetry(prompt: string) {
  try {
    const result = await retryWithBackoff(
      async () => {
        // Call AI service
        return await aiService.generate(prompt);
      },
      {
        maxAttempts: 3,
        baseDelay: 2000,
        maxDelay: 10000,
        onRetry: (attempt, error) => {
          console.log(`AI generation retry attempt ${attempt}:`, error.message);
        },
      }
    );

    return { success: true, data: result };
  } catch (error) {
    const { retry, fallback, pattern } = handleAIError(
      error as Error,
      "content_generation"
    );

    return {
      success: false,
      error: {
        message: pattern.userMessage,
        canRetry: retry,
        fallbackOption: fallback,
      },
    };
  }
}

// ============================================================================
// Example 3: Database Operation with Error Handling
// ============================================================================

/**
 * Example of database operation with error handling
 */
export async function fetchUserDataSafely(userId: string) {
  try {
    const data = await retryWithBackoff(
      async () => {
        return await database.query({ userId });
      },
      {
        maxAttempts: 2,
        baseDelay: 1000,
      }
    );

    return { success: true, data };
  } catch (error) {
    handleDatabaseError(error as Error, "fetch_user_data");

    return {
      success: false,
      error: "Unable to fetch user data. Please try again.",
    };
  }
}

// ============================================================================
// Example 4: API Route with Error Handling
// ============================================================================

/**
 * Example of Next.js API route with error handling
 */
export async function exampleApiRoute(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    if (!body.email) {
      throw new Error("Validation failed: Email is required");
    }

    // Process request
    const result = await processRequest(body);

    return Response.json({ success: true, data: result });
  } catch (error) {
    const pattern = handleError(error, {
      showToast: false,
      logError: true,
      context: {
        operation: "api_route",
        timestamp: new Date(),
      },
    });

    return Response.json(
      {
        success: false,
        error: {
          message: pattern.userMessage,
          category: pattern.category,
          suggestedActions: pattern.suggestedActions,
        },
      },
      { status: getStatusCode(pattern.category) }
    );
  }
}

// ============================================================================
// Example 5: Client Component with Error Handling
// ============================================================================

/**
 * Example of client component using error handling hook
 */
/*
import { useErrorHandler } from "@/hooks/use-error-handler";

function ExampleComponent() {
  const { error, pattern, handleError, clearError } = useErrorHandler({
    onError: (error, pattern) => {
      // Custom error handling logic
      console.log("Error occurred:", pattern.category);
    },
  });

  const performAction = async () => {
    try {
      await riskyOperation();
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <div>
      {error && (
        <div className="error-banner">
          <p>{pattern?.userMessage}</p>
          <ul>
            {pattern?.suggestedActions.map((action, i) => (
              <li key={i}>{action}</li>
            ))}
          </ul>
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}
      <button onClick={performAction}>Perform Action</button>
    </div>
  );
}
*/

// ============================================================================
// Example 6: Form Submission with Error Handling
// ============================================================================

/**
 * Example of form submission with error handling
 */
/*
import { useFormWithErrorHandling } from "@/hooks/use-error-handler";

function ExampleForm() {
  const [formData, setFormData] = useState({ email: "", name: "" });
  const { error, pattern, isSubmitting, handleSubmit } = useFormWithErrorHandling();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await handleSubmit(async () => {
      // Validate
      if (!formData.email.includes("@")) {
        throw new Error("Validation failed: Invalid email format");
      }

      // Submit
      return await submitForm(formData);
    });

    if (result) {
      // Success - redirect or show success message
      console.log("Form submitted successfully");
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      
      {error && (
        <div className="error">
          <p>{pattern?.userMessage}</p>
        </div>
      )}
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
*/

// ============================================================================
// Example 7: Network Request with Retry
// ============================================================================

/**
 * Example of network request with automatic retry
 */
export async function fetchWithRetry(url: string, options?: RequestInit) {
  try {
    const response = await retryWithBackoff(
      async () => {
        const res = await fetch(url, options);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      },
      {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 5000,
      }
    );

    return { success: true, data: response };
  } catch (error) {
    handleNetworkError(error as Error, {
      operation: "fetch_request",
      timestamp: new Date(),
      metadata: { url },
    });

    return {
      success: false,
      error: "Network request failed. Please check your connection.",
    };
  }
}

// ============================================================================
// Example 8: Authentication Flow with Error Handling
// ============================================================================

/**
 * Example of authentication with error handling
 */
export async function signInWithErrorHandling(email: string, password: string) {
  try {
    const result = await authService.signIn(email, password);
    return { success: true, data: result };
  } catch (error) {
    const pattern = handleAuthError(error as Error);

    // Return user-friendly error
    return {
      success: false,
      error: {
        message: pattern.userMessage,
        suggestedActions: pattern.suggestedActions,
        category: pattern.category,
      },
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function getStatusCode(category: string): number {
  switch (category) {
    case "validation":
      return 400;
    case "authentication":
      return 401;
    case "authorization":
      return 403;
    case "not_found":
      return 404;
    case "rate_limit":
      return 429;
    case "server_error":
      return 500;
    default:
      return 500;
  }
}

// Placeholder functions for examples
async function someOperation(input: any): Promise<any> {
  return {};
}

async function processRequest(body: any): Promise<any> {
  return {};
}

const aiService = {
  generate: async (prompt: string) => ({}),
};

const database = {
  query: async (params: any) => ({}),
};

const authService = {
  signIn: async (email: string, password: string) => ({}),
};
