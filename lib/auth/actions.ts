"use server";

import { auth } from "@/lib/auth";
import { db, schema } from "@/drizzle";
import { loginSchema, registerSchema, type LoginFormData, type RegisterFormData } from "@/lib/utils/validation";
import { loginRateLimiter, bruteForceLimiter, failedAttemptsLimiter } from "@/lib/rate-limit";
import { nanoid } from "@/lib/utils/id";

export type AuthResult = {
  success: boolean;
  error?: string;
  rateLimit?: {
    limit: number;
    remaining: number;
    reset: number;
  };
  data?: {
    user?: {
      id: string;
      name: string;
      email: string;
    };
  };
};

export async function loginAction(
  data: LoginFormData,
  ip: string = "anonymous"
): Promise<AuthResult> {
  try {
    // Validate input
    const validated = loginSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: "Please check your email and password format.",
      };
    }

    const { email, password } = validated.data;

    // Check Tier 1 rate limit (5 attempts per 15 minutes per IP)
    const tier1 = await loginRateLimiter.limit(ip);
    if (!tier1.success) {
      return {
        success: false,
        error: "Too many login attempts. Please try again in 15 minutes.",
        rateLimit: {
          limit: tier1.limit,
          remaining: tier1.remaining,
          reset: tier1.reset,
        },
      };
    }

    // Check Tier 2 rate limit (15 attempts per 24 hours per IP)
    const tier2 = await bruteForceLimiter.limit(ip);
    if (!tier2.success) {
      return {
        success: false,
        error: "Account temporarily locked due to suspicious activity. Please try again later.",
        rateLimit: {
          limit: tier2.limit,
          remaining: tier2.remaining,
          reset: tier2.reset,
        },
      };
    }

    // Check failed attempts per email (graduated delays)
    const failedCheck = await failedAttemptsLimiter.limit(email);
    
    // Attempt sign in
    const result = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    if (!result) {
      // Log failed attempt
      await logAuditEvent("login_failed", email, ip, "Invalid credentials");
      
      return {
        success: false,
        error: "Invalid email or password. Please try again.",
      };
    }

    // Log successful login
    await logAuditEvent("login_success", email, ip, "Login successful");

    return {
      success: true,
      data: {
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
        },
      },
    };
  } catch (error) {
    console.error("Login error:", error);

    // Log the failed attempt
    const email = data.email || "unknown";
    await logAuditEvent("login_error", email, ip, error instanceof Error ? error.message : "Unknown error");

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes("Invalid")) {
        return {
          success: false,
          error: "Invalid email or password. Please try again.",
        };
      }
      if (error.message.includes("not found") || error.message.includes("No user")) {
        return {
          success: false,
          error: "Invalid email or password. Please try again.",
        };
      }
    }

    return {
      success: false,
      error: "Something went wrong. Please try again later.",
    };
  }
}

export async function registerAction(data: RegisterFormData): Promise<AuthResult> {
  try {
    // Validate input
    const validated = registerSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: "Please fill in all fields correctly.",
      };
    }

    const { name, email, password } = validated.data;

    // Attempt sign up
    const result = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
    });

    if (!result) {
      return {
        success: false,
        error: "Unable to create account. Please try again.",
      };
    }

    return {
      success: true,
      data: {
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
        },
      },
    };
  } catch (error) {
    console.error("Registration error:", error);

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes("already exists") || error.message.includes("already taken")) {
        return {
          success: false,
          error: "An account with this email already exists. Please sign in instead.",
        };
      }
      if (error.message.includes("weak") || error.message.includes("password")) {
        return {
          success: false,
          error: "Password is too weak. Please use a stronger password.",
        };
      }
    }

    return {
      success: false,
      error: "Unable to create your account. Please try again later.",
    };
  }
}

export async function logoutAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const headers = new Headers();
    await auth.api.signOut({ headers });
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return {
      success: false,
      error: "Failed to sign out. Please try again.",
    };
  }
}

async function logAuditEvent(
  action: string,
  email: string,
  ip: string,
  details: string
): Promise<void> {
  try {
    await db.insert(schema.auditLogs).values({
      id: nanoid(),
      action,
      details: JSON.stringify({ email, ip, details, timestamp: new Date().toISOString() }),
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to log audit event:", error);
  }
}
