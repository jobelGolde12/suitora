# AI Stylist Fix Test Cases

## Test Suite Overview

This document contains comprehensive test cases to verify all fixes for the AI Stylist component. Tests are organized by component and functionality.

## 1. StylistChat Component Tests

### 1.1 handleSend Function Tests

#### TC-001: Normal Message Send
**Test ID**: TC-CHAT-001
**Component**: `StylistChat.handleSend`
**Description**: Test normal message submission and response flow
**Steps**:
1. User types "What colors suit my skin tone best?"
2. User clicks send button
3. Verify optimistic message appears immediately
4. Verify input field clears
5. Verify loading state appears
6. Verify AI response appears after API call
7. Verify usage counter updates

**Expected Results**:
- Optimistic message appears in chat
- Input field is cleared
- Loading indicator shows "Stylist is thinking…"
- AI response appears with follow-up chips
- Usage counter decrements

**Actual Results**:
- [To be filled after implementation]

**Pass/Fail**: [To be determined]

#### TC-002: Empty Message Validation
**Test ID**: TC-CHAT-002
**Component**: `StylistChat.handleSend`
**Description**: Test that empty messages are rejected
**Steps**:
1. User leaves input field empty
2. User clicks send button
3. Verify no API call is made
4. Verify no optimistic message appears
5. Verify input field remains unchanged

**Expected Results**:
- No API call is made
- No optimistic message appears
- Input field remains unchanged
- No loading state appears

**Actual Results**:
- [To be filled after implementation]

**Pass/Fail**: [To be determined]

#### TC-003: Rapid Successive Messages
**Test ID**: TC-CHAT-003
**Component**: `StylistChat.handleSend`
**Description**: Test handling of rapid message submissions
**Steps**:
1. User types message 1 and sends
2. User quickly types message 2 and sends (before API response)
3. Verify both optimistic messages appear
4. Verify loading state shows for latest message only
5. Verify API responses arrive in order

**Expected Results**:
- Both optimistic messages appear
- Loading state shows for latest message
- API responses arrive in correct order
- No duplicate messages

**Actual Results**:
- [To be filled after implementation]

**Pass/Fail**: [To be determined]

#### TC-004: Component Unmount During API Call
**Test ID**: TC-CHAT-004
**Component**: `StylistChat.handleSend`
**Description**: Test component unmounting during API call
**Steps**:
1. User sends message
2. Component unmounts (simulated)
3. Verify no memory leaks
4. Verify no console errors
5. Verify cleanup of timers/intervals

**Expected Results**:
- No memory leaks
- No console errors
- Proper cleanup of resources

**Actual Results**:
- [To be filled after implementation]

**Pass/Fail**: [To be determined]

### 1.2 State Management Tests

#### TC-005: Input State Null Check
**Test ID**: TC-CHAT-005
**Component**: `StylistChat.setInput`
**Description**: Test that setInput handles null/undefined values
**Steps**:
1. Send message with valid input
2. Verify input state is properly cleared
3. Send message with empty input
4. Verify no crash occurs
5. Verify input state remains empty string

**Expected Results**:
- Input state is properly cleared after valid message
- No crash with empty input
- Input state remains empty string

**Actual Results**:
- [To be filled after implementation]

**Pass/Fail**: [To be determined]

#### TC-006: Messages State Accumulation
**Test ID**: TC-CHAT-006
**Component**: `StylistChat.setMessages`
**Description**: Test that messages state accumulates correctly
**Steps**:
1. Send 5 messages rapidly
2. Verify all 5 messages appear in chat
3. Verify message IDs are unique
4. Verify message order is preserved
5. Verify no duplicate messages

**Expected Results**:
- All 5 messages appear
- Message IDs are unique
- Order is preserved
- No duplicates

**Actual Results**:
- [To be filled after implementation]

**Pass/Fail**: [To be determined]

### 1.3 Error Handling Tests

