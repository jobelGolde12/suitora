/**
 * Custom ESLint rule (Pillar 03, Action Item 8): guard against N+1 query
 * patterns in Drizzle code. Catches:
 *
 * 1. DB query calls directly inside for/while loops — the classic synchronous
 *    N+1 (`await db.select()...` / `await dbWrite...` / `await tx...`).
 * 2. `Promise.all(x.map(...))` where the map callback issues per-row DB reads
 *    (parallel N+1), while still allowing literal `Promise.all([...])` batches.
 * 3. Unbounded `.select()` chains that have neither `.where()` nor `.limit()`
 *    (guaranteed full-table scans).
 */

const QUERY_OBJECTS = new Set(["db", "dbWrite", "dbRead", "tx"]);

function isDbHandleCall(node) {
  return (
    node.type === "CallExpression" &&
    node.callee.type === "MemberExpression" &&
    node.callee.object.type === "Identifier" &&
    QUERY_OBJECTS.has(node.callee.object.name)
  );
}

function walk(node, report) {
  if (!node || typeof node.type !== "string") return;
  if (isDbHandleCall(node)) {
    report(node);
    return;
  }
  for (const key of Object.keys(node)) {
    if (key === "parent") continue;
    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child) walk(item, report);
    } else if (child && typeof child.type === "string") {
      walk(child, report);
    }
  }
}

function isPromiseAll(node) {
  return (
    node.type === "CallExpression" &&
    node.callee.type === "MemberExpression" &&
    node.callee.property.name === "all" &&
    node.callee.object.type === "Identifier" &&
    node.callee.object.name === "Promise"
  );
}

/** DB calls inside a `.map()` callback — per-row parallel N+1 (reads only). */
function mapHasPerRowQuery(args) {
  if (args.length === 0 || args[0].type !== "CallExpression") return null;
  const sourceCall = args[0];
  if (
    sourceCall.callee.type !== "MemberExpression" ||
    sourceCall.callee.property.name !== "map"
  ) {
    return null;
  }
  const callback = sourceCall.arguments[sourceCall.arguments.length - 1];
  if (
    !callback ||
    (callback.type !== "ArrowFunctionExpression" &&
      callback.type !== "FunctionExpression")
  ) {
    return null;
  }
  let found = null;
  walk(callback.body, (node) => {
    if (!found && isDbHandleCall(node)) {
      // Writes are serialized on SQLite anyway and often intentional bounded
      // batches; the N+1 concern is per-row reads.
      if (node.callee.property.name !== "delete") found = node;
    }
  });
  return found;
}

function outermostCall(node) {
  let cur = node;
  for (;;) {
    const p = cur.parent;
    if (!p) break;
    if (p.type === "CallExpression" && p.callee === cur) {
      cur = p;
      continue;
    }
    if (p.type === "MemberExpression" && p.object === cur) {
      cur = p;
      continue;
    }
    break;
  }
  return cur;
}

function chainMethodNames(outerCall) {
  const names = new Set();
  let cur = outerCall;
  while (
    cur &&
    cur.type === "CallExpression" &&
    cur.callee.type === "MemberExpression"
  ) {
    names.add(cur.callee.property.name);
    cur = cur.callee.object;
  }
  return names;
}

const noQueryInLoop = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow DB queries inside loops and other N+1 patterns.",
    },
    messages: {
      n1: "DB query inside a loop is an N+1 pattern. Batch the work out of the loop.",
      n1All:
        "Promise.all over a .map() callback issuing per-row DB reads is a parallel N+1. Batch with a single query.",
      unbounded:
        "Unbounded .select() with neither .where() nor .limit() scans the whole table. Constrain the query.",
    },
  },
  create(context) {
    function checkLoop(loopNode) {
      walk(loopNode.body, (node) => {
        context.report({ node, messageId: "n1" });
      });
    }

    function checkCall(node) {
      if (isPromiseAll(node)) {
        const flagged = mapHasPerRowQuery(node.arguments);
        if (flagged) {
          context.report({ node: flagged, messageId: "n1All" });
        }
      }
      if (isDbHandleCall(node)) {
        if (node.callee.property.name !== "select") return;
        const outer = outermostCall(node);
        const names = chainMethodNames(outer);
        if (!names.has("limit") && !names.has("where")) {
          // Aggregates (COUNT/SUM/AVG/MAX/MIN) intentionally scan the full
          // table; they are not unbounded row fetches.
          const firstArg = node.arguments[0];
          const text = firstArg
            ? context.sourceCode.getText(firstArg)
            : "";
          if (!/COUNT\s*\(|SUM\s*\(|AVG\s*\(|MAX\s*\(|MIN\s*\(/.test(text)) {
            context.report({ node: outer, messageId: "unbounded" });
          }
        }
      }
    }

    return {
      ForStatement: checkLoop,
      ForInStatement: checkLoop,
      ForOfStatement: checkLoop,
      WhileStatement: checkLoop,
      DoWhileStatement: checkLoop,
      CallExpression: checkCall,
    };
  },
};

export default noQueryInLoop;
