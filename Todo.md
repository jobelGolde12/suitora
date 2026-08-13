
You are a senior QA engineer and full-stack developer specializing in Next.js applications. I need you to perform a comprehensive deep test of the AI Stylist page in my Next.js 16.2.10 (Turbopack) application, document all bugs and errors, and create a detailed remediation plan.

## Project Context
- **Application**: AI Fashion Stylist chatbot
- **Framework**: Next.js 16.2.10 with Turbopack
- **Key Component**: `components/stylist/StylistChat.tsx`
- **Current Status**: Multiple bugs and errors, unstable functionality

## Known Critical Error
```
Error Type: Console Error
Error Message: Internal server error
Location: handleSend at components/stylist/StylistChat.tsx:84:14

Code Frame:
  82 |     setMessages((prev) => [...prev, optimistic]);
  83 |     setInput("");
> 84 |     setInput("");     ← Error occurs here
  85 |     setIsSending(true);
  86 |
  87 |     try {
```

## Phase 1: Deep Testing Protocol

### 1.1 Component Analysis (StylistChat.tsx)
Conduct thorough analysis of the entire component:
- **State Management Audit**:
  - Map all useState hooks and their initial values
  - Identify all state update patterns (direct, functional, async)
  - Check for state dependencies and race conditions
  - Verify TypeScript types for all state variables
  
- **Event Handler Testing**:
  - `handleSend` function: Test all execution paths
  - Input validation logic
  - Optimistic update implementation
  - Error handling completeness
  - Cleanup/abort logic for in-flight requests
  
- **Side Effects Analysis**:
  - All useEffect hooks and their dependencies
  - Auto-scroll behavior
  - WebSocket/SSE connections if any
  - Event listeners and their cleanup
  - Timer/interval operations

### 1.2 API Route Testing
Analyze all related API routes:
- `/api/chat` or `/api/stylist/*` endpoints
- Request validation
- Error response formats
- Streaming/SSE implementation if applicable
- Rate limiting
- Authentication/session handling

### 1.3 Integration Testing
Test the full user journey:
- **Happy Path**: Normal message submission and response
- **Edge Cases**:
  - Empty message submission
  - Very long messages (10,000+ characters)
  - Special characters and emojis
  - Rapid successive messages
  - Messages during loading state
  - Browser back/forward navigation
  - Network disconnection during send
  - Slow network conditions
  
- **Error States**:
  - API returns 400/401/403/429/500
  - Network timeout
  - JSON parse errors
  - Malformed AI responses
  - Session expiration

### 1.4 Performance Testing
- Component re-render frequency
- Memory leaks in message accumulation
- Large message history performance (100+ messages)
- Image/file attachment handling
- Animation performance

### 1.5 UI/UX Testing
- Loading states visibility
- Error message display
- Input disabled states
- Responsive design
- Accessibility (keyboard navigation, screen readers)
- Dark/light mode compatibility

## Phase 2: Documentation Requirements

Create a `stylist-fix` folder with the following structure:

```
stylist-fix/
├── README.md                    # Overview and summary
├── 01-bug-inventory.md         # Complete list of all bugs found
├── 02-root-cause-analysis.md   # Deep dive into causes
├── 03-fix-plan.md              # Step-by-step resolution plan
├── 04-test-cases.md            # Test cases to verify fixes
├── 05-code-fixes/              # Actual code fix implementations
│   ├── stylist-chat-fix.tsx
│   ├── api-route-fix.ts
│   └── error-handling-utils.ts
└── 06-prevention-strategy.md   # Long-term prevention measures
```

### Required Documentation Details:

#### 01-bug-inventory.md
For each bug, document:
- **Bug ID**: Unique identifier (BUG-001, BUG-002, etc.)
- **Severity**: Critical / High / Medium / Low
- **Description**: What exactly happens
- **Steps to Reproduce**: Detailed reproduction steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Error Logs**: Console/network/server errors
- **Affected Browsers**: Chrome, Firefox, Safari, etc.
- **Screenshots/Videos**: If applicable (note where they'd be needed)
- **Regression Risk**: Low/Medium/High

#### 02-root-cause-analysis.md
For each major bug category:
- **Technical Root Cause**: The underlying code issue
- **Architectural Issues**: Design patterns contributing to bugs
- **Missing Safeguards**: What protections should exist
- **Dependency Chain**: How this bug affects other functionality
- **Why Testing Missed It**: Gap analysis in testing

#### 03-fix-plan.md
Prioritized implementation plan:
- **Phase 1: Critical Fixes** (must ship immediately)
  - Fix the `setInput("")` crash
  - Fix any data loss scenarios
  - Fix any security vulnerabilities
  
- **Phase 2: Stability Improvements**
  - Error handling enhancement
  - Loading state improvements
  - API resilience
  
- **Phase 3: UX Polish**
  - Performance optimizations
  - Accessibility improvements
  - Edge case handling
  
Each fix includes:
- Files to modify
- Code changes (before/after)
- Testing steps
- Deployment considerations

#### 04-test-cases.md
Comprehensive test suite:
- Unit tests for `handleSend` and related functions
- Integration tests for the full send flow
- E2E test scenarios (Cypress/Playwright format)
- Manual test checklist
- Regression test cases for fixed bugs

#### 05-code-fixes/
Actual implementation files:
- Fixed component with comments explaining changes
- Fixed API route with proper error handling
- Utility functions for error handling and validation
- TypeScript type definitions

#### 06-prevention-strategy.md
- ESLint rules to add
- TypeScript strict mode configuration
- CI/CD test requirements
- Code review checklist
- Monitoring and error tracking setup

## Phase 3: Specific Investigation Areas

### Investigate the setInput Crash
Deep dive into why `setInput("")` crashes:
1. Check if `input` state is properly typed:
   ```typescript
   const [input, setInput] = useState<string>("");
   ```

2. Look for state corruption:
   - Is something setting `input` to `undefined` or `null`?
   - Is there a ref being misused with input state?

3. Check for component unmounting:
   - Does the component unmount between `setMessages` and `setInput`?
   - Is there a conditional render removing the input element?

4. React StrictMode effects:
   - Double-render issues in development
   - State mutation detection

### API Route Investigation
Find and analyze the chat API route:
```typescript
// Expected location: app/api/chat/route.ts or pages/api/chat.ts
// Check for:
- Proper HTTP status codes
- JSON response format
- Error catching wrapping entire handler
- Request body validation
- Timeout handling
```

### State Flow Analysis
Map the complete state flow:
```
User clicks Send
→ handleSend called
→ Input validation (check if empty)
→ Optimistic message add (setMessages)
→ Clear input (setInput) ← CRASH
→ Set loading state (setIsSending)
→ API call (fetch/axios)
→ Success: Add AI response to messages
→ Error: Remove optimistic message, show error
→ Reset loading state
```

## Deliverables

1. Complete `stylist-fix` folder with all 6 documentation files
2. Working code fixes that can be directly applied
3. Test suite that validates all fixes
4. Estimated effort for each fix phase
5. Risk assessment for deployment

## Success Criteria
- All critical bugs resolved
- Zero console errors in normal operation
- Graceful error handling for all API failures
- Smooth UX in all edge cases
- Comprehensive test coverage
- Clear documentation for future maintenance

Begin with Phase 1 testing, document findings incrementally, and build the fix plan based on evidence gathered during testing.
```

You are not required to edit, view, or delete data in .env file but you can edit and view the .env.example file

Additionally go and fix this error in @error-handling-utils.ts:
Cannot find name 'StylistMessageInput'.ts(2304)
type StylistMessageInput = /*unresolved*/ any