#### TC-007: API 500 Error Handling
**Test ID**: TC-CHAT-007
**Component**: `StylistChat.handleSend`
**Description**: Test handling of API 500 errors
**Steps**:
1. Send message
2. Mock API to return 500 error
3. Verify optimistic message is removed
4. Verify error toast appears
5. Verify loading state ends
6. Verify user can retry

**Expected Results**:
- Optimistic message is removed
- Error toast appears with message
- Loading state ends
- User can retry sending

**Actual Results**:
- [To be filled after implementation]

**Pass/Fail**: [To be determined]

#### TC-008: Network Timeout Handling
**Test ID**: TC-CHAT-008
**Component**: `StylistChat.handleSend`
**Description**: Test handling of network timeouts
**Steps**:
1. Send message
2. Simulate network timeout
3. Verify error handling
4. Verify user can retry
5. Verify no stuck loading state

**Expected Results**:
- Error is handled gracefully
- User can retry
- No stuck loading state

**Actual Results**:
- [To be filled after implementation]

**Pass/Fail**: [To be determined]

## 2. API Route Tests

### 2.1 Stylist API Route Tests

#### TC-009: GET /api/stylist
**Test ID**: TC-API-009
**Component**: `app/api/stylist/route.ts GET`
**Description**: Test retrieving stylist conversation history
**Steps**:
1. Make authenticated GET request
2. Verify response contains messages
3. Verify response contains usage info
4. Verify response format is correct

**Expected Results**:
- Response contains messages array
- Response contains usage object
- Response status is 200
- Response format matches API spec

**Actual Results**:
- [To be filled after implementation]

**Pass/Fail**: [To be determined]

#### TC-010: POST /api/stylist - Success
**Test ID**: TC-API-010
**Component**: `app/api/stylist/route.ts POST`
**Description**: Test successful message processing
**Steps**:
1. Make authenticated POST request with valid message
2. Verify response contains message
3. Verify response contains updated usage
4. Verify message is persisted

**Expected Results**:
- Response contains message
- Response contains updated usage
- Response status is 200
- Message is persisted in database

**Actual Results**:
- [To be filled after implementation]

**Pass/Fail**: [To be determined]

#### TC-011: POST /api/stylist - Rate Limit
**Test ID**: TC-API-011
**Component**: `app/api/stylist/route.ts POST`
**Description**: Test rate limiting
**Steps**:
1. Make multiple requests quickly
2. Verify rate limit is enforced
3. Verify appropriate error response
4. Verify retry-after header

**Expected Results**:
- Rate limit is enforced
- Error response contains appropriate message
- Retry-after header is present
- Response status is 429

**Actual Results**:
- [To be filled after implementation]

**Pass/Fail**: [To be determined]

#### TC-012: POST /api/stylist - Authentication Error
**Test ID**: TC-API-012
**Component**: `app/api/stylist/route.ts POST`
**Description**: Test authentication error handling
**Steps**:
1. Make POST request without authentication
2. Verify appropriate error response
3. Verify response status is 401

**Expected Results**:
- Error response contains "Unauthorized"
- Response status is 401

**Actual Results**:
- [To be filled after implementation]

**Pass/Fail**: [To be determined]

## 3. Integration Tests

### 3.1 Full User Journey
**Test ID**: TC-INT-001
**Description**: Test complete user journey from landing to chat
**Steps**:
1. Navigate to AI Stylist page
2. Send first message
3. Receive AI response
4. Send follow-up question
5. Verify conversation history
6. Verify usage tracking

**Expected Results**:
- Page loads correctly
- Chat interface works
- Messages flow correctly
- Usage is tracked

**Actual Results**:
- [To be filled after implementation]

**Pass/Fail**: [To be determined]

### 3.2 Edge Cases
**Test ID**: TC-INT-002
**Description**: Test various edge cases
**Steps**:
1. Send very long message (10,000+ characters)
2. Send message with special characters/emojis
3. Send message during loading state
4. Send multiple rapid messages
5. Send message with network disconnection

**Expected Results**:
- All edge cases handled gracefully
- No crashes or errors
- Appropriate user feedback

