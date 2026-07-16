"use server";

import { auth } from "@/lib/auth";
import { loginSchema, registerSchema, type LoginFormData, type RegisterFormData } from "@/lib/utils/validation";

export type AuthResult = {
  success: boolean;
  error?: string;
  data?: {
    user?: {
      id: string;
      name: string;
      email: string;
    };
  };
};

export async function loginAction(data: LoginFormData): Promise<AuthResult> {
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

    // Attempt sign in
    const result = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    if (!result) {
      return {
        success: false,
        error: "Invalid email or password. Please try again.",
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
    console.error("Login error:", error);

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
          error: "No account found with this email. Please sign up first.",
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
    await auth.api.signOut({
      headers: new Headers(),
    });
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return {
      success: false,
      error: "Failed to sign out. Please try again.",
    };
  }
}