**Actual Results**:
- [To be filled after implementation]

**Pass/Fail**: [To be determined]

## 4. Performance Tests

### 4.1 Memory Leak Tests
**Test ID**: TC-PERF-001
**Description**: Test for memory leaks in message accumulation
**Steps**:
1. Send 100 messages
2. Monitor memory usage
3. Verify no memory growth
4. Clear messages
5. Verify memory returns to baseline

**Expected Results**:
- No memory growth
- Memory returns to baseline after cleanup

**Actual Results**:
- [To be filled after implementation]

**Pass/Fail**: [To be determined]

### 4.2 Render Performance
**Test ID**: TC-PERF-002
**Description**: Test component re-render frequency
**Steps**:
1. Send message
2. Monitor component re-renders
3. Verify reasonable re-render count
4. Send multiple messages
5. Verify re-render count scales appropriately

**Expected Results**:
- Reasonable re-render frequency
- No unnecessary re-renders

**Actual Results**:
- [To be filled after implementation]

**Pass/Fail**: [To be determined]

## 5. Manual Test Checklist

### 5.1 UI/UX Manual Tests
- [ ] Input field clears after sending message
- [ ] Loading state shows appropriate spinner
- [ ] Error messages are user-friendly
- [ ] Follow-up chips are clickable
- [ ] Keyboard navigation works (Tab, Enter)
- [ ] Responsive design works on mobile
- [ ] Accessibility features work (ARIA labels)

### 5.2 Functional Manual Tests
- [ ] Send and receive messages
- [ ] Handle empty message submission
- [ ] Handle API errors
- [ ] Handle network issues
- [ ] Handle rapid successive messages
- [ ] Handle component unmounting

## Test Execution Plan

1. **Unit Tests**: Run component-specific tests
2. **Integration Tests**: Run API and integration tests
3. **E2E Tests**: Run end-to-end tests with Cypress/Playwright
4. **Manual Tests**: Perform manual testing for UI/UX
5. **Regression Tests**: Run tests after each fix

## Test Coverage Requirements

- 100% test coverage for modified code
- All critical bugs have test cases
- Edge cases are covered
- Error conditions are tested
- Performance is validated

---

## 6. Executed Verification (this remediation pass)

### 6.1 Commands run and results

| Command | Result |
|---------|--------|
| `npx tsc --noEmit` | ✅ Pass — 0 errors (was 5 errors in `StylistChat.tsx` + TS2304 in `error-handling-utils.ts` before fixes) |
| `npx vitest run tests/integration/stylist.route.test.ts lib/ai/stylist.test.ts` | ✅ 17/17 tests passed |

### 6.2 Bug-to-test mapping

| Bug | Regression test | Harness |
|-----|-----------------|---------|
| BUG-001 (composer not cleared) | TC-CHAT-001 step 3, TC-CHAT-005 | Manual / future component test |
| BUG-002 (TS2304) | `npx tsc --noEmit` | CI typecheck |
| BUG-003 (reference JSX) | `npx tsc --noEmit` | CI typecheck |
| BUG-004 (extra `</div>`) | `npx tsc --noEmit` | CI typecheck |
| BUG-005 (dead mount guard) | TC-CHAT-004 (unmount during API call) | Manual / future component test |
| BUG-006 (persistence order) | New test: `generateStylistReply` rejects → assert user message **not** written | `tests/integration/stylist.route.test.ts` |

### 6.3 Harness gaps (documented, not blocking)

- No component-level test harness exists: the repo has no `jsdom` or
  `@testing-library/react`, so `StylistChat` cannot be rendered in vitest today.
  Adding that harness is Phase 3.4 in `03-fix-plan.md`.
- No Cypress e2e spec covers the stylist page (existing specs: auth, analysis,
  accessibility, landing, wardrobe, dashboard). A `stylist.cy.ts` should be added
  once the app runs against a seeded DB.
- The route-level behavior IS covered by `tests/integration/stylist.route.test.ts`
  (401/400/429/200, limit clamping, persistence, usage accounting).